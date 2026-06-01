# Раздел 2 — Системная архитектура

## 2.1 Общая системная архитектура

```mermaid
graph TB
    subgraph Client["Mobile App (Expo / React Native)"]
        UI[Screens / Expo Router]
        TQ[TanStack Query]
        ZS[Zustand Store]
        OV[Orval HTTP Client]
    end

    subgraph Backend["Backend (Fastify / Node.js)"]
        API[REST API]
        AUTH[Auth Middleware]
        MOD[Feature Modules]
        PGBOSS[pg-boss Scheduler]
        SSE[SSE Handler]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL\nPrisma ORM)]
    end

    subgraph Storage["File Storage"]
        R2[Cloudflare R2\nS3-compatible]
    end

    subgraph Push["Push Notifications"]
        EXPO[Expo Push API]
        FCM[FCM\nAndroid]
        APNS[APNs\niOS]
    end

    subgraph Billing["Billing"]
        RC[RevenueCat]
        YM[ЮMoney]
    end

    UI --> TQ
    TQ --> OV
    OV -->|REST JSON| API
    ZS -->|auth tokens| OV

    API --> AUTH
    AUTH --> MOD
    MOD --> PG
    MOD --> R2
    MOD --> SSE
    PGBOSS --> PG
    PGBOSS --> EXPO

    SSE -->|EventStream| OV

    EXPO --> FCM
    EXPO --> APNS

    RC -->|webhook| API
    YM -->|webhook| API
```

---

## 2.2 Auth Flow (JWT + Refresh Token Rotation)

```mermaid
sequenceDiagram
    actor U as User (App)
    participant A as Fastify API
    participant DB as PostgreSQL

    U->>A: POST /auth/login {email, password}
    A->>DB: SELECT user WHERE email=...
    DB-->>A: user row (passwordHash)
    A->>A: argon2.verify(password, hash)
    A->>DB: INSERT refresh_token (token, userId, expiresAt, family)
    A-->>U: { accessToken (15min), refreshToken (30d) }

    Note over U,A: Нормальное использование

    U->>A: GET /workouts [Authorization: Bearer accessToken]
    A->>A: verify JWT signature + expiry
    A-->>U: 200 OK data

    Note over U,A: Access token истёк

    U->>A: POST /auth/refresh {refreshToken}
    A->>DB: SELECT refresh_token WHERE token=... AND NOT revoked
    DB-->>A: token row
    A->>DB: UPDATE SET revoked=true (старый токен)
    A->>DB: INSERT новый refresh_token (та же family)
    A-->>U: { accessToken (15min), refreshToken (30d) }

    Note over U,A: Обнаружение кражи токена

    U->>A: POST /auth/refresh {украденный refreshToken}
    A->>DB: SELECT — токен уже revoked
    A->>DB: UPDATE SET revoked=true ALL tokens WHERE family=...
    A-->>U: 401 TOKEN_REUSE_DETECTED
    Note over U: App → принудительный logout
```

**Детали реализации:**

| Параметр | Значение |
|---|---|
| Access token TTL | 15 минут |
| Refresh token TTL | 30 дней |
| Хранение на клиенте | `expo-secure-store` (Keychain iOS / Keystore Android) |
| Rotation strategy | Каждый `/auth/refresh` выдаёт новую пару; старый refresh сразу ревокуется |
| Token family | UUID, общий для всей цепочки refresh-токенов сессии; при обнаружении реюза — вся семья ревокуется |
| Logout | DELETE refresh_token на backend + clear SecureStore |

---

## 2.3 Realtime Architecture (SSE)

### Почему SSE, а не WebSocket или polling

| | WebSocket | SSE | Polling |
|---|---|---|---|
| Направление | Двустороннее | Сервер → клиент | Клиент → сервер (pull) |
| Сложность сервера | Высокая (upgrade, frames) | Низкая (HTTP/1.1) | Минимальная |
| Поддержка Expo/RN | Требует библиотеки | Нативный `fetch` + `ReadableStream` | Встроенный fetch |
| Reconnect | Ручной | Автоматический (`EventSource`) | N/A |
| Фоновый режим app | Соединение рвётся | Соединение рвётся | Не нужно |
| Managed (Pusher/Ably) | Есть | Есть | — |
| Подходит для проекта? | Избыточно | ✅ **Выбор** | Плохой UX |

**Вывод:** все realtime-события идут от сервера к клиенту (завершение тренировки, новое фото). Двусторонний канал не нужен — SSE достаточно, проще в реализации на Fastify и не требует отдельного сервиса.

```mermaid
sequenceDiagram
    actor T as Trainer App
    participant API as Fastify API
    participant DB as PostgreSQL
    actor C as Client App

    T->>API: GET /sse/trainer [EventStream]
    API-->>T: connection open (text/event-stream)
    Note over API: Соединение держится открытым

    C->>API: POST /workouts/:id/complete
    API->>DB: UPDATE workout_log SET status=completed
    DB-->>API: ok
    API->>API: emit SSE event к тренеру
    API-->>T: event: workout_completed\ndata: {clientId, workoutId, ...}

    Note over T: Dashboard обновляется без перезагрузки

    Note over T,API: Потеря сети
    T--xAPI: соединение разорвано
    T->>T: EventSource reconnect (exponential backoff)
    T->>API: GET /sse/trainer?lastEventId=123
    API-->>T: пропущенные события из БД
```

**Хранение событий для reconnect:**

```
event_id сохраняется в таблице sse_events (userId, eventType, payload, createdAt)
При reconnect с lastEventId — отдаём все события WHERE id > lastEventId
TTL событий: 24 часа (cron-job через pg-boss)
```

---

## 2.4 File Upload Flow (Presigned URLs)

```mermaid
sequenceDiagram
    actor C as Client App
    participant API as Fastify API
    participant DB as PostgreSQL
    participant R2 as Cloudflare R2

    C->>API: POST /uploads/presign\n{filename, contentType, size}
    API->>API: validate: type ∈ [image/jpeg, image/png, image/webp]\nsize ≤ 10MB
    API->>R2: generatePresignedPutUrl(key, TTL=5min)
    R2-->>API: presignedUrl
    API->>DB: INSERT progress_photo (status=pending, key)
    API-->>C: { uploadUrl, photoId }

    C->>R2: PUT {uploadUrl} [binary image]
    R2-->>C: 200 OK

    C->>API: POST /uploads/:photoId/confirm
    API->>R2: headObject(key) — проверить что файл существует
    R2-->>API: metadata (size, contentType)
    API->>API: enqueue thumbnail job (pg-boss)
    API->>DB: UPDATE photo SET status=uploaded
    API-->>C: { photoId, thumbnailUrl: null (processing) }

    Note over API: pg-boss обрабатывает thumbnail job
    API->>R2: getObject(key) → sharp → resizeTo(400x400)
    API->>R2: putObject(thumbKey)
    API->>DB: UPDATE photo SET thumbnailKey, status=ready
```

**Модель безопасности:**

| Угроза | Защита |
|---|---|
| Прямой доступ к файлам | Бакет R2 приватный; доступ только через signed URLs (TTL 1 час) |
| Загрузка вредоносного файла | Валидация `contentType` + `Content-Type` header; проверка magic bytes на сервере при confirm |
| Превышение размера | Presigned URL с `ContentLengthRange`; дополнительная проверка при confirm |
| Доступ к чужим фото | `photoId` привязан к `userId`; middleware проверяет ownership |
| Переполнение хранилища | Лимит квоты по плану (500MB / 10GB) — проверяется перед выдачей presigned URL |

---

## 2.5 Push Notifications Flow

```mermaid
graph LR
    subgraph App
        RN[React Native\nExpo]
    end

    subgraph Backend
        API[Fastify API]
        PGB[pg-boss\nScheduler]
        DB[(PostgreSQL)]
    end

    subgraph PushInfra
        EPX[Expo Push\nService]
        FCM[Firebase\nFCM]
        APNs[Apple\nAPNs]
    end

    subgraph Device
        AND[Android]
        IOS[iOS]
    end

    RN -->|POST /devices/token\n{expoPushToken}| API
    API --> DB

    PGB -->|workout reminder\ntriggered| API
    API -->|send push| EPX
    EPX --> FCM --> AND
    EPX --> APNs --> IOS
```

**Типы уведомлений:**

| Тип | Триггер | Получатель | Канал |
|---|---|---|---|
| `workout_reminder` | pg-boss job по расписанию | CLIENT | Push |
| `workout_completed` | POST /workouts/:id/complete | TRAINER | Push + SSE |
| `photo_uploaded` | POST /uploads/:id/confirm | TRAINER | Push |
| `subscription_expiring` | pg-boss cron (3 дня до конца) | TRAINER | Push |

**Хранение push-токенов:**

```
device_tokens table:
  userId, expoPushToken, platform (ios/android), createdAt, updatedAt
  
При логауте — токен не удаляется (устройство может быть переиспользовано).
При доставке с ошибкой DeviceNotRegistered — мягкое удаление токена.
```

---

## 2.6 Структура Docker Compose (dev)

```yaml
# docker-compose.yml (упрощённо)
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: fittrack
      POSTGRES_USER: fittrack
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://fittrack:secret@postgres:5432/fittrack
      JWT_SECRET: dev-secret
      R2_BUCKET: fittrack-dev
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  pg_data:
```

> MinIO добавляется вместо R2 для офлайн-разработки без аккаунта Cloudflare:
> `minio: image: minio/minio` с совместимым S3 API.

---

## Что готово / что осталось

**Готово:**
- [x] Общая системная диаграмма (все сервисы и связи)
- [x] Auth flow: JWT + refresh rotation + кража-детекция
- [x] Realtime: выбор SSE с обоснованием, диаграмма, reconnect-стратегия
- [x] Upload: presigned URL flow, security model, thumbnail pipeline
- [x] Push notifications: flow, типы, хранение токенов
- [x] Docker Compose структура

**Осталось:**
- [ ] Раздел 3: Проектирование БД (schema.prisma + ER-диаграмма)
- [ ] Разделы 4–14

Переходим к **Разделу 3 (Проектирование БД)**?
