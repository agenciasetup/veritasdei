#!/usr/bin/env node
/**
 * Garante que os Gradle scripts do projeto Android têm o classpath e o
 * apply do plugin Crashlytics. Roda DEPOIS de `cap sync android` via
 * npm script "cap:sync:android".
 *
 * Por que: o `@capacitor-firebase/crashlytics` exige duas mudanças
 * manuais no Gradle (classpath no root, apply plugin no app) que o
 * `cap sync` não faz por conta. Esse script automatiza, idempotente.
 *
 * Idempotência: detecta entradas já presentes e não duplica. Pode
 * rodar quantas vezes quiser. Em projetos sem android/ (ainda não
 * fez `cap add android`), sai silenciosamente sem erro.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT_GRADLE = path.resolve('android/build.gradle')
const APP_GRADLE = path.resolve('android/app/build.gradle')

// Versão do plugin Gradle Crashlytics. Conferir compatibilidade com
// `firebase-crashlytics` ao bumpar.
const CRASHLYTICS_GRADLE_VERSION = '3.0.2'
const CRASHLYTICS_CLASSPATH = `classpath 'com.google.firebase:firebase-crashlytics-gradle:${CRASHLYTICS_GRADLE_VERSION}'`
const CRASHLYTICS_APPLY = `apply plugin: 'com.google.firebase.crashlytics'`

async function readOrSkip(filePath, label) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      console.log(
        `[patch-gradle] ${label} não existe ainda — rode \`npm run cap:add:android\` primeiro. Pulando.`,
      )
      process.exit(0)
    }
    throw err
  }
}

// 1) Root build.gradle: adiciona classpath dentro do bloco `buildscript { dependencies { ... } }`.
let rootGradle = await readOrSkip(ROOT_GRADLE, 'android/build.gradle')
let rootChanged = false
if (rootGradle.includes('firebase-crashlytics-gradle')) {
  console.log('[patch-gradle] root build.gradle já tem classpath do Crashlytics.')
} else {
  // Insere antes da próxima linha após o google-services classpath.
  // Padrão Capacitor: `classpath 'com.google.gms:google-services:X.Y.Z'`.
  const anchor = /(classpath\s+'com\.google\.gms:google-services:[^']+'\s*\n)/
  if (anchor.test(rootGradle)) {
    rootGradle = rootGradle.replace(
      anchor,
      `$1        ${CRASHLYTICS_CLASSPATH}\n`,
    )
    rootChanged = true
  } else {
    console.warn(
      '[patch-gradle] não achei classpath do google-services no root build.gradle; pulei a injeção do Crashlytics. Adicione manualmente.',
    )
  }
}
if (rootChanged) {
  await fs.writeFile(ROOT_GRADLE, rootGradle)
  console.log(`[patch-gradle] root build.gradle: + ${CRASHLYTICS_CLASSPATH}`)
}

// 2) App build.gradle: adiciona apply plugin no topo, junto dos outros applies do Capacitor template.
let appGradle = await readOrSkip(APP_GRADLE, 'android/app/build.gradle')
let appChanged = false
if (appGradle.includes("apply plugin: 'com.google.firebase.crashlytics'")) {
  console.log('[patch-gradle] app build.gradle já aplica plugin Crashlytics.')
} else {
  // Padrão Capacitor: arquivo abre com `apply plugin: 'com.android.application'`.
  const anchor = /(apply plugin: 'com\.android\.application'\s*\n)/
  if (anchor.test(appGradle)) {
    appGradle = appGradle.replace(anchor, `$1${CRASHLYTICS_APPLY}\n`)
    appChanged = true
  } else {
    console.warn(
      "[patch-gradle] não achei `apply plugin: 'com.android.application'` no app build.gradle; pulei a injeção do Crashlytics. Adicione manualmente.",
    )
  }
}
if (appChanged) {
  await fs.writeFile(APP_GRADLE, appGradle)
  console.log(`[patch-gradle] app build.gradle: + ${CRASHLYTICS_APPLY}`)
}

if (!rootChanged && !appChanged) {
  console.log('[patch-gradle] nada a fazer.')
}
