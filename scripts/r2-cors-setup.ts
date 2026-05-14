/**
 * Aplica as regras de CORS no bucket R2 da Comunidade Veritas.
 *
 * Quando rodar: sempre que mudar origem permitida (novo domínio de staging,
 * preview Vercel, etc.) ou quando o upload de mídia começar a falhar com
 * erro de CORS vindo do R2.
 *
 * Como rodar:
 *   1. Garanta que as env vars CF_R2_* estão setadas localmente.
 *      Em projeto Vercel: `vercel env pull .env.local`
 *   2. `npm run r2:cors`
 *
 * Requer credenciais R2 com permissão `PutBucketCors` (o token de API usado
 * pelo app já tem, pois foi criado com "Object Read & Write").
 */

import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3'

const ALLOWED_ORIGINS = [
  'https://www.veritasdei.com.br',
  'https://veritasdei.com.br',
  'https://educa.veritasdei.com.br',
  'http://localhost:3000',
  'http://localhost:3001',
]

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing env var: ${name}`)
    process.exit(1)
  }
  return v
}

async function main() {
  const accountId = requireEnv('CF_R2_ACCOUNT_ID')
  const accessKeyId = requireEnv('CF_R2_ACCESS_KEY_ID')
  const secretAccessKey = requireEnv('CF_R2_SECRET_ACCESS_KEY')
  const bucket = requireEnv('CF_R2_BUCKET')

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  const cors = {
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ALLOWED_ORIGINS,
          AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  } as const

  console.log(`Applying CORS to bucket "${bucket}" with origins:`)
  for (const o of ALLOWED_ORIGINS) console.log(`  - ${o}`)

  await client.send(new PutBucketCorsCommand(cors))
  console.log('CORS applied.')

  const check = await client.send(new GetBucketCorsCommand({ Bucket: bucket }))
  console.log('Current CORS rules:')
  console.log(JSON.stringify(check.CORSRules, null, 2))
}

main().catch((err) => {
  console.error('Failed to apply CORS:', err)
  process.exit(1)
})
