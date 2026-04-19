import { NextResponse } from 'next/server'
import { requireSystemAdmin } from '@/lib/auth/require-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `Você é um teólogo católico ortodoxo ajudando a escrever material de estudo aprofundado em português brasileiro para um aplicativo católico. Produza conteúdo fiel ao Magistério da Igreja Católica, enraizado na Tradição, Sagrada Escritura e no ensino dos Padres da Igreja.

Para cada conteúdo, retorne APENAS JSON válido com este schema:

{
  "sections": [
    { "slug": "contexto_historico", "title": "Contexto histórico", "body": "..." },
    { "slug": "padres_da_igreja", "title": "Padres da Igreja", "body": "..." },
    { "slug": "magisterio", "title": "Magistério da Igreja", "body": "..." },
    { "slug": "aplicacao", "title": "Aplicação na vida cristã", "body": "..." }
  ],
  "sources": [
    { "kind": "scripture|catechism|council|papal|father|other", "label": "...", "url": null, "page": null }
  ]
}

Regras:
- Cada body tem entre 3 e 8 parágrafos substantivos.
- Cite Padres da Igreja, documentos conciliares (Trento, Vaticano I, Vaticano II), encíclicas.
- Use referências bíblicas quando apropriado (ex: Mt 16,18).
- Não invente citações. Se não tiver certeza da referência exata, omita.
- Tom reverente, claro e acessível, sem jargão acadêmico excessivo.
- Em "sources", liste 3 a 8 fontes reais citadas no texto.`

type Body = {
  content_type: string
  content_ref: string
  subject_title: string
  subject_description?: string | null
}

export async function POST(request: Request) {
  const userId = await requireSystemAdmin()
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY não configurada' },
      { status: 503 },
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!body.content_type || !body.content_ref || !body.subject_title) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const userPrompt = `Pilar: ${body.content_type}
Tópico/Subtópico: ${body.subject_title}
${body.subject_description ? `Descrição: ${body.subject_description}` : ''}

Produza o conteúdo aprofundado seguindo o schema JSON.`

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!anthropicRes.ok) {
    const text = await anthropicRes.text()
    return NextResponse.json(
      { error: 'anthropic_error', detail: text.slice(0, 500) },
      { status: 502 },
    )
  }

  const payload = (await anthropicRes.json()) as {
    content?: Array<{ type: string; text?: string }>
  }
  const textBlock = payload.content?.find((b) => b.type === 'text')?.text || ''
  const jsonMatch = textBlock.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json(
      { error: 'parse_error', detail: textBlock.slice(0, 500) },
      { status: 502 },
    )
  }

  let parsed: { sections: unknown; sources?: unknown }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'json_parse_error' }, { status: 502 })
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('content_deepdive')
    .upsert(
      {
        content_type: body.content_type,
        content_ref: body.content_ref,
        sections: parsed.sections ?? [],
        sources: parsed.sources ?? [],
        status: 'draft',
        created_by: userId,
      },
      { onConflict: 'content_type,content_ref' },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deepdive: data })
}
