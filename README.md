# FitTrack

Монорепо для FitTrack — SaaS-платформы для фитнес-тренеров.

## Стек

- **Бэкенд:** Fastify, Prisma, PostgreSQL, S3-совместимое хранилище, SSE, Expo push
- **Фронтенд:** Expo Router, React Native, NativeWind, TanStack Query, Zustand
- **Мониторинг:** Pino логи, Sentry, health checks
- **Офлайн:** персистентность TanStack Query + очередь мутаций при отсутствии сети

## Локальный запуск

1. Установить зависимости

```bash
cd backend && npm ci
cd ../frontend && npm ci
```

2. Запустить инфраструктуру

```bash
cd ..
cp .env.example .env
docker compose up -d postgres minio
```

3. Подготовить бэкенд

```bash
cd backend
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Запустить бэкенд

```bash
npm run dev
```

5. Запустить фронтенд

```bash
cd ../frontend
cp .env.example .env
npx expo start --web
```

## Демо-аккаунты

- Тренер: `trainer@fittrack.demo` / `Password123!`
- Клиент: `client@fittrack.demo` / `Password123!`

## Основной сценарий

1. Войти как тренер.
2. Открыть клиентов, шаблоны, уведомления, подписку.
3. Войти как клиент.
4. Открыть тренировку на сегодня, изменить счётчики подходов, завершить тренировку.
5. Отключить сеть и повторить шаг 4 — появится офлайн-очередь и баннер синхронизации.

## Health checks

- `GET /health/live`
- `GET /health/ready`
