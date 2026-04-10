import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Import all hardcoded data
import { DOGMA_CATEGORIES } from '@/features/dogmas/data'
import { SACRAMENTOS } from '@/features/sacramentos/data'
import { MANDAMENTOS } from '@/features/mandamentos/data'
import { PRECEITOS } from '@/features/preceitos/data'
import { ORACOES } from '@/features/oracoes/data'
import { GROUPS as VP_GROUPS } from '@/features/virtudes-pecados/data'
import { OBRA_GROUPS } from '@/features/obras-misericordia/data'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Check if already seeded
  const { data: existing } = await supabase.from('content_groups').select('id').limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Conteúdo já existe. Delete antes de re-importar.' }, { status: 400 })
  }

  const errors: string[] = []

  async function createGroup(slug: string, title: string, subtitle: string, description: string, icon: string, sortOrder: number) {
    const { data, error } = await supabase.from('content_groups').insert({
      slug, title, subtitle, description, icon, sort_order: sortOrder, visible: true,
    }).select('id').single()
    if (error) { errors.push(`Group ${slug}: ${error.message}`); return null }
    return data.id as string
  }

  async function createTopic(groupId: string, slug: string, title: string, subtitle: string | null, description: string | null, icon: string | null, sortOrder: number) {
    const { data, error } = await supabase.from('content_topics').insert({
      group_id: groupId, slug, title, subtitle, description, icon, sort_order: sortOrder, visible: true,
    }).select('id').single()
    if (error) { errors.push(`Topic ${slug}: ${error.message}`); return null }
    return data.id as string
  }

  async function createSubtopic(topicId: string, slug: string, title: string, subtitle: string | null, description: string | null, sortOrder: number) {
    const { data, error } = await supabase.from('content_subtopics').insert({
      topic_id: topicId, slug, title, subtitle, description, sort_order: sortOrder, visible: true,
    }).select('id').single()
    if (error) { errors.push(`Subtopic ${slug}: ${error.message}`); return null }
    return data.id as string
  }

  async function createItem(subtopicId: string, kind: string, title: string | null, body: string, reference: string | null, sortOrder: number) {
    const { error } = await supabase.from('content_items').insert({
      subtopic_id: subtopicId, kind, title, body, reference, sort_order: sortOrder, visible: true,
    })
    if (error) errors.push(`Item ${title || kind}: ${error.message}`)
  }

  function slugify(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // ─── 1. DOGMAS ───
  const dogmasGroupId = await createGroup('dogmas', 'Dogmas da Igreja Católica', '44 verdades de fé reveladas', 'Verdades de fé divinamente reveladas. Selecione uma categoria.', 'church', 1)
  if (dogmasGroupId) {
    for (let ci = 0; ci < DOGMA_CATEGORIES.length; ci++) {
      const cat = DOGMA_CATEGORIES[ci]
      const topicId = await createTopic(dogmasGroupId, slugify(cat.title), cat.title, `${cat.dogmas.length} dogmas`, cat.description, cat.icon, ci + 1)
      if (!topicId) continue
      for (let di = 0; di < cat.dogmas.length; di++) {
        const dogma = cat.dogmas[di]
        const firstSentence = dogma.explanation.split('. ')[0] + '.'
        const subId = await createSubtopic(topicId, slugify(dogma.title), dogma.title, `Dogma ${dogma.id}`, firstSentence, di + 1)
        if (!subId) continue
        await createItem(subId, 'text', 'O que a Igreja ensina', dogma.explanation, null, 1)
        for (let vi = 0; vi < dogma.verses.length; vi++) {
          await createItem(subId, 'verse', null, dogma.verses[vi].text, dogma.verses[vi].reference, vi + 2)
        }
      }
    }
  }

  // ─── 2. SACRAMENTOS ───
  const sacGroupId = await createGroup('sacramentos', 'Os Sete Sacramentos', '7 sinais eficazes da graça', 'Sinais eficazes da graça, instituídos por Cristo. Toque para explorar.', 'droplets', 2)
  if (sacGroupId) {
    for (let si = 0; si < SACRAMENTOS.length; si++) {
      const sac = SACRAMENTOS[si]
      const topicId = await createTopic(sacGroupId, slugify(sac.name), sac.name, sac.latinName, sac.explanation.split('. ')[0] + '.', null, si + 1)
      if (!topicId) continue
      const subId = await createSubtopic(topicId, 'conteudo', sac.name, `${sac.id}º Sacramento`, sac.explanation.split('. ')[0] + '.', 1)
      if (!subId) continue
      let order = 1
      await createItem(subId, 'text', 'O que é', sac.explanation, null, order++)
      await createItem(subId, 'definition', 'Matéria', sac.matter, null, order++)
      await createItem(subId, 'definition', 'Forma', sac.form, null, order++)
      await createItem(subId, 'definition', 'Ministro', sac.minister, null, order++)
      await createItem(subId, 'list', 'Efeitos', sac.effects.join('\n'), null, order++)
      for (const v of sac.verses) {
        await createItem(subId, 'verse', null, v.text, v.reference, order++)
      }
    }
  }

  // ─── 3. MANDAMENTOS ───
  const mandGroupId = await createGroup('mandamentos', 'Os Dez Mandamentos', '10 leis de Deus', 'A Lei de Deus, entregue a Moisés no Sinai. Toque para explorar.', 'tablets', 3)
  if (mandGroupId) {
    for (let mi = 0; mi < MANDAMENTOS.length; mi++) {
      const m = MANDAMENTOS[mi]
      const topicId = await createTopic(mandGroupId, slugify(m.shortTitle), m.title, m.shortTitle, m.explanation.split('. ')[0] + '.', null, mi + 1)
      if (!topicId) continue
      const subId = await createSubtopic(topicId, 'conteudo', m.title, `${m.id}º Mandamento`, m.explanation.split('. ')[0] + '.', 1)
      if (!subId) continue
      let order = 1
      await createItem(subId, 'text', 'O que Deus ordena', m.explanation, null, order++)
      for (const v of m.verses) {
        await createItem(subId, 'verse', null, v.text, v.reference, order++)
      }
    }
  }

  // ─── 4. PRECEITOS ───
  const precGroupId = await createGroup('preceitos', 'Os Cinco Preceitos da Igreja', '5 mandamentos da Igreja', 'O mínimo indispensável de oração e esforço moral. Toque para explorar.', 'scroll-text', 4)
  if (precGroupId) {
    for (let pi = 0; pi < PRECEITOS.length; pi++) {
      const p = PRECEITOS[pi]
      const topicId = await createTopic(precGroupId, slugify(p.title), p.title, p.catechismRef, p.explanation.split('. ')[0] + '.', null, pi + 1)
      if (!topicId) continue
      const subId = await createSubtopic(topicId, 'conteudo', p.title, `${p.id}º Preceito`, p.explanation.split('. ')[0] + '.', 1)
      if (!subId) continue
      let order = 1
      await createItem(subId, 'text', 'O que a Igreja prescreve', p.explanation, p.catechismRef, order++)
      for (const v of p.verses) {
        await createItem(subId, 'verse', null, v.text, v.reference, order++)
      }
    }
  }

  // ─── 5. ORAÇÕES ───
  const CATEGORY_MAP: Record<string, { title: string; slug: string; order: number }> = {
    principal: { title: 'Orações Principais', slug: 'principais', order: 1 },
    credo: { title: 'Profissões de Fé', slug: 'profissoes-de-fe', order: 2 },
    ato: { title: 'Atos de Virtude', slug: 'atos-de-virtude', order: 3 },
    devocional: { title: 'Devoções', slug: 'devocoes', order: 4 },
  }
  const oracGroupId = await createGroup('oracoes', 'Orações da Igreja', '8 orações fundamentais', 'As orações fundamentais da vida cristã católica.', 'book-open', 5)
  if (oracGroupId) {
    const topicIds: Record<string, string> = {}
    for (const [catKey, catInfo] of Object.entries(CATEGORY_MAP)) {
      const tid = await createTopic(oracGroupId, catInfo.slug, catInfo.title, null, null, null, catInfo.order)
      if (tid) topicIds[catKey] = tid
    }
    for (let oi = 0; oi < ORACOES.length; oi++) {
      const o = ORACOES[oi]
      const topicId = topicIds[o.category]
      if (!topicId) continue
      const subId = await createSubtopic(topicId, slugify(o.name), o.name, o.latinName || null, o.explanation.split('. ')[0] + '.', oi + 1)
      if (!subId) continue
      let order = 1
      await createItem(subId, 'text', 'Sobre esta oração', o.explanation, o.origin || null, order++)
      await createItem(subId, 'prayer', o.name, o.text, null, order++)
    }
  }

  // ─── 6. VIRTUDES E PECADOS ───
  const vpGroupId = await createGroup('virtudes-pecados', 'Virtudes e Pecados', '14 virtudes e vícios capitais', 'As virtudes que nos aproximam de Deus e os vícios que nos afastam.', 'scale', 6)
  if (vpGroupId) {
    for (let gi = 0; gi < VP_GROUPS.length; gi++) {
      const group = VP_GROUPS[gi]
      const topicId = await createTopic(vpGroupId, slugify(group.title), group.title, `${group.items.length} itens`, group.description, group.icon, gi + 1)
      if (!topicId) continue
      for (let ii = 0; ii < group.items.length; ii++) {
        const item = group.items[ii]
        const subId = await createSubtopic(topicId, slugify(item.name), item.name, item.opposite ? `Oposto: ${item.opposite}` : null, item.explanation.split('. ')[0] + '.', ii + 1)
        if (!subId) continue
        let order = 1
        await createItem(subId, 'text', 'O que é', item.explanation, null, order++)
        for (const v of item.verses) {
          await createItem(subId, 'verse', null, v.text, v.reference, order++)
        }
      }
    }
  }

  // ─── 7. OBRAS DE MISERICÓRDIA ───
  const obrasGroupId = await createGroup('obras-misericordia', 'Obras de Misericórdia', '14 ações de caridade', '14 ações de caridade — 7 corporais e 7 espirituais — pelas quais socorremos o próximo.', 'heart', 7)
  if (obrasGroupId) {
    for (let gi = 0; gi < OBRA_GROUPS.length; gi++) {
      const group = OBRA_GROUPS[gi]
      const topicId = await createTopic(obrasGroupId, slugify(group.title), group.title, `${group.obras.length} obras`, group.description, group.icon, gi + 1)
      if (!topicId) continue
      for (let oi = 0; oi < group.obras.length; oi++) {
        const obra = group.obras[oi]
        const subId = await createSubtopic(topicId, slugify(obra.name), obra.name, null, obra.explanation.split('. ')[0] + '.', oi + 1)
        if (!subId) continue
        let order = 1
        await createItem(subId, 'text', 'O que significa', obra.explanation, null, order++)
        for (const v of obra.verses) {
          await createItem(subId, 'verse', null, v.text, v.reference, order++)
        }
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors, message: `Importado com ${errors.length} erro(s)` })
  }
  return NextResponse.json({ success: true, message: 'Conteúdo importado com sucesso!' })
}
