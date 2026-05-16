'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook que gerencia a chamada de áudio em grupo dentro de uma sala de
 * terço (Frente 3).
 *
 * Arquitetura:
 *   - **Sinalização**: Supabase Realtime broadcast no canal
 *     `rosario:voice:<roomId>`. Eventos: voice:join, voice:leave,
 *     voice:offer, voice:answer, voice:ice, voice:mute.
 *   - **Mídia**: WebRTC peer-to-peer em malha. Cada par mantém uma
 *     `RTCPeerConnection`. Adequado pra até ~6 pessoas.
 *   - **STUN**: servidores públicos do Google (sem TURN — NATs
 *     simétricos podem falhar). Pra ambientes corporativos, adicionar
 *     TURN posteriormente.
 *   - **Glare resolution**: dos dois lados de uma conexão, quem tem o
 *     `user_id` menor (string compare) inicia a offer. Garante direção
 *     única, evita colisões.
 *   - **Speaking detection**: AnalyserNode pega frequency data; média
 *     acima de um threshold marca o user como "falando". RAF loop a
 *     ~30fps.
 *
 * Limitações conhecidas:
 *   - Sem HTTPS, `getUserMedia` falha. App em produção precisa estar em
 *     contexto seguro (já é o caso em veritasdei.com.br).
 *   - iOS Safari requer interação do usuário pra tocar áudio remoto;
 *     o botão "Entrar com voz" cumpre esse requisito.
 *   - Sem reconexão automática após network drop por enquanto — basta
 *     o usuário clicar "Entrar com voz" de novo.
 *
 * Uso:
 *   const voice = useRoomVoiceChat(roomId, viewerUserId)
 *   <button onClick={voice.joinVoice}>Entrar com voz</button>
 */

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

const SPEAKING_THRESHOLD = 28
const SPEAKING_SAMPLE_INTERVAL_MS = 100

export interface UseRoomVoiceChatReturn {
  /** Browser suporta WebRTC + getUserMedia? */
  supported: boolean
  /** Usuário entrou no canal de áudio (mic já capturado e conexões abertas)? */
  joined: boolean
  /** Solicitação de mic em andamento. */
  joining: boolean
  /** Mic local mutado? */
  muted: boolean
  /** Última mensagem de erro (negação de permissão, falha WebRTC, etc.). */
  error: string | null
  /** IDs dos users que estão atualmente no canal de áudio (inclui o viewer). */
  voiceJoinedUserIds: ReadonlySet<string>
  /** IDs dos users que estão FALANDO agora. */
  speakingUserIds: ReadonlySet<string>
  /** IDs dos users que estão mutados. */
  mutedUserIds: ReadonlySet<string>
  joinVoice: () => Promise<void>
  leaveVoice: () => void
  toggleMute: () => void
}

export function useRoomVoiceChat(
  roomId: string | null,
  viewerUserId: string,
): UseRoomVoiceChatReturn {
  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceJoinedUserIds, setVoiceJoinedUserIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [speakingUserIds, setSpeakingUserIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [mutedUserIds, setMutedUserIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )

  // Refs mutáveis pra estado WebRTC.
  const channelRef = useRef<RealtimeChannel | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map())
  const speakingRafRef = useRef<number | null>(null)
  const speakingLastSampleRef = useRef(0)
  const cleanedUpRef = useRef(false)

  const supported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window.RTCPeerConnection === 'function'

  // ── Helpers internos ─────────────────────────────────────────────────────

  const broadcast = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      const channel = channelRef.current
      if (!channel) return
      await channel.send({
        type: 'broadcast',
        event,
        payload: { ...payload, from: viewerUserId },
      })
    },
    [viewerUserId],
  )

  const teardownPeer = useCallback((remoteUserId: string) => {
    const pc = peersRef.current.get(remoteUserId)
    if (pc) {
      try {
        pc.getSenders().forEach((s) => {
          try { pc.removeTrack(s) } catch {}
        })
        pc.close()
      } catch {}
      peersRef.current.delete(remoteUserId)
    }
    const audio = audioElementsRef.current.get(remoteUserId)
    if (audio) {
      audio.pause()
      audio.srcObject = null
      audio.remove()
      audioElementsRef.current.delete(remoteUserId)
    }
    const analyser = analysersRef.current.get(remoteUserId)
    if (analyser) {
      try { analyser.disconnect() } catch {}
      analysersRef.current.delete(remoteUserId)
    }
  }, [])

  const installRemoteStream = useCallback(
    (remoteUserId: string, stream: MediaStream) => {
      // Garante um <audio> playing o remote stream.
      let audio = audioElementsRef.current.get(remoteUserId)
      if (!audio) {
        audio = document.createElement('audio')
        audio.autoplay = true
        audio.dataset.voiceRemoteUser = remoteUserId
        // Não anexa no DOM visível — fica orfão no doc, browser toca igual.
        document.body.appendChild(audio)
        audioElementsRef.current.set(remoteUserId, audio)
      }
      audio.srcObject = stream
      audio.play().catch(() => {
        // iOS pode bloquear sem gesto; o "Entrar com voz" já é o gesto,
        // mas se algo der errado o usuário pode interagir de novo.
      })

      // Análise pra speaking detection
      const ctx = audioCtxRef.current
      if (ctx) {
        try {
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 512
          source.connect(analyser)
          analysersRef.current.set(remoteUserId, analyser)
        } catch {}
      }
    },
    [],
  )

  const createPeerConnection = useCallback(
    (remoteUserId: string): RTCPeerConnection => {
      const existing = peersRef.current.get(remoteUserId)
      if (existing) return existing

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      peersRef.current.set(remoteUserId, pc)

      // Add local tracks
      const local = localStreamRef.current
      if (local) {
        for (const track of local.getTracks()) {
          pc.addTrack(track, local)
        }
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          void broadcast('voice:ice', {
            to: remoteUserId,
            candidate: e.candidate.toJSON(),
          })
        }
      }

      pc.ontrack = (e) => {
        const [stream] = e.streams
        if (stream) installRemoteStream(remoteUserId, stream)
      }

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed' ||
          pc.connectionState === 'disconnected'
        ) {
          teardownPeer(remoteUserId)
        }
      }

      return pc
    },
    [broadcast, installRemoteStream, teardownPeer],
  )

  // Glare resolution: o de menor user_id (string compare) é polite/initiator.
  // Simplificação: quem tem menor id INICIA. Eliminamos negociação simultânea.
  const shouldInitiate = useCallback(
    (otherUserId: string) => viewerUserId < otherUserId,
    [viewerUserId],
  )

  const sendOffer = useCallback(
    async (remoteUserId: string) => {
      const pc = createPeerConnection(remoteUserId)
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await broadcast('voice:offer', {
          to: remoteUserId,
          sdp: offer.sdp,
          type: offer.type,
        })
      } catch (err) {
        console.error('[voice] sendOffer failed', err)
      }
    },
    [createPeerConnection, broadcast],
  )

  const handleOffer = useCallback(
    async (
      remoteUserId: string,
      offer: { sdp: string; type: RTCSdpType },
    ) => {
      const pc = createPeerConnection(remoteUserId)
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        await broadcast('voice:answer', {
          to: remoteUserId,
          sdp: answer.sdp,
          type: answer.type,
        })
      } catch (err) {
        console.error('[voice] handleOffer failed', err)
      }
    },
    [createPeerConnection, broadcast],
  )

  const handleAnswer = useCallback(
    async (
      remoteUserId: string,
      answer: { sdp: string; type: RTCSdpType },
    ) => {
      const pc = peersRef.current.get(remoteUserId)
      if (!pc) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (err) {
        console.error('[voice] handleAnswer failed', err)
      }
    },
    [],
  )

  const handleIce = useCallback(
    async (
      remoteUserId: string,
      candidate: RTCIceCandidateInit,
    ) => {
      const pc = peersRef.current.get(remoteUserId)
      if (!pc) return
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        // ICE candidates podem chegar antes do setRemoteDescription —
        // ignorar erro nesse caso é seguro pro happy path.
      }
    },
    [],
  )

  const startSpeakingLoop = useCallback(() => {
    if (speakingRafRef.current !== null) return
    const tick = () => {
      speakingRafRef.current = requestAnimationFrame(tick)
      const now = performance.now()
      if (now - speakingLastSampleRef.current < SPEAKING_SAMPLE_INTERVAL_MS) return
      speakingLastSampleRef.current = now

      const next = new Set<string>()
      for (const [userId, analyser] of analysersRef.current) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        const avg = sum / data.length
        if (avg > SPEAKING_THRESHOLD) next.add(userId)
      }
      // Speaking local não passa pelo analyser (não temos analyser do
      // próprio stream). Adicionamos via análise do local stream também.
      const localAnalyser = analysersRef.current.get(viewerUserId)
      if (localAnalyser) {
        // já incluído no loop acima.
      }
      setSpeakingUserIds(next)
    }
    speakingRafRef.current = requestAnimationFrame(tick)
  }, [viewerUserId])

  const stopSpeakingLoop = useCallback(() => {
    if (speakingRafRef.current !== null) {
      cancelAnimationFrame(speakingRafRef.current)
      speakingRafRef.current = null
    }
    setSpeakingUserIds(new Set())
  }, [])

  // ── joinVoice / leaveVoice ───────────────────────────────────────────────

  const teardown = useCallback(() => {
    if (cleanedUpRef.current) return
    cleanedUpRef.current = true

    stopSpeakingLoop()

    // Close all peers
    for (const userId of Array.from(peersRef.current.keys())) {
      teardownPeer(userId)
    }

    // Stop local stream
    const local = localStreamRef.current
    if (local) {
      for (const track of local.getTracks()) {
        try { track.stop() } catch {}
      }
      localStreamRef.current = null
    }

    // Close audio context
    const ctx = audioCtxRef.current
    if (ctx && ctx.state !== 'closed') {
      try { void ctx.close() } catch {}
      audioCtxRef.current = null
    }

    // Unsubscribe channel
    const channel = channelRef.current
    if (channel) {
      const supabase = createClient()
      if (supabase) void supabase.removeChannel(channel)
      channelRef.current = null
    }

    setJoined(false)
    setVoiceJoinedUserIds(new Set())
    setMutedUserIds(new Set())
  }, [stopSpeakingLoop, teardownPeer])

  const leaveVoice = useCallback(() => {
    if (!cleanedUpRef.current) {
      void broadcast('voice:leave', {})
    }
    teardown()
  }, [broadcast, teardown])

  const joinVoice = useCallback(async () => {
    if (!supported || !roomId) return
    if (joined || joining) return
    setError(null)
    setJoining(true)
    cleanedUpRef.current = false

    try {
      // 1. Permission + local stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      localStreamRef.current = stream

      // 2. Audio context for analysers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      const ctx: AudioContext = new Ctx()
      audioCtxRef.current = ctx

      // Local analyser (pra mostrar o próprio user como "falando")
      try {
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        analysersRef.current.set(viewerUserId, analyser)
      } catch {}

      // 3. Subscribe canal de sinalização
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Supabase client indisponível')
      }
      const channel = supabase.channel(`rosario:voice:${roomId}`, {
        config: { broadcast: { self: false } },
      })

      type B<T> = { payload: T }
      channel.on('broadcast', { event: 'voice:join' }, ((msg: B<{ from: string }>) => {
        const other = msg.payload.from
        if (other === viewerUserId) return
        setVoiceJoinedUserIds((prev) => {
          if (prev.has(other)) return prev
          const next = new Set(prev)
          next.add(other)
          return next
        })
        // Glare: quem tem id menor inicia a offer.
        if (shouldInitiate(other)) {
          void sendOffer(other)
        }
        // O outro lado também precisa saber que EU estou aqui — re-broadcast
        // não é necessário porque cada novo participante manda voice:join
        // ao entrar, e eu já estou subscrito antes dele se eu sou o anterior.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any)

      channel.on('broadcast', { event: 'voice:leave' }, ((msg: B<{ from: string }>) => {
        const other = msg.payload.from
        if (other === viewerUserId) return
        setVoiceJoinedUserIds((prev) => {
          if (!prev.has(other)) return prev
          const next = new Set(prev)
          next.delete(other)
          return next
        })
        setMutedUserIds((prev) => {
          if (!prev.has(other)) return prev
          const next = new Set(prev)
          next.delete(other)
          return next
        })
        teardownPeer(other)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any)

      channel.on('broadcast', { event: 'voice:offer' }, ((msg: B<{
        from: string; to: string; sdp: string; type: RTCSdpType
      }>) => {
        const p = msg.payload
        if (p.to !== viewerUserId) return
        void handleOffer(p.from, { sdp: p.sdp, type: p.type })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any)

      channel.on('broadcast', { event: 'voice:answer' }, ((msg: B<{
        from: string; to: string; sdp: string; type: RTCSdpType
      }>) => {
        const p = msg.payload
        if (p.to !== viewerUserId) return
        void handleAnswer(p.from, { sdp: p.sdp, type: p.type })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any)

      channel.on('broadcast', { event: 'voice:ice' }, ((msg: B<{
        from: string; to: string; candidate: RTCIceCandidateInit
      }>) => {
        const p = msg.payload
        if (p.to !== viewerUserId) return
        void handleIce(p.from, p.candidate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any)

      channel.on('broadcast', { event: 'voice:mute' }, ((msg: B<{
        from: string; muted: boolean
      }>) => {
        const p = msg.payload
        setMutedUserIds((prev) => {
          const has = prev.has(p.from)
          if (p.muted && has) return prev
          if (!p.muted && !has) return prev
          const next = new Set(prev)
          if (p.muted) next.add(p.from)
          else next.delete(p.from)
          return next
        })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any)

      await new Promise<void>((resolve, reject) => {
        let settled = false
        channel.subscribe((status: string) => {
          if (settled) return
          if (status === 'SUBSCRIBED') {
            settled = true
            resolve()
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            settled = true
            reject(new Error(`Realtime channel ${status}`))
          }
        })
        // safety timeout
        setTimeout(() => {
          if (!settled) {
            settled = true
            reject(new Error('Realtime subscribe timeout'))
          }
        }, 8000)
      })

      channelRef.current = channel

      // 4. Anuncia entrada
      await broadcast('voice:join', {})
      // Estado inicial não-mutado também broadcast pra UI dos outros
      await broadcast('voice:mute', { muted: false })

      // 5. Set self joined
      setVoiceJoinedUserIds((prev) => {
        const next = new Set(prev)
        next.add(viewerUserId)
        return next
      })
      startSpeakingLoop()
      setJoined(true)
      setMutedState(false)
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Permissão de microfone negada. Habilite nas preferências do navegador.'
            : err.message
          : 'Erro ao iniciar áudio.'
      setError(errMsg)
      teardown()
    } finally {
      setJoining(false)
    }
  }, [
    supported, roomId, joined, joining, viewerUserId,
    handleOffer, handleAnswer, handleIce, sendOffer,
    broadcast, teardown, teardownPeer, shouldInitiate, startSpeakingLoop,
  ])

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const nextMuted = !muted
    for (const track of stream.getAudioTracks()) {
      track.enabled = !nextMuted
    }
    setMutedState(nextMuted)
    void broadcast('voice:mute', { muted: nextMuted })
  }, [muted, broadcast])

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Tenta anunciar saída antes de derrubar.
      try { void broadcast('voice:leave', {}) } catch {}
      teardown()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    supported,
    joined,
    joining,
    muted,
    error,
    voiceJoinedUserIds,
    speakingUserIds,
    mutedUserIds,
    joinVoice,
    leaveVoice,
    toggleMute,
  }
}
