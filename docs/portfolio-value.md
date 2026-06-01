# Portfolio — Ценность для портфолио

## Что делает проект похожим на реальный коммерческий продукт

| Фича | Почему выглядит по-взрослому |
|---|---|
| JWT + refresh rotation + token family | Детекция кражи токена — редко встречается в учебных проектах |
| Presigned URLs для загрузки файлов | Стандарт production: backend не принимает файлы напрямую |
| SSE с reconnect и lastEventId | Полноценный realtime с resume, а не просто WebSocket-hello-world |
| pg-boss вместо cron | Гарантированная доставка задач с persistence в БД |
| Optimistic updates с rollback | Демонстрирует понимание UX и TanStack Query internals |
| Offline-first action queue | Мобайл-специфика, которую обходят стороной в большинстве RN-портфолио |
| argon2id с параметрами | Осознанный выбор с обоснованием, не просто bcrypt по-умолчанию |
| OpenAPI spec + Orval codegen | Type-safe API contract, единый источник истины |
| Plan enforcement middleware | Реальная монетизационная логика, не просто CRUD |
| Magic bytes validation при upload | Защита сверх `Content-Type` — показывает понимание угроз |

---

## Темы для технического собеседования

### 1. JWT и аутентификация

**Что можно рассказать:** зачем два токена, почему access короткий, как работает rotation, что такое token family и как детектируется кража.

**Каверзные вопросы:**
- «Где хранишь токены на клиенте и почему не localStorage?» → SecureStore (Keychain/Keystore), localStorage = XSS-уязвимость
- «Что произойдёт если база упадёт в момент между revoke старого и insert нового refresh?» → транзакция, оба в одной DB transaction
- «Чем JWT отличается от opaque token?» → JWT самодостаточен (проверяется без БД), opaque — нет

### 2. Presigned URLs

**Что можно рассказать:** зачем, как работает flow из двух шагов (presign → direct upload → confirm), почему backend не принимает файлы напрямую.

**Каверзные вопросы:**
- «Что если пользователь получил presigned URL и не загрузил файл?» → статус `PENDING`, cron удищает висящие записи через 24ч
- «Как предотвратить загрузку вредоносного файла?» → ContentLengthRange в PutObject + magic bytes при confirm
- «Почему подтверждаем через backend, а не через R2 webhook?» → R2 не поддерживает event notification в бесплатном tier; backend-confirm проще и надёжнее

### 3. SSE vs WebSocket

**Что можно рассказать:** разница в направленности, автоматический reconnect в SSE, heartbeat против proxy timeout, lastEventId для resume.

**Каверзные вопросы:**
- «Что произойдёт с SSE если у нас несколько инстансов backend?» → in-memory connections не шарятся → Redis pub/sub
- «Почему не использовал WebSocket если он мощнее?» → все события однонаправленные (сервер → клиент), WebSocket = избыточная сложность
- «Как ты передаёшь JWT в SSE если EventSource не поддерживает headers?» → query param `?token=` или кастомный fetch-based client

### 4. TanStack Query и optimistic updates

**Что можно рассказать:** query keys как кэш-адреса, invalidation strategy, optimistic update с rollback через `onMutate`/`onError`/`onSettled`.

**Каверзные вопросы:**
- «Что если optimistic update прошёл, а сервер вернул ошибку?» → `onError` получает `context.previous` и делает `setQueryData` обратно
- «Как инвалидировать связанные запросы после мутации?» → `queryClient.invalidateQueries` в `onSuccess` по нескольким ключам
- «Зачем `cancelQueries` перед optimistic update?» → предотвращает race condition когда фоновый рефетч перезапишет optimistic state

### 5. Offline-first

**Что можно рассказать:** persist кэша через MMKV, action queue для изменений, flush при восстановлении сети.

**Каверзные вопросы:**
- «Что если клиент офлайн завершил тренировку, потом включился и данные уже протухли?» → флаш происходит как можно скорее; конфликты разрешаются по принципу «клиент всегда прав» для workout logs
- «Почему MMKV а не AsyncStorage?» → MMKV синхронный, значительно быстрее для frequent reads (persist каждые N мс)

### 6. Монетизация (RevenueCat + ЮMoney)

**Что можно рассказать:** почему нельзя просто Stripe в iOS, комиссия 30%, webhook-based plan update, idempotency.

**Каверзные вопросы:**
- «Что если webhook пришёл дважды (duplicate)?» → upsert идемпотентен; можно добавить `revenuecatId` уникальный индекс
- «Как Apple/Google узнают что ты не обходишь IAP?» → App Store review проверяет код; нельзя показывать внешнюю оплату внутри app UI
- «Как обрабатывать refund?» → RevenueCat шлёт `CANCELLATION` event → plan downgrade
