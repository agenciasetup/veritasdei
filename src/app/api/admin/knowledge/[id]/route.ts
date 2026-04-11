import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', status: 401 }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Sem permissão', status: 403 }

  return { error: null, status: 200 }
}

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/admin/knowledge/[id] — Fetch single entry */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { id } = await ctx.params
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('ai_knowledge_base')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Entrada não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[knowledge] GET by id error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** PUT /api/admin/knowledge/[id] — Update entry */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { id } = await ctx.params
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
      .update({
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
        status: status ?? 'active',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[knowledge] Update error:', error.message)
      return NextResponse.json({ error: 'Erro ao atualizar entrada' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[knowledge] PUT error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** DELETE /api/admin/knowledge/[id] — Remove entry */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { id } = await ctx.params
    const admin = createAdminClient()

    const { error } = await admin
      .from('ai_knowledge_base')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[knowledge] Delete error:', error.message)
      return NextResponse.json({ error: 'Erro ao deletar entrada' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[knowledge] DELETE error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
