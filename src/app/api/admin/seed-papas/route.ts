import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { POPES_DATA } from '@/data/popes'

export const maxDuration = 300 // 5 min for large seed

export async function POST() {
  const admin = createAdminClient()

  const results: { ok: number; errors: string[] } = { ok: 0, errors: [] }

  // 1. Seed Jesus Cristo (user_number = 1)
  try {
    const { data: jesusAuth, error: jesusErr } = await admin.auth.admin.createUser({
      email: 'jesuscristo@veritasdei.com.br',
      password: 'VeritasDei@JC1',
      email_confirm: true,
      user_metadata: { name: 'Jesus Cristo' },
    })
    if (jesusErr && !jesusErr.message.includes('already been registered')) {
      results.errors.push(`Jesus: ${jesusErr.message}`)
    } else {
      const uid = jesusAuth?.user?.id
      if (uid) {
        await admin.from('profiles').upsert({
          id: uid,
          user_number: 1,
          name: 'Jesus Cristo',
          email: 'jesuscristo@veritasdei.com.br',
          vocacao: 'papa',
          falecido: false, // Ressuscitou :)
          onboarding_completed: true,
          role: 'user',
          status: 'active',
          plan: 'free',
          verified: true,
        }, { onConflict: 'id' })
        results.ok++
      }
    }
  } catch (e) {
    results.errors.push(`Jesus: ${e}`)
  }

  // 2. Seed all Popes (user_number = 2..267)
  for (const pope of POPES_DATA) {
    try {
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: pope.email,
        password: 'VeritasDei@Papa' + pope.user_number,
        email_confirm: true,
        user_metadata: { name: pope.name },
      })

      if (authErr && !authErr.message.includes('already been registered')) {
        results.errors.push(`#${pope.user_number} ${pope.name}: ${authErr.message}`)
        continue
      }

      // If user already exists, find their ID
      let uid = authData?.user?.id
      if (!uid) {
        const { data: existing } = await admin
          .from('profiles')
          .select('id')
          .eq('email', pope.email)
          .maybeSingle()
        uid = existing?.id
      }

      if (uid) {
        await admin.from('profiles').upsert({
          id: uid,
          user_number: pope.user_number,
          name: pope.name,
          email: pope.email,
          vocacao: 'papa',
          falecido: pope.falecido,
          onboarding_completed: true,
          role: 'user',
          status: 'active',
          plan: 'free',
          verified: true,
          profile_image_url: pope.image_url ?? null,
          diocese: pope.diocese ?? null,
          pais: pope.country ?? null,
        }, { onConflict: 'id' })
        results.ok++
      }
    } catch (e) {
      results.errors.push(`#${pope.user_number} ${pope.name}: ${e}`)
    }
  }

  // 3. Assign user_number 301 to contato@agenciasetup.com.br if they exist
  try {
    const { data: setupUser } = await admin
      .from('profiles')
      .select('id, user_number')
      .eq('email', 'contato@agenciasetup.com.br')
      .maybeSingle()

    if (setupUser && !setupUser.user_number) {
      await admin
        .from('profiles')
        .update({ user_number: 301 })
        .eq('id', setupUser.id)
      results.ok++
    }
  } catch (e) {
    results.errors.push(`contato@agenciasetup: ${e}`)
  }

  // 4. Sync sequence to 302 so next auto-increment starts after reserved IDs
  try {
    await admin.rpc('setval_user_number_seq' as never)
  } catch {
    // Function may not exist yet, sequence default (301) is fine
  }

  return NextResponse.json({
    message: `Seed concluído. ${results.ok} criados.`,
    errors: results.errors,
  })
}
