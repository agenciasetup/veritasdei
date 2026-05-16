#!/usr/bin/env node
/**
 * Aplica a migration 20260516120000_rosary_room_identity_and_readers.sql.
 *
 * Corrige bug "Anônimo" + adiciona `decade_readers` e `avatar_url`.
 *
 * Prefere Management API (SUPABASE_ACCESS_TOKEN). Fallback pra postgres
 * direto via SUPABASE_DB_URL.
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-rosary-identity-migration.mjs
 *   SUPABASE_DB_URL=postgres://... node scripts/apply-rosary-identity-migration.mjs
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
  '20260516120000_rosary_room_identity_and_readers.sql',
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
  const dbUrl = process.env.SUPABASE_DB_URL

  if (token) {
    console.log('Aplicando via Supabase Management API…')
    await viaManagementApi(sql, token)
    console.log('✓ Migration aplicada.')
    return
  }

  if (dbUrl) {
    console.log('Aplicando via conexão direta ao Postgres…')
    await viaDirectPg(sql, dbUrl)
    console.log('✓ Migration aplicada.')
    return
  }

  console.error(
    'Defina SUPABASE_ACCESS_TOKEN (sbp_...) ou SUPABASE_DB_URL pra aplicar.',
  )
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
