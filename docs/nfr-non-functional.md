# NFR — Нефункциональные требования

## Offline-first (критично для мобайла)

### Поведение при потере сети

| Действие | Онлайн | Офлайн |
|---|---|---|
| Просмотр тренировки | Загрузка из API | TanStack Query cache |
| Отметка подхода выполненным | Optimistic update → API | Записывается в action queue |
| Завершение тренировки | POST /complete | Записывается в action queue |
| Просмотр фото (thumbnails) | Signed URL | Нет (не кэшируются) |
| Загрузка фото | Upload → R2 | Очередь с retry после восстановления |

### Persist кэша TanStack Query

```typescript
// frontend/src/shared/lib/query-client.ts

import { MMKVLoader } from 'react-native-mmkv-storage'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

const mmkv = new MMKVLoader().initialize()

const persister = createSyncStoragePersister({
  storage: {
    getItem: (key) => mmkv.getString(key) ?? null,
    setItem: (key, value) => mmkv.setString(key, value),
    removeItem: (key) => mmkv.removeItem(key),
  },
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24 часа
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      // Кэшируем только ключевые данные, не фото-URL (они истекают)
      !query.queryKey.includes('url'),
  },
})
```

### Action queue (офлайн-отметка тренировок)

```typescript
// frontend/src/features/workouts/lib/action-queue.ts

interface PendingAction {
  id: string
  type: 'UPDATE_EXERCISE_LOG' | 'COMPLETE_WORKOUT'
  payload: unknown
  createdAt: number
}

const QUEUE_KEY = 'pending_actions'

export function enqueueAction(action: Omit<PendingAction, 'id' | 'createdAt'>) {
  const queue = getQueue()
  queue.push({ ...action, id: cuid(), createdAt: Date.now() })
  mmkv.setString(QUEUE_KEY, JSON.stringify(queue))
}

export async function flushQueue(api: ApiClient) {
  const queue = getQueue()
  const failed: PendingAction[] = []

  for (const action of queue) {
    try {
      if (action.type === 'UPDATE_EXERCISE_LOG') await api.put(...)
      if (action.type === 'COMPLETE_WORKOUT') await api.post(...)
    } catch {
      failed.push(action)
    }
  }

  mmkv.setString(QUEUE_KEY, JSON.stringify(failed))
}

// Вызывать при восстановлении сети
NetInfo.addEventListener((state) => {
  if (state.isConnected) flushQueue(apiClient)
})
```

---

## Error & Loading States

Единый подход через компонент `QueryState` (см. Раздел 10).

**Правила:**
- Loading → всегда Skeleton (не spinner), размером совпадает с реальным контентом
- Error → кнопка «Retry» + краткое сообщение; не показывать технические детали пользователю
- Empty → иллюстрация + CTA (не просто «Нет данных»)
- Optimistic update откат → Toast с сообщением «Не удалось сохранить»

---

## Observability

### Структурные логи (pino)

```typescript
// backend/src/plugins/logger.ts

import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  // В проде: transport: pino-pretty отключён, JSON в stdout
})

// Каждый запрос логируется автоматически Fastify:
// {"level":"info","reqId":"req-1","req":{"method":"POST","url":"/auth/login"},"res":{"statusCode":200},"responseTime":42}
```

### Sentry

```typescript
// backend/src/plugins/sentry.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

// frontend/src/app/_layout.tsx
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableNativeFramesTracking: true,
})
```

### Health check

```
GET /health → { status: "ok", db: "ok", uptime: 1234 }

db: проверяется через prisma.$queryRaw`SELECT 1`
uptime: process.uptime()
```

---

## Оценка масштаба

| Параметр | Оценка | Узкое место |
|---|---|---|
| Тренеров | ~100–500 | — |
| Клиентов на тренера | ~10 | — |
| RPS в пике | ~50–100 | Нет |
| Concurrent SSE соединений | ~100–500 | In-memory map — не масштабируется на несколько процессов |
| Фото (avg) | 2MB × 10 клиентов × 4 фото/мес | ~80 MB/мес на тренера |

**Где появятся узкие места при росте:**

1. **SSE in-memory map** — не работает при горизонтальном масштабировании. Решение: Redis pub/sub (добавить при > 1 инстансе).
2. **Thumbnail generation** — синхронный sharp в pg-boss worker. При большом количестве фото — выделить отдельный воркер-процесс.
3. **PostgreSQL** — первый реальный bottleneck при ~1000 RPS. Решение: read replicas, connection pooling (PgBouncer).

> Для портфолио (~100 пользователей) текущая архитектура избыточна. Узкие места описаны для демонстрации понимания масштабирования.
