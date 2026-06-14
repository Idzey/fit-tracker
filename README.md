# FitTrack

Monorepo for the FitTrack SaaS demo.

## Stack

- Backend: Fastify, Prisma, PostgreSQL, S3-compatible storage, SSE, Expo push
- Frontend: Expo Router, React Native, NativeWind, TanStack Query, Zustand
- Observability: Pino logs, Sentry, health checks
- Offline: TanStack Query persistence + offline workout mutation queue

## Local setup

1. Install deps

```bash
cd backend && npm ci
cd ../frontend && npm ci
```

2. Start infra

```bash
cd ..
cp .env.example .env
docker compose up -d postgres minio
```

3. Prepare backend

```bash
cd backend
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Start backend

```bash
npm run dev
```

5. Start frontend

```bash
cd ../frontend
cp .env.example .env
npx expo start --web
```

## Demo accounts

- Trainer: `trainer@fittrack.demo` / `Password123!`
- Client: `client@fittrack.demo` / `Password123!`

## Key demo flow

1. Log in as trainer.
2. Open clients, templates, notifications, subscription.
3. Log in as client.
4. Open today workout, change set counters, complete workout.
5. Turn network off and repeat step 4 to see offline queue + sync banner.

## Health checks

- `GET /health/live`
- `GET /health/ready`
