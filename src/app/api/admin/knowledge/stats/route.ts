import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/** GET /api/admin/knowledge/stats — Knowledge base statistics & integrity check */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const admin = createAdminClient()

    // Fetch all entries for stats
    const { data: entries, error } = await admin
      .from('ai_knowledge_base')
      .select('category, keywords, core_teaching, updated_at, status')

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    const allEntries = entries ?? []

    // Count by category
    const categories: Record<string, number> = {}
    let missingKeywords = 0
    let emptyTeachings = 0
    let lastUpdated: string | null = null

    for (const entry of allEntries) {
      categories[entry.category] = (categories[entry.category] || 0) + 1
      if (!entry.keywords || entry.keywords.length === 0) missingKeywords++
      if (!entry.core_teaching || entry.core_teaching.trim().length < 50) emptyTeachings++
      if (!lastUpdated || (entry.updated_at && entry.updated_at > lastUpdated)) {
        lastUpdated = entry.updated_at
      }
    }

    // Count by status
    const statusCounts: Record<string, number> = {}
    for (const entry of allEntries) {
      const s = entry.status || 'active'
      statusCounts[s] = (statusCounts[s] || 0) + 1
    }

    return NextResponse.json({
      totalEntries: allEntries.length,
      categories,
      statusCounts,
      lastUpdated,
      integrity: {
        missingKeywords,
        emptyTeachings,
      },
    })
  } catch (error) {
    console.error('[knowledge/stats] Error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
