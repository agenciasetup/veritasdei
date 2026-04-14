import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { openai } from '@/lib/openai/client'
import type { LiturgiaDia } from '@/types/liturgia'

interface ReflectionPayload {
  liturgia: LiturgiaDia
  titulo: string
  season: string
  hoje: string
}

function clip(text: string, max = 5000): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function toSection(label: string, referencia?: string | null, texto?: string | null): string {
  if (!texto?.trim()) return `${label}: (indisponível)`
  const ref = referencia?.trim() ? ` [${referencia.trim()}]` : ''
  return `${label}${ref}\n${clip(texto.trim())}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (!rateLimit(`liturgia-reflexao:${user.id}`, 8, 60_000)) {
      return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Serviço de reflexão indisponível no momento.' }, { status: 503 })
    }

    const body = (await req.json()) as Partial<ReflectionPayload>
    if (!body?.liturgia || !body.titulo || !body.season || !body.hoje) {
      return NextResponse.json({ error: 'Dados insuficientes para gerar reflexão.' }, { status: 400 })
    }

    const liturgia = body.liturgia

    const userPrompt = [
      `Data: ${body.hoje}`,
      `Tempo litúrgico: ${body.season}`,
      `Título litúrgico: ${body.titulo}`,
      '',
      toSection('Primeira Leitura', liturgia.primeira_leitura?.referencia, liturgia.primeira_leitura?.texto),
      '',
      toSection('Salmo Responsorial', liturgia.salmo?.referencia, liturgia.salmo?.texto),
      '',
      toSection('Segunda Leitura', liturgia.segunda_leitura?.referencia, liturgia.segunda_leitura?.texto),
      '',
      toSection('Aclamação ao Evangelho', liturgia.aclamacao?.referencia, liturgia.aclamacao?.texto),
      '',
      toSection('Evangelho', liturgia.evangelho?.referencia, liturgia.evangelho?.texto),
    ].join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      max_tokens: 950,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Você é um assistente católico para reflexão da Liturgia Diária.',
            'Sempre fiel à doutrina católica, ao Magistério e ao contexto litúrgico.',
            'NÃO invente leituras nem referências.',
            'Conecte leituras, salmo e evangelho com clareza pastoral e teológica.',
            'Responda em português do Brasil.',
            'Retorne JSON estrito com campos:',
            '{',
            '  "titulo": string,',
            '  "conexao": string,',
            '  "mensagem": string,',
            '  "aplicacao": string,',
            '  "oracao": string,',
            '  "pontos": string[]',
            '}',
          ].join(' '),
        },
        { role: 'user', content: userPrompt },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Não foi possível gerar reflexão no momento.' }, { status: 502 })
    }

    const parsed = JSON.parse(content) as {
      titulo?: string
      conexao?: string
      mensagem?: string
      aplicacao?: string
      oracao?: string
      pontos?: string[]
    }

    return NextResponse.json({
      titulo: parsed.titulo || `Reflexão — ${body.titulo}`,
      conexao: parsed.conexao || 'As leituras convergem para um chamado concreto de conversão e confiança em Deus.',
      mensagem: parsed.mensagem || 'Hoje, o Senhor chama a viver a fé com verdade, perseverança e caridade.',
      aplicacao: parsed.aplicacao || 'Escolha um gesto concreto de obediência ao Evangelho e viva-o hoje com generosidade.',
      oracao: parsed.oracao || 'Senhor, dá-me um coração dócil à tua Palavra e firme na tua vontade. Amém.',
      pontos: Array.isArray(parsed.pontos) ? parsed.pontos.slice(0, 5) : [],
    })
  } catch (error) {
    console.error('[api/liturgia/reflexao] Error:', error)
    return NextResponse.json({ error: 'Erro ao gerar reflexão.' }, { status: 500 })
  }
}
