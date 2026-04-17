import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { rateLimit } from '@/lib/rate-limit'

const PROCESS_SYSTEM_PROMPT = `Você é um especialista em teologia católica com profundo conhecimento do Catecismo da Igreja Católica, Bíblia, Patrística, Magistério e Tradição Sagrada.

Sua tarefa é receber os dados de uma ficha de conhecimento preenchida por um catequista/teólogo e gerar uma entrada estruturada para a base de conhecimento da IA.

REGRAS OBRIGATÓRIAS:
1. NÃO invente referências bíblicas — use APENAS as que foram fornecidas na ficha.
2. NÃO adicione informações que contradizam a doutrina católica.
3. O core_teaching deve ser uma síntese COMPLETA e AUTORITATIVA, integrando TODAS as fontes fornecidas.
4. As keywords devem ser em português, lowercase, sem acentos quando possível, 8-15 termos.
5. bible_references DEVE usar o formato "Livro Cap:Ver" (ex: "Mt 26:26-28", "Jo 6:53-56").
6. A category deve ser consistente com categorias existentes: Sacramentos, Mariologia, Eclesiologia, Moral, Escatologia, Cristologia, Patrística, catecismo_pio_x, sao_tomas, etc.
7. Preserve a fidelidade total ao que foi fornecido — você é um ORGANIZADOR, não um criador de conteúdo.

Responda APENAS em JSON válido, sem markdown fences.`

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    // Rate limit: 10 requests per minute per user (AI processing is expensive)
    if (!(await rateLimit(`knowledge-process:${user.id}`, 10, 60_000))) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
    }

    const body = await req.json()
    const { titulo, fundamento, baseBiblica, baseCatecismo, patristica, teologia, tradicao } = body

    if (!titulo || !fundamento) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: título e fundamento/mensagem' },
        { status: 400 }
      )
    }

    const userPrompt = `DADOS DA FICHA DE CONHECIMENTO:

Título: ${titulo}

O que é / Fundamento / Mensagem:
${fundamento}

Base Bíblica:
${baseBiblica || '(não fornecida)'}

Base do Catecismo (CIC):
${baseCatecismo || '(não fornecida)'}

Patrística (Padres da Igreja):
${patristica || '(não fornecida)'}

Teologia Católica:
${teologia || '(não fornecida)'}

Tradição Sagrada:
${tradicao || '(não fornecida)'}

Gere a entrada estruturada em JSON:
{
  "category": "categoria temática",
  "topic": "título refinado",
  "core_teaching": "síntese completa e autoritativa do ensinamento (mínimo 200 palavras), integrando todas as fontes fornecidas. Cite referências inline. Seja específico e doutrinalmente preciso.",
  "bible_references": ["Livro Cap:Ver", ...],
  "summary": "resumo em 1-2 frases concisas",
  "keywords": ["palavra1", "palavra2", ...],
  "catechism_references": "Referências do CIC formatadas e organizadas",
  "patristic_references": "Referências patrísticas formatadas",
  "theology_notes": "Notas teológicas complementares",
  "tradition_notes": "Notas sobre a Tradição Sagrada"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROCESS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 3000,
      temperature: 0.2,
    })

    const raw = completion.choices[0].message.content ?? ''
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

    let processed
    try {
      processed = JSON.parse(cleaned)
    } catch {
      console.error('[knowledge/process] Failed to parse AI response:', raw.substring(0, 200))
      return NextResponse.json(
        { error: 'A IA retornou um formato inválido. Tente novamente.' },
        { status: 422 }
      )
    }

    // Validate required fields in AI output
    if (!processed.topic || !processed.core_teaching || !processed.summary) {
      return NextResponse.json(
        { error: 'A IA não gerou todos os campos obrigatórios. Tente novamente.' },
        { status: 422 }
      )
    }

    // Ensure arrays
    if (!Array.isArray(processed.bible_references)) processed.bible_references = []
    if (!Array.isArray(processed.keywords)) processed.keywords = []

    return NextResponse.json({ processed })
  } catch (error) {
    console.error('[knowledge/process] Error:', error)
    return NextResponse.json({ error: 'Erro ao processar com IA' }, { status: 500 })
  }
}
