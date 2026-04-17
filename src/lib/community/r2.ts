import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let cachedClient: S3Client | null = null

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.CF_R2_ACCOUNT_ID
      && process.env.CF_R2_ACCESS_KEY_ID
      && process.env.CF_R2_SECRET_ACCESS_KEY
      && process.env.CF_R2_BUCKET
      && process.env.CF_R2_PUBLIC_BASE_URL,
  )
}

export function getR2BucketName(): string {
  return getRequiredEnv('CF_R2_BUCKET')
}

export function getR2PublicBaseUrl(): string {
  return getRequiredEnv('CF_R2_PUBLIC_BASE_URL')
}

function getR2Client(): S3Client {
  if (cachedClient) return cachedClient

  const accountId = getRequiredEnv('CF_R2_ACCOUNT_ID')
  const accessKeyId = getRequiredEnv('CF_R2_ACCESS_KEY_ID')
  const secretAccessKey = getRequiredEnv('CF_R2_SECRET_ACCESS_KEY')

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return cachedClient
}

export async function createR2PutUrl(params: {
  objectKey: string
  mimeType: string
  expiresInSeconds?: number
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: params.objectKey,
    ContentType: params.mimeType,
  })

  return getSignedUrl(getR2Client(), command, {
    expiresIn: params.expiresInSeconds ?? 600,
  })
}
