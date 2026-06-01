# Раздел 6 — Realtime

> Диаграммы и trade-off таблица — в Разделе 2 (section-2, п. 2.3). Здесь — детали реализации SSE на Fastify.

## 6.1 Реализация SSE на Fastify

```typescript
// backend/src/modules/notifications/sse.handler.ts

// In-memory map: userId → Set<FastifyReply>
const connections = new Map<string, Set<FastifyReply>>()

export async function sseHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user.id
  const lastEventId = req.headers['last-event-id'] as string | undefined

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // отключает буферизацию nginx
  })

  // Регистрируем соединение
  if (!connections.has(userId)) connections.set(userId, new Set())
  connections.get(userId)!.add(reply)

  // Отдаём пропущенные события при reconnect
  if (lastEventId) {
    const missed = await prisma.sseEvent.findMany({
      where: { userId, id: { gt: lastEventId } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })
    for (const event of missed) {
      sendEvent(reply, event.id, event.eventType, event.payload)
    }
  }

  // Heartbeat каждые 30 секунд (предотвращает разрыв proxy)
  const heartbeat = setInterval(() => {
    reply.raw.write(': heartbeat\n\n')
  }, 30_000)

  req.raw.on('close', () => {
    clearInterval(heartbeat)
    connections.get(userId)?.delete(reply)
  })
}

function sendEvent(reply: FastifyReply, id: string, event: string, data: unknown) {
  reply.raw.write(`id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

// Вызывается из workout.service при завершении тренировки
export async function emitToUser(userId: string, eventType: string, payload: unknown) {
  const event = await prisma.sseEvent.create({
    data: { userId, eventType, payload: payload as Prisma.JsonObject },
  })

  const userConnections = connections.get(userId)
  if (userConnections) {
    for (const reply of userConnections) {
      sendEvent(reply, event.id, eventType, payload)
    }
  }
}
```

## 6.2 Клиент (React Native / Expo)

```typescript
// frontend/src/lib/sse-client.ts
// Expo не поддерживает нативный EventSource — используем fetch + ReadableStream

export function createSseConnection(token: string, onEvent: (event: SseEvent) => void) {
  let abortController = new AbortController()
  let lastEventId: string | null = null

  async function connect() {
    try {
      const response = await fetch(`${API_BASE_URL}/sse`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(lastEventId ? { 'Last-Event-Id': lastEventId } : {}),
        },
        signal: abortController.signal,
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const messages = buffer.split('\n\n')
        buffer = messages.pop() ?? ''

        for (const message of messages) {
          const parsed = parseSSEMessage(message)
          if (parsed) {
            lastEventId = parsed.id ?? lastEventId
            onEvent(parsed)
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      // Exponential backoff reconnect
      await delay(Math.min(1000 * 2 ** reconnectAttempts++, 30_000))
      connect()
    }
  }

  let reconnectAttempts = 0
  connect()

  return () => abortController.abort()
}
```

## 6.3 Типы SSE событий

| Event | Payload | Получатель |
|---|---|---|
| `workout_completed` | `{ clientId, clientName, workoutLogId, completedAt }` | TRAINER |
| `photo_uploaded` | `{ clientId, photoId }` | TRAINER |
| `notification` | `{ id, type, title, body }` | TRAINER \| CLIENT |

## 6.4 Очистка старых событий

```typescript
// pg-boss job: каждый час удаляет события старше 24 часов
boss.schedule('cleanup-sse-events', '0 * * * *', async () => {
  await prisma.sseEvent.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  })
})
```
