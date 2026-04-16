import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sanitizePostgrestFilter } from '@/lib/utils/sanitize'

async function checkAdmin() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado', status: 401, user: null }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Sem permissão', status: 403, user: null }

    return { error: null, status: 200, user }
  } catch {
    return { error: 'Não autenticado', status: 401, user: null }
  }
}

/** GET /api/admin/knowledge — List entries with search/filter/pagination */
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { searchParams } = new URL(req.url)
    // Limita tamanho do search — evita queries pesadas e reduz superfície de
    // manipulação do filtro PostgREST.
    const rawSearch = (searchParams.get('search') ?? '').slice(0, 100).trim()
    const rawCategory = (searchParams.get('category') ?? '').slice(0, 64).trim()
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const offset = (page - 1) * limit

    const admin = createAdminClient()

    let query = admin
      .from('ai_knowledge_base')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (rawSearch) {
      // sanitizePostgrestFilter escapa vírgula, parênteses, % e _ para que o
      // search não consiga injetar filtros extras no .or().
      const safe = sanitizePostgrestFilter(rawSearch)
      query = query.or(`topic.ilike.%${safe}%,summary.ilike.%${safe}%,core_teaching.ilike.%${safe}%`)
    }

    if (rawCategory) {
      query = query.eq('category', rawCategory)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('[knowledge] List error:', error.message)
      return NextResponse.json({ error: 'Erro ao listar entradas' }, { status: 500 })
    }

    // Get distinct categories for filter dropdown
    const { data: catData } = await admin
      .from('ai_knowledge_base')
      .select('category')

    const categories = [...new Set((catData ?? []).map(c => c.category))].sort()

    return NextResponse.json({ data: data ?? [], total: count ?? 0, categories })
  } catch (error) {
    console.error('[knowledge] GET error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** POST /api/admin/knowledge — Create a new entry */
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = await req.json()

    const {
      category, topic, core_teaching, bible_references, summary, keywords,
      catechism_references, patristic_references, theology_notes, tradition_notes,
      source_input, status,
    } = body

    if (!topic || !core_teaching || !summary) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: topic, core_teaching, summary' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('ai_knowledge_base')
      .insert({
        category: category ?? '',
        topic,
        core_teaching,
        bible_references: bible_references ?? [],
        summary,
        keywords: keywords ?? [],
        catechism_references: catechism_references ?? '',
        patristic_references: patristic_references ?? '',
        theology_notes: theology_notes ?? '',
        tradition_notes: tradition_notes ?? '',
        source_input: source_input ?? {},
        created_by: auth.user!.id,
        status: status ?? 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('[knowledge] Insert error:', error.message)
      return NextResponse.json({ error: 'Erro ao criar entrada' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[knowledge] POST error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
