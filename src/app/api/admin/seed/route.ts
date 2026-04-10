import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Import all hardcoded data
import { DOGMA_CATEGORIES } from '@/features/dogmas/data'
import { SACRAMENTOS } from '@/features/sacramentos/data'
import { MANDAMENTOS } from '@/features/mandamentos/data'
import { PRECEITOS } from '@/features/preceitos/data'
import { ORACOES } from '@/features/oracoes/data'
import { GROUPS as VP_GROUPS } from '@/features/virtudes-pecados/data'
import { OBRA_GROUPS } from '@/features/obras-misericordia/data'

// Import legacy trails
import { TRAILS_1 } from '@/features/trilhas/trails1'
import { TRAILS_2 } from '@/features/trilhas/trails2'
import { TRAILS_3 } from '@/features/trilhas/trails3'
import { TRAILS_4 } from '@/features/trilhas/trails4'
import { TRAILS_5 } from '@/features/trilhas/trails5'
import { TRAILS_6 } from '@/features/trilhas/trails6'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === 'true'
  const seedTrails = searchParams.get('trails') === 'true'

  // If seeding trails
  if (seedTrails) {
    return await handleSeedTrails(supabase)
  }

  // Check if already seeded
  const { data: existing } = await supabase.from('content_groups').select('id').limit(1)
  if (existing && existing.length > 0) {
    if (force) {
      // Delete all content in reverse order (items → subtopics → topics → groups)
      await supabase.from('content_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('content_subtopics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('content_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('content_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    } else {
      return NextResponse.json({ error: 'Conteúdo já existe. Use ?force=true para re-importar (apaga tudo e reimporta).' }, { status: 400 })
    }
  }

  const errors: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function createGroup(slug: string, title: string, subtitle: string, description: string, icon: string, sortOrder: number): Promise<string | null> {
    const { data, error } = await supabase.from('content_groups').insert({
      slug, title, subtitle, description, icon, sort_order: sortOrder, visible: true,
    }).select('id').single()
    if (error) { errors.push(`Group [${slug}]: ${error.message}`); return null }
    return data.id as string
  }

  async function createTopic(groupId: string, slug: string, title: string, subtitle: string | null, description: string | null, icon: string | null, sortOrder: number): Promise<string | null> {
    const { data, error } = await supabase.from('content_topics').insert({
      group_id: groupId, slug, title, subtitle, description, icon, sort_order: sortOrder, visible: true,
    }).select('id').single()
    if (error) { errors.push(`Topic [${slug}]: ${error.message}`); return null }
    return data.id as string
  }

  async function createSubtopic(topicId: string, slug: string, title: string, subtitle: string | null, description: string | null, sortOrder: number): Promise<string | null> {
    const { data, error } = await supabase.from('content_subtopics').insert({
      topic_id: topicId, slug, title, subtitle, description, sort_order: sortOrder, visible: true,
    }).select('id').single()
    if (error) { errors.push(`Subtopic [${slug}]: ${error.message}`); return null }
    return data.id as string
  }

  async function createItem(subtopicId: string, kind: string, title: string | null, body: string, reference: string | null, sortOrder: number) {
    // Use 'text' as fallback for 'list' kind (DB constraint may not include 'list')
    const safeKind = kind === 'list' ? 'text' : kind
    const { error } = await supabase.from('content_items').insert({
      subtopic_id: subtopicId, kind: safeKind, title, body, reference, sort_order: sortOrder, visible: true,
    })
    if (error) errors.push(`Item [${title || safeKind}]: ${error.message}`)
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
      // Store effects as text (DB constraint doesn't allow 'list' kind)
      await createItem(subId, 'text', 'Efeitos', sac.effects.map((e, i) => `${i + 1}. ${e}`).join('\n'), null, order++)
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
    return NextResponse.json({ success: false, errors, message: `Importado com ${errors.length} erro(s). Detalhes: ${errors.slice(0, 5).join('; ')}` })
  }
  return NextResponse.json({ success: true, message: 'Conteúdo importado com sucesso!' })
}

// ─── Seed legacy trails ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSeedTrails(supabase: any) {
  const ALL_TRAILS = [
    ...TRAILS_1, ...TRAILS_2, ...TRAILS_3,
    ...TRAILS_4, ...TRAILS_5, ...TRAILS_6,
  ]

  // Check if trails table exists
  const { error: checkError } = await supabase.from('trails').select('id').limit(1)
  if (checkError && checkError.code === '42P01') {
    return NextResponse.json({
      error: 'Tabela "trails" não existe. Execute o SQL de migração no Supabase SQL Editor primeiro.',
      sql: `-- Execute no Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  difficulty TEXT DEFAULT 'Iniciante',
  color TEXT DEFAULT '#C9A84C',
  icon_name TEXT DEFAULT 'GraduationCap',
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trail_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  content_subtopic_id UUID REFERENCES content_subtopics(id) ON DELETE SET NULL,
  custom_content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read trails" ON trails FOR SELECT USING (visible = true);
CREATE POLICY "Admin manage trails" ON trails FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public read trail_steps" ON trail_steps FOR SELECT USING (true);
CREATE POLICY "Admin manage trail_steps" ON trail_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);`
    }, { status: 400 })
  }

  // Check if already seeded
  const { data: existingTrails } = await supabase.from('trails').select('id').limit(1)
  if (existingTrails && existingTrails.length > 0) {
    // Delete existing
    await supabase.from('trail_steps').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('trails').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  const errors: string[] = []

  for (let ti = 0; ti < ALL_TRAILS.length; ti++) {
    const trail = ALL_TRAILS[ti]
    const { data: trailData, error: trailError } = await supabase.from('trails').insert({
      title: trail.title,
      subtitle: trail.subtitle,
      description: trail.description,
      difficulty: trail.difficulty,
      color: trail.color,
      icon_name: trail.iconName,
      sort_order: ti + 1,
      visible: true,
    }).select('id').single()

    if (trailError) {
      errors.push(`Trail [${trail.title}]: ${trailError.message}`)
      continue
    }

    for (let si = 0; si < trail.steps.length; si++) {
      const step = trail.steps[si]
      const { error: stepError } = await supabase.from('trail_steps').insert({
        trail_id: trailData.id,
        label: step.label,
        description: step.description,
        custom_content: step.content,
        sort_order: si + 1,
      })
      if (stepError) errors.push(`Step [${step.label}]: ${stepError.message}`)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors, message: `Trilhas importadas com ${errors.length} erro(s). ${errors.slice(0, 3).join('; ')}` })
  }
  return NextResponse.json({ success: true, message: `${ALL_TRAILS.length} trilhas importadas com sucesso!` })
}
