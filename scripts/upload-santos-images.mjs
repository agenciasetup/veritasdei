#!/usr/bin/env node
/**
 * Upload de imagens dos santos pro bucket `santos-imagens`.
 *
 * Uso:
 *   1. Coloque as imagens em `tmp/santos-imagens/{slug}.{ext}`
 *      (ex.: `tmp/santos-imagens/sao-francisco-de-assis.jpg`)
 *   2. Rode: `node scripts/upload-santos-images.mjs`
 *
 * O script:
 *   - Lê SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY do .env.local
 *   - Comprime cada imagem com sharp (WebP, 1800px largura máx, qualidade 75)
 *   - Upserta no bucket como `{slug}.webp`
 *   - Atualiza `santos.imagem_url` + `imagem_storage_path` + `imagem_atualizada_em`
 *   - Trigger no banco propaga `imagem_url` → `profiles.cover_image_url` em cascata
 *
 * Dependências: npm i -D sharp @supabase/supabase-js dotenv
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url))
const IMAGES_DIR = join(PROJECT_ROOT, 'tmp', 'santos-imagens')
const BUCKET = 'santos-imagens'

// Carrega .env.local sem dotenv-cli
async function loadEnv() {
  try {
    const envFile = await readFile(join(PROJECT_ROOT, '.env.local'), 'utf-8')
    for (const line of envFile.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (!m) continue
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
    }
  } catch {
    // sem .env.local — usa env do shell
  }
}

async function main() {
  await loadEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('ERR: configure NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('ERR: instale sharp — `npm i -D sharp`')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // Lista imagens
  let files
  try {
    files = await readdir(IMAGES_DIR)
  } catch {
    console.error(`ERR: ${IMAGES_DIR} não existe. Crie a pasta e coloque as imagens lá.`)
    process.exit(1)
  }

  const valid = files.filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
  if (valid.length === 0) {
    console.log('Nenhuma imagem encontrada em tmp/santos-imagens/')
    return
  }

  console.log(`Processando ${valid.length} imagem(ns)...`)
  let ok = 0
  let fail = 0

  for (const file of valid) {
    const slug = basename(file, extname(file))
    const srcPath = join(IMAGES_DIR, file)
    const storagePath = `${slug}.webp`

    try {
      // Verifica se santo existe
      const { data: santo, error: sErr } = await supabase
        .from('santos')
        .select('id, nome')
        .eq('slug', slug)
        .maybeSingle()
      if (sErr) throw sErr
      if (!santo) {
        console.warn(`  [skip] ${slug}: santo não encontrado no banco`)
        fail++
        continue
      }

      // Comprime com sharp
      const buffer = await readFile(srcPath)
      const { size: origSize } = await stat(srcPath)
      const webpBuffer = await sharp(buffer)
        .resize(1800, null, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 75, effort: 6 })
        .toBuffer()

      // Upload
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000',
        })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
      const publicUrl = pub.publicUrl

      // Update santos
      const { error: updErr } = await supabase
        .from('santos')
        .update({
          imagem_url: publicUrl,
          imagem_storage_path: storagePath,
          imagem_atualizada_em: new Date().toISOString(),
        })
        .eq('id', santo.id)
      if (updErr) throw updErr

      const kbOrig = Math.round(origSize / 1024)
      const kbNew = Math.round(webpBuffer.length / 1024)
      console.log(`  ✓ ${santo.nome} (${slug}) — ${kbOrig}KB → ${kbNew}KB`)
      ok++
    } catch (err) {
      console.error(`  ✗ ${slug}:`, err instanceof Error ? err.message : err)
      fail++
    }
  }

  console.log(`\nConcluído: ${ok} ok, ${fail} falharam.`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(e => {
  console.error('fatal:', e)
  process.exit(1)
})
