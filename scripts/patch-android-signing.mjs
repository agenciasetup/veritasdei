#!/usr/bin/env node
/**
 * Garante que o app/build.gradle:
 *   1. Carrega `android/key.properties` (gitignored, contém senhas).
 *   2. Define `signingConfigs.release` lendo dessa file.
 *   3. Aplica `signingConfig signingConfigs.release` no buildType release.
 *
 * Idempotente — pode rodar quantas vezes quiser. Encadeado no
 * `cap:sync:android`.
 *
 * Sem `android/key.properties`, o Gradle ainda compila debug normalmente
 * (signing release fica nulo, AAB release vai pedir signing manual no
 * Android Studio).
 *
 * Por que não commitar build.gradle direto: a pasta /android é gerada
 * por `cap add android` e qualquer dev pode regenerar do zero. O patch
 * idempotente sobrevive a regenerações.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const APP_GRADLE = path.resolve('android/app/build.gradle')

const KEYS_LOADER = `
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
`.trim()

const SIGNING_CONFIGS_BLOCK = `
    signingConfigs {
        release {
            if (keystoreProperties['storeFile']) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
`.trim()

// Condicional: se não houver key.properties, signingConfig.release fica vazio
// e qualquer `bundleRelease` quebraria. Aplicar só quando o keystore existe.
const RELEASE_SIGNING_LINE = `if (keystoreProperties['storeFile']) signingConfig signingConfigs.release`

let gradle
try {
  gradle = await fs.readFile(APP_GRADLE, 'utf-8')
} catch (err) {
  if (err && err.code === 'ENOENT') {
    console.log(
      '[patch-signing] android/app/build.gradle não existe — rode `npm run cap:add:android` primeiro. Pulando.',
    )
    process.exit(0)
  }
  throw err
}

let changed = false

// 1) Loader de key.properties (no topo, antes do bloco android { }).
if (gradle.includes('keystoreProperties')) {
  console.log('[patch-signing] keystoreProperties loader já presente.')
} else {
  // Insere logo após o `apply plugin: 'com.android.application'` (1ª linha
  // do template Capacitor) e qualquer apply plugin imediatamente após.
  // Mais robusto: inserir antes do primeiro `android {`.
  const anchor = /(\n)(android\s*\{)/
  if (anchor.test(gradle)) {
    gradle = gradle.replace(anchor, `\n${KEYS_LOADER}\n$1$2`)
    changed = true
  } else {
    console.warn(
      '[patch-signing] não achei `android {` em app/build.gradle; pulei loader. Adicione manual.',
    )
  }
}

// 2) Bloco signingConfigs dentro de android { }.
if (gradle.includes('signingConfigs {')) {
  console.log('[patch-signing] signingConfigs já presente.')
} else {
  // Insere antes do bloco `buildTypes {` (existe sempre no template Capacitor).
  const anchor = /(\n\s*)(buildTypes\s*\{)/
  if (anchor.test(gradle)) {
    gradle = gradle.replace(anchor, `$1${SIGNING_CONFIGS_BLOCK}\n$1$2`)
    changed = true
  } else {
    console.warn(
      '[patch-signing] não achei `buildTypes {`; pulei signingConfigs. Adicione manual.',
    )
  }
}

// 3) signingConfig signingConfigs.release dentro de buildTypes.release { }.
// Importante: filtrar pra `buildTypes { ... release {`, NÃO o `release` dentro
// de `signingConfigs` (que também tem bloco com mesmo nome).
if (gradle.match(/buildTypes\s*\{[^}]*release\s*\{[^}]*keystoreProperties\['storeFile'\]\s*\)\s*signingConfig\s+signingConfigs\.release/s)) {
  console.log('[patch-signing] signingConfig.release já aplicado em buildTypes.release.')
} else {
  // Match específico: `buildTypes {` … `release {\n`
  const anchor = /(buildTypes\s*\{\s*\n\s*release\s*\{\s*\n)/
  if (anchor.test(gradle)) {
    gradle = gradle.replace(anchor, `$1            ${RELEASE_SIGNING_LINE}\n`)
    changed = true
  } else {
    console.warn(
      '[patch-signing] não achei `buildTypes { release { ... }`; pulei signing line. Adicione manual.',
    )
  }
}

if (changed) {
  await fs.writeFile(APP_GRADLE, gradle)
  console.log('[patch-signing] app/build.gradle atualizado com signing release.')
} else {
  console.log('[patch-signing] nada a fazer.')
}
