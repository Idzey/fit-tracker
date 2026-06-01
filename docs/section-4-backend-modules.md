# Раздел 4 — Backend-модули

## Структура модулей

```
backend/src/modules/
├── auth/
├── users/
├── trainers/
├── clients/
├── workouts/
├── exercises/
├── progress/
├── uploads/
├── notifications/
└── subscriptions/
```

---

## 4.1 auth

**Ответственность:** регистрация, логин, refresh, logout, детекция кражи токена.

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| POST | `/auth/register` | — | Регистрация, возвращает токены |
| POST | `/auth/login` | — | Логин, возвращает токены |
| POST | `/auth/refresh` | — | Ротация refresh-токена |
| POST | `/auth/logout` | Bearer | Ревокация refresh-токена |

### DTOs

**RegisterDTO**

| Поле | Тип | Валидация |
|---|---|---|
| email | string | email format |
| password | string | min 8, max 72 символов |
| role | `TRAINER` \| `CLIENT` | enum |
| name | string | min 2, max 100 |

**LoginDTO**

| Поле | Тип | Валидация |
|---|---|---|
| email | string | email format |
| password | string | min 1 |

**RefreshDTO**

| Поле | Тип | Валидация |
|---|---|---|
| refreshToken | string | min 1 |

**AuthResponseDTO**

| Поле | Тип |
|---|---|
| accessToken | string (JWT, 15min) |
| refreshToken | string (opaque, 30d) |
| user.id | string |
| user.email | string |
| user.role | `TRAINER` \| `CLIENT` |

### Zod-схемы

```typescript
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['TRAINER', 'CLIENT']),
  name: z.string().min(2).max(100),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})
```

---

## 4.2 users

**Ответственность:** профиль текущего пользователя, смена пароля, push-токены.

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| GET | `/users/me` | Bearer | Профиль текущего пользователя |
| PUT | `/users/me` | Bearer | Обновление профиля |
| POST | `/devices/token` | Bearer | Регистрация push-токена |
| DELETE | `/devices/token` | Bearer | Удаление push-токена |

### DTOs

**UpdateProfileDTO**

| Поле | Тип | Валидация |
|---|---|---|
| name | string? | min 2, max 100 |
| bio | string? | max 500 (trainer only) |
| avatarKey | string? | R2 key |
| specialization | string? | max 200 (trainer only) |
| age | number? | 10–100 (client only) |
| weight | number? | 20–500 (client only) |
| height | number? | 50–250 (client only) |
| goals | string? | max 500 (client only) |

---

## 4.3 clients

**Ответственность:** управление клиентами тренера (CRUD, инвайт).

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| GET | `/trainer/clients` | TRAINER | Список клиентов |
| POST | `/trainer/clients` | TRAINER | Добавить клиента (создаёт user + client_profile) |
| GET | `/trainer/clients/:id` | TRAINER | Профиль клиента |
| PUT | `/trainer/clients/:id` | TRAINER | Обновить данные клиента |
| DELETE | `/trainer/clients/:id` | TRAINER | Удалить клиента |

### DTOs

**CreateClientDTO**

| Поле | Тип | Валидация |
|---|---|---|
| name | string | min 2, max 100 |
| email | string | email |
| age | number? | 10–100 |
| weight | number? | 20–500 |
| height | number? | 50–250 |
| goals | string? | max 500 |

**ClientListItemDTO** (ответ)

| Поле | Тип |
|---|---|
| id | string |
| name | string |
| avatarKey | string? |
| lastWorkoutAt | datetime? |
| totalWorkouts | number |
| activeProgram | string? |

### Zod-схемы

```typescript
export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(10).max(100).optional(),
  weight: z.number().min(20).max(500).optional(),
  height: z.number().min(50).max(250).optional(),
  goals: z.string().max(500).optional(),
})
```

### Permissions

| Действие | TRAINER (owner) | TRAINER (other) | CLIENT |
|---|---|---|---|
| Список клиентов | ✅ | ❌ | ❌ |
| Профиль клиента | ✅ | ❌ | ❌ |
| Создать клиента | ✅ (с лимитом плана) | — | ❌ |
| Обновить клиента | ✅ | ❌ | ❌ |
| Удалить клиента | ✅ | ❌ | ❌ |

---

## 4.4 workouts

**Ответственность:** шаблоны тренировок, дни, назначение программ клиентам, выполнение.

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| GET | `/workout-templates` | TRAINER | Список шаблонов |
| POST | `/workout-templates` | TRAINER | Создать шаблон |
| GET | `/workout-templates/:id` | TRAINER | Шаблон с днями и упражнениями |
| PUT | `/workout-templates/:id` | TRAINER | Обновить шаблон |
| DELETE | `/workout-templates/:id` | TRAINER | Удалить шаблон |
| POST | `/workout-templates/:id/days` | TRAINER | Добавить день |
| PUT | `/workout-templates/:id/days/:dayId` | TRAINER | Обновить день |
| DELETE | `/workout-templates/:id/days/:dayId` | TRAINER | Удалить день |
| POST | `/clients/:clientId/programs` | TRAINER | Назначить программу клиенту |
| GET | `/clients/:clientId/programs` | TRAINER | Программы клиента |
| GET | `/workouts/today` | CLIENT | Тренировки на сегодня |
| GET | `/workouts/:logId` | CLIENT | Детали тренировки |
| POST | `/workouts/:logId/start` | CLIENT | Начать тренировку |
| POST | `/workouts/:logId/complete` | CLIENT | Завершить тренировку |
| PUT | `/workouts/:logId/exercises/:exerciseLogId` | CLIENT | Обновить лог упражнения |

### DTOs

**CreateTemplateDTO**

| Поле | Тип | Валидация |
|---|---|---|
| name | string | min 2, max 100 |
| description | string? | max 500 |

**CreateDayDTO**

| Поле | Тип | Валидация |
|---|---|---|
| dayNumber | number | 1–7 |
| name | string | min 1, max 100 |
| exercises | ExerciseDTO[] | min 1 |

**ExerciseDTO**

| Поле | Тип | Валидация |
|---|---|---|
| name | string | min 1, max 100 |
| sets | number | 1–20 |
| reps | number? | 1–100 |
| weight | number? | 0–1000 |
| duration | number? | секунды, 1–7200 |
| notes | string? | max 500 |
| order | number | 1–50 |

**UpdateExerciseLogDTO**

| Поле | Тип | Валидация |
|---|---|---|
| completedSets | number | 0–20 |
| actualReps | number? | 0–200 |
| actualWeight | number? | 0–1000 |
| notes | string? | max 500 |

---

## 4.5 exercises

**Ответственность:** CRUD упражнений внутри дня шаблона.

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| POST | `/workout-templates/:id/days/:dayId/exercises` | TRAINER | Добавить упражнение |
| PUT | `/workout-templates/:id/days/:dayId/exercises/:exId` | TRAINER | Обновить |
| DELETE | `/workout-templates/:id/days/:dayId/exercises/:exId` | TRAINER | Удалить |
| POST | `/workout-templates/:id/days/:dayId/exercises/reorder` | TRAINER | Изменить порядок |

---

## 4.6 progress

**Ответственность:** история тренировок, статистика прогресса.

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| GET | `/clients/:clientId/progress` | TRAINER | Сводка прогресса клиента |
| GET | `/clients/:clientId/workout-logs` | TRAINER | История тренировок клиента |
| GET | `/progress` | CLIENT | Свой прогресс |
| GET | `/progress/workout-logs` | CLIENT | Своя история тренировок |

**ProgressSummaryDTO** (ответ)

| Поле | Тип |
|---|---|
| totalWorkouts | number |
| workoutsThisWeek | number |
| completionRate | number (0–1) |
| lastWorkoutAt | datetime? |
| streak | number (дней подряд) |

---

## 4.7 uploads

**Ответственность:** presigned URL для загрузки фото, подтверждение загрузки.

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| POST | `/uploads/presign` | CLIENT | Получить presigned URL |
| POST | `/uploads/:photoId/confirm` | CLIENT | Подтвердить загрузку |
| GET | `/clients/:clientId/photos` | TRAINER | Фото клиента |
| GET | `/photos` | CLIENT | Свои фото |
| DELETE | `/photos/:photoId` | CLIENT | Удалить фото |
| GET | `/photos/:photoId/url` | TRAINER\|CLIENT | Получить signed URL для просмотра |

### DTOs

**PresignDTO**

| Поле | Тип | Валидация |
|---|---|---|
| filename | string | max 255 |
| contentType | string | `image/jpeg` \| `image/png` \| `image/webp` |
| size | number | bytes, max 10_485_760 (10MB) |
| takenAt | datetime? | |

**PresignResponseDTO**

| Поле | Тип |
|---|---|
| uploadUrl | string |
| photoId | string |
| expiresAt | datetime |

---

## 4.8 notifications

**Ответственность:** список уведомлений пользователя, отметка прочитанным.

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| GET | `/notifications` | Bearer | Список уведомлений (пагинация) |
| POST | `/notifications/:id/read` | Bearer | Отметить прочитанным |
| POST | `/notifications/read-all` | Bearer | Отметить все прочитанными |

### SSE endpoint

| Method | Path | Auth | Описание |
|---|---|---|---|
| GET | `/sse` | Bearer (query param `token`) | EventStream для realtime |

---

## 4.9 subscriptions

**Ответственность:** тарифный план тренера, обработка webhook от RevenueCat и ЮMoney.

### Endpoints

| Method | Path | Auth | Описание |
|---|---|---|---|
| GET | `/subscription` | TRAINER | Текущий план и статус |
| POST | `/webhooks/revenuecat` | HMAC | Webhook от RevenueCat |
| POST | `/webhooks/yoomoney` | HMAC | Webhook от ЮMoney |

### Plan enforcement middleware

```typescript
// Применяется на POST /trainer/clients
export async function enforcePlanLimit(req, reply) {
  const trainer = await getTrainerProfile(req.userId)
  const subscription = await getSubscription(trainer.id)

  if (subscription.plan === 'FREE') {
    const clientCount = await countClients(trainer.id)
    if (clientCount >= 3) {
      return reply.status(403).send({
        code: 'PLAN_LIMIT_REACHED',
        message: 'Free plan allows up to 3 clients',
      })
    }
  }
}
```
