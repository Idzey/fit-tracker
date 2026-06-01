# Шаг 0 — План проекта: FitTrack SaaS

## А. Оглавление проекта

| # | Раздел | Артефакты |
|---|--------|-----------|
| 1 | Архитектура продукта | Роли/права, тарифные планы (таблица), user journeys, монетизация, MVP/roadmap |
| 2 | Системная архитектура | Mermaid-диаграммы: общая система, auth flow, realtime, upload, notifications |
| 3 | Проектирование БД | `schema.prisma` (полный), ER-диаграмма Mermaid |
| 4 | Backend-модули | Зоны ответственности, endpoints, DTO-таблицы, Zod-схемы, permissions matrix |
| 5 | Аутентификация | JWT + refresh rotation, диаграмма flow, обработка кражи токена |
| 6 | Realtime | Таблица trade-offs (WS / SSE / polling / managed), обоснование выбора, код |
| 7 | Хранилище (фото) | Провайдер, signed URLs, security model, image optimization pipeline |
| 8 | Уведомления | Expo Push / FCM / APNs, scheduler напоминаний, диаграмма flow |
| 9 | Экраны приложения | Карта навигации Expo Router, список экранов и их состояний |
| 10 | Frontend-архитектура | Структура папок, TanStack Query strategy, Zustand store, Orval workflow |
| 11 | API Design | OpenAPI 3.1 YAML: все маршруты, примеры, pagination, error format |
| 12 | Безопасность | Rate limiting, argon2 vs bcrypt, upload защита, audit logging |
| 13 | DevOps | Docker Compose, CI/CD GitHub Actions, env management |
| NFR | Нефункциональные требования | Offline-first, optimistic updates, observability, масштаб |
| Portfolio | Ценность для портфолио | Темы для собеседований, каверзные вопросы |

---

## Б. Разбивка на спринты

### Sprint 0 — Infrastructure & Skeleton (2 weeks)
**Цель:** рабочая основа, в которую можно начать добавлять фичи без переделок.

| Категория | Scope |
|-----------|-------|
| Infra | Docker Compose (PostgreSQL, backend, future Redis slot), `.env` шаблон |
| Backend skeleton | Fastify + TypeScript + Prisma init, структура папок, health check `/api/health` |
| DB | Полная `schema.prisma` (все сущности), первые миграции |
| Auth skeleton | `POST /auth/register`, `POST /auth/login`, JWT access + refresh (rotation), middleware |
| Frontend skeleton | Expo Router layout, NativeWind config, React Native Reusables setup, Zustand auth store |

**Deliverables:** запущенный `docker compose up`, регистрация/логин работают end-to-end, Expo открывается на девайсе.

**Definition of Done:** `docker compose up` без ошибок; Expo подключается к backend; JWT выдаётся и валидируется.

**Зависимости:** нет.

**Риски:** выбор провайдера хранилища (S3-compatible) — нужно решить до Sprint 2 (upload).

---

### Sprint 1 — Auth & Users (MVP) (2 weeks)
**Цель:** полный auth-flow обеих ролей, защищённые маршруты, профили.

| Категория | Scope |
|-----------|-------|
| Backend | Refresh token rotation + кража-детекция, `GET/PUT /users/me`, trainer/client profile endpoints |
| Frontend | Login / Register экраны (RHF + Zod), auth guard в Expo Router, сохранение токенов (SecureStore), auto-refresh interceptor |
| Orval | Первая генерация клиента из OpenAPI spec |

**Deliverables:** тренер и клиент регистрируются, логинятся, видят свои профили; refresh rotation работает.

**Definition of Done:** auth flow работает end-to-end; refresh rotation и кража-детекция проверены вручную; Expo подключается с обоими ролями.

**Зависимости:** Sprint 0.

**Риски:** SecureStore на Android Emulator иногда глючит — иметь fallback для dev.

---

### Sprint 2 — Clients & Workout Templates (MVP) (2 weeks)
**Цель:** тренер создаёт клиентов и шаблоны тренировок.

| Категория | Scope |
|-----------|-------|
| Backend | CRUD clients, CRUD workout_templates + workout_days + exercises |
| Frontend | Trainer: Clients list/detail, Workout Builder экран |
| TanStack Query | Query keys strategy, optimistic create/update для шаблонов |

**Deliverables:** тренер добавляет клиента, создаёт шаблон тренировки с упражнениями.

**Definition of Done:** тренер не видит клиентов другого тренера; workout builder сохраняет шаблон; optimistic update откатывается при ошибке.

**Зависимости:** Sprint 1 (auth, profiles).

---

### Sprint 3 — Workout Execution & Progress (MVP) (2 weeks)
**Цель:** клиент выполняет тренировки и фиксирует прогресс.

| Категория | Scope |
|-----------|-------|
| Backend | Назначение программ клиентам, `workout_logs`, `exercise_logs` endpoints |
| Frontend | Client: Home (assigned workouts), Workout Detail (mark exercises done), Progress экран |
| Логика | Workout completion detection, статусы (pending / in_progress / completed) |

**Deliverables:** клиент открывает назначенную тренировку, отмечает упражнения, завершает тренировку.

**Definition of Done:** тренер видит статус тренировок клиента; данные прогресса корректно агрегируются.

**Зависимости:** Sprint 2 (шаблоны, клиенты).

---

### Sprint 4 — Photo Upload & Storage (MVP) (2 weeks)
**Цель:** загрузка фото прогресса с presigned URLs.

| Категория | Scope |
|-----------|-------|
| Backend | Upload endpoint (presigned URL flow), `progress_photos` CRUD, image validation (тип, размер) |
| Storage | S3-compatible (Cloudflare R2 для портфолио — без egress fee), thumbnail generation |
| Frontend | Client: Photos экран, upload flow с progress indicator; Trainer: просмотр фото клиента |

**Deliverables:** клиент загружает фото, тренер видит галерею прогресса.

**Definition of Done:** файлы ≠ публично доступны без signed URL; размер > 10MB отклоняется; thumbnails генерируются.

**Зависимости:** Sprint 1 (auth), Sprint 3 (client profiles).

**Риски:** Cloudflare R2 setup — нужен аккаунт; fallback — MinIO в Docker для dev.

---

### Sprint 5 — Realtime & Notifications (MVP) (2 weeks)
**Цель:** тренер получает live-обновления о тренировках клиентов; push-уведомления работают.

| Категория | Scope |
|-----------|-------|
| Realtime | SSE на Fastify (обоснование в разделе 6), trainer dashboard live updates |
| Push | Expo Push Notifications, FCM/APNs, сохранение push tokens |
| Scheduler | Напоминания о тренировках (pg-boss / node-cron) |
| Frontend | Notification center, real-time badge на dashboard |

**Deliverables:** тренер видит «клиент завершил тренировку» без перезагрузки; клиент получает push-напоминание.

**Definition of Done:** SSE переподключается после потери сети; дублирование событий не происходит; push доставляется на реальный девайс.

**Зависимости:** Sprint 3 (workout completion).

---

### Sprint 6 — Subscriptions & Monetization (post-MVP) (2 weeks)
**Цель:** тарифные планы, ограничения по плану, биллинг.

| Категория | Scope |
|-----------|-------|
| Backend | `subscriptions` модуль, plan enforcement middleware (лимит клиентов) |
| Billing | RevenueCat SDK (iOS/Android IAP) + ЮMoney для web-платежей |
| Frontend | Settings: Subscription экран, paywall для превышения лимита |

**Deliverables:** тренер на Free-плане видит paywall при добавлении 4-го клиента.

**Definition of Done:** webhook от RevenueCat обновляет план в БД; downgrade корректно ограничивает фичи.

**Зависимости:** Sprint 1 (users), Sprint 2 (clients).

**Риски:** App Store review может занять 1–2 недели — планировать заранее.

---

### Sprint 7 — UX Polish (post-MVP) (2 weeks)
**Цель:** финальная полировка UX, единообразие состояний экранов.

| Категория | Scope |
|-----------|-------|
| Polish | Loading/error/empty states единообразны, skeleton screens, haptics |
| UX | Анимации переходов, accessibility improvements |

**Deliverables:** все экраны имеют loading/error/empty states; приложение ощущается полированным.

**Зависимости:** Sprint 3, 5.

---

### Sprint 8 — Stabilization & Demo (2 weeks)
**Цель:** production-ready качество, observability, подготовка к демо/собеседованию.

| Категория | Scope |
|-----------|-------|
| Observability | Структурные логи (pino), Sentry (frontend + backend), health checks |
| Offline-first | TanStack Query persist (MMKV), action queue для офлайн-отметки тренировок |
| Docs | README с диаграммами, dev setup, architecture decisions |
| Demo | Seed-данные, screenshots, demo video |

**Definition of Done:** приложение демонстрируется на реальном устройстве; все ключевые flow работают офлайн; Sentry ловит ошибки.

---

### MVP vs Post-MVP

| Фича | Статус |
|------|--------|
| Auth (register/login/refresh) | ✅ MVP |
| Управление клиентами | ✅ MVP |
| Шаблоны и назначение тренировок | ✅ MVP |
| Выполнение тренировок клиентом | ✅ MVP |
| Загрузка фото прогресса | ✅ MVP |
| Push-уведомления | ✅ MVP |
| Realtime (trainer dashboard) | ✅ MVP |
| Подписки и биллинг | 🔜 Post-MVP |
| Offline-first (action queue) | 🔜 Post-MVP (Sprint 8) |
| Multi-language / i18n | ❌ Roadmap |
| Web-версия для тренера | ❌ Roadmap |
| AI workout suggestions | ❌ Roadmap |

---

## В. Допущения и открытые вопросы

### Допущения (принятые решения)

| # | Допущение | Обоснование |
|---|-----------|-------------|
| 1 | Хранилище — **Cloudflare R2** (S3-compatible) | Нет egress fee, бесплатный tier 10GB, простая интеграция через `@aws-sdk/client-s3` |
| 2 | Realtime — **SSE (Server-Sent Events)** на Fastify | Достаточно для uni-directional updates (сервер → клиент); проще WebSocket; нет vendor lock-in как у Pusher. Детали — в разделе 6 |
| 3 | Биллинг — **RevenueCat** (IAP) + **ЮMoney** (web/manual) | RevenueCat абстрагирует App Store / Google Play IAP; ЮMoney — для web-платежей (популярен в РФ, простая интеграция) |
| 4 | Scheduler — **pg-boss** (PostgreSQL-based job queue) | Нет дополнительных сервисов (Redis не нужен для MVP); транзакционные гарантии доставки |
| 5 | Хеширование паролей — **argon2** | Победитель Password Hashing Competition; более устойчив к GPU-атакам чем bcrypt. Детали — в разделе 12 |
| 6 | Thumbnails — **sharp** на backend при upload | Синхронная генерация thumb при upload достаточна для MVP; в проде — вынести в background job |
| 7 | Push notifications — **Expo Push API** (абстракция над FCM/APNs) | Единый API для iOS и Android; достаточно для портфолио |
| 8 | База данных — **PostgreSQL** (без Redis в MVP) | pg-boss покрывает очередь; PostgreSQL LISTEN/NOTIFY можно использовать для realtime вместо Redis pub/sub |
| 9 | Тренер привязан к клиентам 1:N (один тренер на клиента) | Упрощение; в реальном проде клиент мог бы иметь нескольких тренеров |
| 10 | Деплой не входит в портфолио | Проект демонстрируется локально / на devайсе через Expo Go |

### Открытые вопросы

| # | Вопрос | Влияние | Предлагаемый ответ |
|---|--------|---------|-------------------|
| 1 | Нужен ли **web-интерфейс для тренера** (браузер)? | Высокое — меняет архитектуру навигации | Рекомендую: только мобайл в MVP |
| 2 | **Один аккаунт** может быть и тренером и клиентом одновременно? | Среднее — влияет на auth flow | Нет: роль выбирается при регистрации, не меняется |
| 3 | Нужны ли **платёжные webhook-ы** (RevenueCat/ЮMoney) в dev-окружении? | Среднее — Sprint 6 | Да: RevenueCat — через тестовый sandbox; ЮMoney — через ngrok для dev |
| 4 | **Video-контент** (видео упражнений)? | Высокое — хранилище, CDN, player | Нет: только текст + фото в MVP |
| 5 | **Удаление аккаунта** (GDPR right to erasure)? | Низкое для портфолио | Soft-delete (`deletedAt`) в MVP; hard delete — roadmap |
| 6 | Нужен ли **admin-panel** (super admin)? | Низкое | Нет; управление через psql/Prisma Studio |
| 7 | **Язык приложения** — только русский, только английский, или оба? | Низкое | UI на английском (портфолио); i18n — roadmap |
