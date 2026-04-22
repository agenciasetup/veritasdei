#!/usr/bin/env node
/**
 * Aplica a migration 20260422120000_create_user_notificacoes_prefs.sql no Supabase.
 *
 * Prefere Management API (SUPABASE_ACCESS_TOKEN) — mais simples, não exige
 * exposição da senha do banco. Fallback para conexão direta via SUPABASE_DB_URL
 * se o token não estiver disponível.
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migration-notificacoes-prefs.mjs
 * ou
 *   SUPABASE_DB_URL=postgres://... node scripts/apply-migration-notificacoes-prefs.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATION_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '20260422120000_create_user_notificacoes_prefs.sql',
)
const PROJECT_REF = 'wwfmfxmhpwphqoxbjybu'

async function viaManagementApi(sql, token) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Management API ${res.status}: ${body}`)
  }
  return res.json().catch(() => ({}))
}

async function viaDirectPg(sql, connectionString) {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString })
  await client.connect()
  try {
    await client.query(sql)
  } finally {
    await client.end()
  }
}

async function main() {
  const sql = await fs.readFile(MIGRATION_PATH, 'utf8')
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

  if (token) {
    console.log('→ Aplicando via Management API…')
    await viaManagementApi(sql, token)
  } else if (dbUrl) {
    console.log('→ Aplicando via conexão direta (pg)…')
    await viaDirectPg(sql, dbUrl)
  } else {
    console.error(
      'Defina SUPABASE_ACCESS_TOKEN (preferido) ou SUPABASE_DB_URL antes de executar.',
    )
    console.error(
      '  SUPABASE_ACCESS_TOKEN você encontra em https://supabase.com/dashboard/account/tokens',
    )
    process.exit(1)
  }

  console.log('✓ Migration aplicada: user_notificacoes_prefs')
}

main().catch((err) => {
  console.error('✗ Falha:', err.message)
  process.exit(1)
})
