# Раздел 7 — Хранилище (фото)

## 7.1 Провайдер: Cloudflare R2

| Параметр | Значение |
|---|---|
| API | S3-compatible (aws-sdk v3) |
| Бесплатный tier | 10 GB хранилища, 1M запросов/мес |
| Egress fee | Нет (в отличие от AWS S3) |
| Dev-замена | MinIO в Docker (`minio/minio`) |
| SDK | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` |

## 7.2 Структура ключей объектов

```
photos/{clientId}/{photoId}/original.{ext}
photos/{clientId}/{photoId}/thumb_400.webp
```

## 7.3 Presigned URL flow

> Полная sequence-диаграмма — в Разделе 2 (section-2, п. 2.4).

```typescript
// backend/src/modules/uploads/uploads.service.ts

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function createPresignedUploadUrl(clientId: string, dto: PresignDTO) {
  const photoId = cuid()
  const ext = mime.extension(dto.contentType) // 'jpg' | 'png' | 'webp'
  const key = `photos/${clientId}/${photoId}/original.${ext}`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: dto.contentType,
    ContentLength: dto.size,
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }) // 5 минут

  await prisma.progressPhoto.create({
    data: { id: photoId, clientId, key, status: 'PENDING', takenAt: dto.takenAt },
  })

  return { uploadUrl, photoId, expiresAt: new Date(Date.now() + 300_000) }
}

export async function confirmUpload(photoId: string, clientId: string) {
  const photo = await prisma.progressPhoto.findUnique({ where: { id: photoId } })
  if (!photo || photo.clientId !== clientId) throw new NotFoundError()

  // Проверяем что файл реально загружен в R2
  await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: photo.key }))

  await prisma.progressPhoto.update({
    where: { id: photoId },
    data: { status: 'UPLOADED', uploadedAt: new Date() },
  })

  // Ставим задачу на генерацию thumbnail
  await boss.send('generate-thumbnail', { photoId })

  return { photoId, status: 'UPLOADED' }
}
```

## 7.4 Генерация thumbnails (pg-boss worker)

```typescript
// backend/src/workers/thumbnail.worker.ts

import sharp from 'sharp'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

boss.work('generate-thumbnail', async (job) => {
  const { photoId } = job.data
  const photo = await prisma.progressPhoto.findUniqueOrThrow({ where: { id: photoId } })

  // Скачиваем оригинал
  const { Body } = await s3.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: photo.key,
  }))

  const buffer = await streamToBuffer(Body as Readable)

  // Генерируем thumbnail
  const thumb = await sharp(buffer)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .webp({ quality: 80 })
    .toBuffer()

  const thumbKey = photo.key.replace(/\/original\.\w+$/, '/thumb_400.webp')

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: thumbKey,
    Body: thumb,
    ContentType: 'image/webp',
  }))

  await prisma.progressPhoto.update({
    where: { id: photoId },
    data: { thumbnailKey: thumbKey, status: 'READY' },
  })
})
```

## 7.5 Signed URL для просмотра

```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function getPhotoViewUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })
  return getSignedUrl(s3, command, { expiresIn: 3600 }) // 1 час
}
```

## 7.6 Модель безопасности

| Угроза | Защита |
|---|---|
| Публичный доступ к файлам | Бакет R2 — приватный, CORS отключён |
| Загрузка не-изображения | Валидация `contentType` в PresignDTO + проверка magic bytes через `file-type` при confirm |
| Файл > 10 MB | `ContentLength` в PutObjectCommand + проверка `size` в PresignDTO |
| Доступ к чужим фото | Ownership check: `photo.clientId === req.user.clientId` или тренер владеет клиентом |
| Переполнение квоты | Перед presign: `SUM(size) WHERE clientId` vs лимит плана |
| Просроченный presigned URL | TTL 5 минут; при confirm проверяем HeadObject — если файла нет, возвращаем 400 |
