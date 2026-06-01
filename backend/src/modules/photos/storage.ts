import { Readable } from 'node:stream'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'
import { BadRequestError } from '../../shared/errors'

const VIEW_URL_TTL_SECONDS = 60 * 60

export const s3 = new S3Client({
  region: process.env.R2_REGION ?? 'auto',
  endpoint: process.env.R2_ENDPOINT ?? 'http://localhost:9000',
  forcePathStyle: process.env.R2_FORCE_PATH_STYLE !== 'false',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? process.env.MINIO_ROOT_USER ?? 'minioadmin',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? process.env.MINIO_ROOT_PASSWORD ?? 'minioadmin',
  },
})

export function getBucketName() {
  const bucket = process.env.R2_BUCKET ?? 'fittrack'
  if (!bucket) throw new BadRequestError('STORAGE_NOT_CONFIGURED', 'Storage bucket is not configured')
  return bucket
}

export function getExtension(contentType: string) {
  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  throw new BadRequestError('INVALID_CONTENT_TYPE', 'Unsupported content type')
}

export async function getObjectHead(key: string) {
  return s3.send(new HeadObjectCommand({ Bucket: getBucketName(), Key: key }))
}

export async function getUploadUrl(key: string, contentType: string, size: number) {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  })

  return getSignedUrl(s3, command, { expiresIn: 300 })
}

export async function getViewUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: getBucketName(), Key: key })
  return {
    url: await getSignedUrl(s3, command, { expiresIn: VIEW_URL_TTL_SECONDS }),
    expiresAt: new Date(Date.now() + VIEW_URL_TTL_SECONDS * 1000),
  }
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }))
}

export async function generateThumbnail(originalKey: string) {
  const object = await s3.send(new GetObjectCommand({ Bucket: getBucketName(), Key: originalKey }))
  const source = await streamToBuffer(object.Body)
  const thumb = await sharp(source)
    .rotate()
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .webp({ quality: 80 })
    .toBuffer()

  const thumbnailKey = originalKey.replace(/\/original\.[a-z0-9]+$/i, '/thumb_400.webp')
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: thumbnailKey,
      Body: thumb,
      ContentType: 'image/webp',
    }),
  )

  return { thumbnailKey, size: source.length }
}

async function streamToBuffer(body: unknown) {
  if (!body) throw new BadRequestError('FILE_NOT_UPLOADED', 'Uploaded file was not found')
  if (body instanceof Uint8Array) return Buffer.from(body)
  if (typeof body === 'string') return Buffer.from(body)
  if (body instanceof Readable) {
    const chunks: Buffer[] = []
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }

  throw new BadRequestError('INVALID_STORAGE_RESPONSE', 'Could not read uploaded file')
}
