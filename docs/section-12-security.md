# Раздел 12 — Безопасность

## 12.1 Хеширование паролей: argon2 vs bcrypt

| | argon2id | bcrypt |
|---|---|---|
| Победитель PHC (2015) | ✅ | ❌ |
| Устойчивость к GPU | Высокая (memory-hard) | Средняя |
| Настройка памяти | Да (64MB по умолчанию) | Нет |
| Параллелизм | Настраивается | Нет |
| Макс. длина пароля | Без ограничений | **72 байта** (уязвимость) |
| Node.js пакет | `argon2` (нативный) | `bcrypt` / `bcryptjs` |

**Выбор: `argon2id`** — гибридный вариант (устойчив и к side-channel и к GPU). Параметры:
```typescript
argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64MB
  timeCost: 3,
  parallelism: 1,
})
```

> **Упрощено для портфолио:** в проде параметры подбираются под железо (~500ms на сервере). Здесь используем дефолты.

## 12.2 Rate Limiting

```typescript
// backend/src/plugins/rate-limit.ts

import fastifyRateLimit from '@fastify/rate-limit'

fastify.register(fastifyRateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
})

// Жёсткий лимит на auth endpoints
fastify.register(fastifyRateLimit, {
  routeConfig: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  // применяется через декоратор на роутах /auth/login, /auth/register
})
```

## 12.3 Валидация входных данных

Все входящие данные валидируются через Zod на уровне роута **до** попадания в handler:

```typescript
fastify.post('/auth/login', {
  schema: {
    body: zodToJsonSchema(loginSchema), // конвертация Zod → JSON Schema для Fastify
  },
}, loginHandler)
```

Fastify автоматически возвращает 400 при несоответствии схеме.

## 12.4 Защита загрузки файлов

```typescript
// backend/src/modules/uploads/uploads.service.ts

import { fileTypeFromBuffer } from 'file-type'

export async function confirmUpload(photoId: string, clientId: string) {
  // 1. Проверяем ownership
  const photo = await prisma.progressPhoto.findUnique({ where: { id: photoId } })
  if (!photo || photo.clientId !== clientId) throw new ForbiddenError()

  // 2. Скачиваем первые 4100 байт (достаточно для magic bytes)
  const { Body } = await s3.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: photo.key,
    Range: 'bytes=0-4099',
  }))
  const header = await streamToBuffer(Body as Readable)

  // 3. Проверяем magic bytes (не доверяем Content-Type из presign)
  const fileType = await fileTypeFromBuffer(header)
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!fileType || !allowed.includes(fileType.mime)) {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: photo.key }))
    await prisma.progressPhoto.update({ where: { id: photoId }, data: { status: 'FAILED' } })
    throw new BadRequestError('INVALID_FILE_TYPE')
  }

  // 4. Проверяем размер квоты
  const usage = await getStorageUsage(clientId)
  const limit = await getPlanStorageLimit(clientId)
  if (usage + photo.size > limit) throw new ForbiddenError('STORAGE_QUOTA_EXCEEDED')
}
```

## 12.5 Заголовки безопасности

```typescript
import fastifyHelmet from '@fastify/helmet'

fastify.register(fastifyHelmet, {
  contentSecurityPolicy: false, // Отключаем для API (не HTML)
})
// Helmet добавляет: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, ...
```

## 12.6 CORS

```typescript
import fastifyCors from '@fastify/cors'

fastify.register(fastifyCors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? false,
  credentials: true,
})
```

## 12.7 SQL Injection

Prisma использует параметризованные запросы везде. Прямые SQL-запросы (`$queryRaw`) не используются — риска SQL-инъекции нет.

## 12.8 Webhook security (RevenueCat / ЮMoney)

```typescript
// RevenueCat подписывает payload через HMAC-SHA256
function verifyRevenuecatWebhook(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.REVENUECAT_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

## 12.9 Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | Строка подключения PostgreSQL |
| `JWT_SECRET` | Секрет для подписи access JWT (min 32 chars) |
| `REFRESH_TOKEN_SECRET` | Доп. секрет для refresh (можно = JWT_SECRET) |
| `R2_ENDPOINT` | `https://<accountId>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 API token |
| `R2_SECRET_ACCESS_KEY` | R2 API secret |
| `R2_BUCKET` | Имя бакета |
| `REVENUECAT_WEBHOOK_SECRET` | HMAC-ключ для верификации webhook |
| `YOOMONEY_SECRET` | Notification secret от ЮMoney |
| `EXPO_ACCESS_TOKEN` | Для Expo Push API |
