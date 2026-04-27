#!/usr/bin/env node
/**
 * Garante que o AndroidManifest.xml tem as permissões nativas que os
 * plugins Capacitor instalados exigem. Roda DEPOIS de `cap sync android`
 * via npm script "cap:sync:android".
 *
 * Por que: Capacitor não adiciona automaticamente certas permissões
 * (geolocation, camera) no manifest — entende que devem ser opt-in
 * pelo developer. Esse script automatiza esse passo, idempotente.
 *
 * Idempotência: detecta permissão já presente e não duplica. Pode
 * rodar quantas vezes quiser. Em projetos sem android/ (ainda não
 * fez `cap add android`), sai silenciosamente sem erro.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const MANIFEST_PATH = path.resolve('android/app/src/main/AndroidManifest.xml')

// Permissões necessárias pelos plugins Capacitor instalados em
// package.json. Se adicionarmos novos plugins (ex: background-geo,
// notifications scheduling), incluir aqui.
const REQUIRED_PERMISSIONS = [
  // @capacitor/geolocation
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  // @capacitor/camera
  'android.permission.CAMERA',
  // @capacitor/camera no Android 13+ (scoped storage)
  'android.permission.READ_MEDIA_IMAGES',
]

let xml
try {
  xml = await fs.readFile(MANIFEST_PATH, 'utf-8')
} catch (err) {
  if (err && err.code === 'ENOENT') {
    console.log(
      '[patch-manifest] android/ não existe ainda — rode `npm run cap:add:android` primeiro. Pulando.',
    )
    process.exit(0)
  }
  throw err
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let updated = xml
const added = []

for (const perm of REQUIRED_PERMISSIONS) {
  const pattern = new RegExp(
    `<uses-permission\\s+android:name=["']${escapeRegex(perm)}["']`,
  )
  if (pattern.test(updated)) continue

  // Insere antes da tag <application — local convencional pra
  // <uses-permission> em manifests Android.
  const line = `    <uses-permission android:name="${perm}" />\n`
  const next = updated.replace(/(\s*)<application/, `\n${line}$1<application`)
  if (next === updated) {
    console.warn(
      `[patch-manifest] não achei <application> no manifest; permissão ${perm} não foi adicionada.`,
    )
    continue
  }
  updated = next
  added.push(perm)
}

if (added.length === 0) {
  console.log(
    '[patch-manifest] AndroidManifest.xml já tem todas as permissões necessárias.',
  )
} else {
  await fs.writeFile(MANIFEST_PATH, updated)
  console.log(
    `[patch-manifest] adicionadas ${added.length} permissão(ões) em AndroidManifest.xml:`,
  )
  for (const p of added) console.log(`  + ${p}`)
}
