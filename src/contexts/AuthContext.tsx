'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeNext } from '@/lib/auth/safe-next'
import { isNativePlatform } from '@/lib/platform/is-native'
import type { Profile, UserRole } from '@/types/auth'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  role: UserRole
}

type OAuthProvider = 'google' | 'facebook' | 'apple'

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, name: string, nextPath?: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMagicLink: (email: string, nextPath?: string) => Promise<{ error: string | null }>
  signInWithOAuth: (provider: OAuthProvider, nextPath?: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const DEFAULT_STATE: AuthState = {
  user: null,
  profile: null,
  session: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
  role: 'user',
}

const AuthContext = createContext<AuthContextValue | null>(null)

const noopAsync = async () => ({ error: 'Supabase not configured' as string | null })

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  if (!supabase) {
    return (
      <AuthContext.Provider
        value={{
          ...DEFAULT_STATE,
          signUp: async () => noopAsync(),
          signInWithPassword: async () => noopAsync(),
          signInWithMagicLink: async () => noopAsync(),
          signInWithOAuth: async () => noopAsync(),
          resetPassword: async () => noopAsync(),
          updatePassword: async () => noopAsync(),
          signOut: async () => {},
          refreshProfile: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return <AuthProviderInner supabase={supabase}>{children}</AuthProviderInner>
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

function getAuthCallbackUrl(baseUrl: string, nextPath?: string): string {
  const next = safeNext(nextPath)
  if (next === '/') return `${baseUrl}/auth/callback`
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`
}

function AuthProviderInner({
  children,
  supabase,
}: {
  children: ReactNode
  supabase: NonNullable<ReturnType<typeof createClient>>
}) {
  const [state, setState] = useState<AuthState>({
    ...DEFAULT_STATE,
    isLoading: true,
  })

  const mountedRef = useRef(true)
  const initDoneRef = useRef(false)

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[Auth] Error fetching profile:', error.message)
        return null
      }
      return data as Profile
    } catch (err) {
      console.error('[Auth] Profile fetch exception:', err)
      return null
    }
  }, [supabase])

  const setAuthState = useCallback(async (session: Session | null) => {
    if (!mountedRef.current) return

    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      if (!mountedRef.current) return
      setState({
        user: session.user,
        profile,
        session,
        isAuthenticated: true,
        isAdmin: profile?.role === 'admin',
        isLoading: false,
        role: profile?.role ?? 'user',
      })
    } else {
      setState({ ...DEFAULT_STATE, isLoading: false })
    }
  }, [fetchProfile])

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user || !mountedRef.current) return
    const profile = await fetchProfile(session.user.id)
    if (profile && mountedRef.current) {
      setState(prev => ({
        ...prev,
        profile,
        isAdmin: profile.role === 'admin',
        role: profile.role,
      }))
    }
  }, [supabase, fetchProfile])

  useEffect(() => {
    mountedRef.current = true
    initDoneRef.current = false

    // ─── Direct initialization with timeout ───
    // Don't rely on INITIAL_SESSION event — call getSession() directly
    // with a 10s timeout. If it hangs (Supabase latency, network), we
    // fall back to no-session state instead of blocking the UI forever.
    async function initAuth() {
      try {
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getSession_timeout')), 10000)
          ),
        ])
        if (!mountedRef.current) return
        initDoneRef.current = true
        await setAuthState(session)
      } catch (err) {
        console.warn('[Auth] Init failed or timed out:', err)
        if (!mountedRef.current) return
        initDoneRef.current = true
        setState(prev => prev.isLoading ? { ...prev, isLoading: false } : prev)
      }
    }

    // Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        // Skip INITIAL_SESSION — we handle init directly above
        if (event === 'INITIAL_SESSION') return

        if (event === 'SIGNED_OUT') {
          setState({ ...DEFAULT_STATE, isLoading: false })
          return
        }
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          await setAuthState(session)
        }
      }
    )

    initAuth()

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [supabase, setAuthState])

  // Refresh session when tab becomes visible again (prevents inactive-tab token expiry)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session } } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('visibility_refresh_timeout')), 5000)
            ),
          ])
          if (session && mountedRef.current) {
            await setAuthState(session)
          }
        } catch {
          // Timeout or error — session will refresh on next interaction
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [supabase, setAuthState])

  const signUp = async (email: string, password: string, name: string, nextPath?: string) => {
    // Verifica se o e-mail / IP estão banidos antes de chamar o Supabase.
    try {
      const check = await fetch('/api/auth/signup-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (check.status === 403) {
        const body = await check.json().catch(() => ({}))
        return { error: body?.detail ?? 'Cadastro bloqueado.' }
      }
    } catch {
      // Se o guard falhar, seguimos — prefiro deixar passar a quebrar signup.
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: getAuthCallbackUrl(getBaseUrl(), nextPath),
      },
    })
    return { error: error?.message ?? null }
  }

  const signInWithPassword = async (email: string, password: string) => {
    // Verifica bloqueio progressivo antes de tentar.
    try {
      const pre = await fetch('/api/auth/login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'check' }),
      })
      if (pre.ok) {
        const state = await pre.json()
        if (state?.throttled) {
          const minutes = Math.ceil((state.retryAfterMs ?? 900000) / 60000)
          return {
            error: `Muitas tentativas. Tente novamente em ${minutes} min ou redefina sua senha.`,
          }
        }
      }
    } catch {
      // deixa passar se o check falhar
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      fetch('/api/auth/log-login-event', { method: 'POST' }).catch(() => {})
    } else {
      fetch('/api/auth/login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'fail' }),
      }).catch(() => {})
    }
    return { error: error?.message ?? null }
  }

  const signInWithOAuth = async (provider: OAuthProvider, nextPath?: string) => {
    // Native (Capacitor): Google/Apple/Facebook em WebView são bloqueados
    // pelos providers (disallowed_useragent). Usamos o SDK nativo do
    // Firebase Authentication pra disparar a tela nativa de login,
    // pegamos o ID token e trocamos por sessão Supabase via
    // signInWithIdToken — sem deep links nem Custom Tabs.
    if (isNativePlatform() && provider === 'google') {
      try {
        const { FirebaseAuthentication } = await import(
          '@capacitor-firebase/authentication'
        )
        const result = await FirebaseAuthentication.signInWithGoogle()
        const idToken = result.credential?.idToken
        if (!idToken) {
          return { error: 'Google login cancelado ou sem token' }
        }
        const nonce = result.credential?.nonce
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          nonce,
        })
        return { error: error?.message ?? null }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Google login falhou'
        return { error: msg }
      }
    }

    // Native + outros providers (Apple, Facebook): cair no fluxo web
    // por enquanto. Mesmo bloqueio se aplica; será necessário
    // FirebaseAuthentication.signInWithApple/Facebook análogo.
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAuthCallbackUrl(getBaseUrl(), nextPath),
      },
    })
    return { error: error?.message ?? null }
  }

  const signInWithMagicLink = async (email: string, nextPath?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl(getBaseUrl(), nextPath),
      },
    })
    return { error: error?.message ?? null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getBaseUrl()}/auth/callback?next=/perfil/seguranca`,
    })
    return { error: error?.message ?? null }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error && state.user) {
      await supabase
        .from('profiles')
        .update({ has_password_set: true })
        .eq('id', state.user.id)
    }
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    try {
      // Em native, deslogamos do Firebase também — caso contrário, no
      // próximo signInWithGoogle a tela aparece "logado" e o user
      // não consegue trocar de conta sem ir nas configs do Google
      // do device.
      if (isNativePlatform()) {
        try {
          const { FirebaseAuthentication } = await import(
            '@capacitor-firebase/authentication'
          )
          await FirebaseAuthentication.signOut()
        } catch {
          // não bloqueia signOut do Supabase se o Firebase falhar
        }
      }
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[Auth] signOut error:', err)
    } finally {
      // Clear local state after API call to prevent stale server session
      setState({ ...DEFAULT_STATE, isLoading: false })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signInWithPassword,
        signInWithMagicLink,
        signInWithOAuth,
        resetPassword,
        updatePassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
