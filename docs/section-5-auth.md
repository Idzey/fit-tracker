# Раздел 5 — Аутентификация

> Диаграммы auth flow и refresh rotation — в Разделе 2 (section-2, п. 2.2). Здесь — детали реализации.

## 5.1 Стек

| Компонент | Решение |
|---|---|
| Стратегия auth | Passport.js `passport-local` (login) + `passport-jwt` (protected routes) |
| Access token | JWT, подписан `HS256`, TTL 15 минут |
| Refresh token | Случайный `crypto.randomBytes(40).toString('hex')`, хранится в БД |
| Хеширование паролей | `argon2` (argon2id вариант) |
| Хранение на клиенте | `expo-secure-store` (Keychain / Keystore) |

## 5.2 Реализация refresh rotation

```typescript
// backend/src/modules/auth/auth.service.ts

async function refreshTokens(rawToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: rawToken },
    include: { user: true },
  })

  if (!stored) throw new UnauthorizedError('INVALID_TOKEN')

  // Обнаружение кражи: токен уже был использован
  if (stored.revoked) {
    await prisma.refreshToken.updateMany({
      where: { family: stored.family },
      data: { revoked: true },
    })
    throw new UnauthorizedError('TOKEN_REUSE_DETECTED')
  }

  if (stored.expiresAt < new Date()) throw new UnauthorizedError('TOKEN_EXPIRED')

  // Ревокация старого токена
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  })

  // Выдача новой пары
  const accessToken = signJwt({ sub: stored.userId, role: stored.user.role })
  const newRefresh = await createRefreshToken(stored.userId, stored.family)

  return { accessToken, refreshToken: newRefresh.token }
}
```

## 5.3 Role-based Authorization Middleware

```typescript
// backend/src/middleware/require-role.ts

export function requireRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) return reply.status(401).send({ code: 'UNAUTHORIZED' })
    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
  }
}

// Использование в роутах:
// fastify.post('/trainer/clients', { preHandler: [authenticate, requireRole('TRAINER')] }, handler)
```

## 5.4 Resource ownership check

```typescript
// Тренер видит только своих клиентов
export async function requireClientOwnership(req: FastifyRequest, reply: FastifyReply) {
  const { clientId } = req.params as { clientId: string }
  const client = await prisma.clientProfile.findUnique({ where: { id: clientId } })

  if (!client || client.trainerId !== req.user.trainerId) {
    return reply.status(403).send({ code: 'FORBIDDEN' })
  }
}
```

## 5.5 Frontend: auto-refresh interceptor

```typescript
// frontend/src/lib/api-client.ts

let isRefreshing = false
let queue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status !== 401) throw error

  if (isRefreshing) {
    return new Promise((resolve) => {
      queue.push((token) => {
        error.config.headers.Authorization = `Bearer ${token}`
        resolve(apiClient(error.config))
      })
    })
  }

  isRefreshing = true
  try {
    const refreshToken = await SecureStore.getItemAsync('refreshToken')
    const { data } = await apiClient.post('/auth/refresh', { refreshToken })
    await SecureStore.setItemAsync('accessToken', data.accessToken)
    await SecureStore.setItemAsync('refreshToken', data.refreshToken)
    queue.forEach((cb) => cb(data.accessToken))
    queue = []
    error.config.headers.Authorization = `Bearer ${data.accessToken}`
    return apiClient(error.config)
  } catch {
    // refresh failed → logout
    useAuthStore.getState().logout()
    throw error
  } finally {
    isRefreshing = false
  }
})
```

## 5.6 Коды ошибок auth

| Код | HTTP | Описание |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Неверный email или пароль |
| `INVALID_TOKEN` | 401 | Refresh token не найден |
| `TOKEN_EXPIRED` | 401 | Refresh token истёк |
| `TOKEN_REUSE_DETECTED` | 401 | Повторное использование refresh — кража |
| `UNAUTHORIZED` | 401 | Нет access token |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `EMAIL_TAKEN` | 409 | Email уже зарегистрирован |
