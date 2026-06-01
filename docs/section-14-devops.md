# Раздел 14 — DevOps

## 14.1 Docker Compose

```yaml
# docker-compose.yml

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: fittrack
      POSTGRES_USER: fittrack
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fittrack"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://fittrack:${DB_PASSWORD:-secret}@postgres:5432/fittrack
      JWT_SECRET: ${JWT_SECRET:-dev-jwt-secret-change-in-prod}
      R2_ENDPOINT: http://minio:9000
      R2_ACCESS_KEY_ID: ${MINIO_ROOT_USER:-minioadmin}
      R2_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD:-minioadmin}
      R2_BUCKET: fittrack
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_started
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  pg_data:
  minio_data:
```

## 14.2 Backend Dockerfile (dev)

```dockerfile
# backend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]
```

## 14.3 .env шаблон

```bash
# .env.example — копировать в .env, заполнить значения

# Database
DB_PASSWORD=secret
DATABASE_URL=postgresql://fittrack:secret@localhost:5432/fittrack

# JWT
JWT_SECRET=change-this-to-random-32-char-string

# Storage (dev: MinIO, prod: Cloudflare R2)
R2_ENDPOINT=http://localhost:9000
R2_ACCESS_KEY_ID=minioadmin
R2_SECRET_ACCESS_KEY=minioadmin
R2_BUCKET=fittrack

# Push notifications
EXPO_ACCESS_TOKEN=

# Billing
REVENUECAT_WEBHOOK_SECRET=
YOOMONEY_WALLET=
YOOMONEY_SECRET=

# CORS
ALLOWED_ORIGINS=http://localhost:8081
```

## 14.4 Workflow локальной разработки

```bash
# 1. Клонировать репо и настроить env
cp .env.example .env
# Отредактировать .env под себя

# 2. Запустить инфраструктуру
docker compose up -d

# 3. Применить миграции БД
cd backend
npm run db:migrate     # prisma migrate dev

# 4. Создать бакет в MinIO (один раз)
npm run storage:init   # скрипт создаёт бакет через aws-sdk

# 5. Запустить backend (уже в docker, или локально)
npm run dev

# 6. Запустить Expo
cd ../frontend
npm run start
# Открыть на девайсе через Expo Go или эмулятор

# Полезные команды
npm run db:studio      # Prisma Studio (UI для БД)
npm run db:seed        # Заполнить тестовыми данными
npm run generate:api   # Перегенерировать Orval-клиент
```

## 14.5 Скрипты package.json (backend)

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "db:seed": "tsx src/prisma/seed.ts",
    "storage:init": "tsx scripts/init-storage.ts"
  }
}
```

## 14.6 Seed-данные для демо

```typescript
// backend/src/prisma/seed.ts

async function main() {
  // Тренер
  const trainerUser = await prisma.user.create({
    data: {
      email: 'trainer@demo.com',
      passwordHash: await argon2.hash('demo1234'),
      role: 'TRAINER',
      trainerProfile: {
        create: { name: 'Alex Trainer', specialization: 'Strength & Conditioning' },
      },
    },
  })

  // 3 клиента
  for (let i = 1; i <= 3; i++) {
    await prisma.user.create({
      data: {
        email: `client${i}@demo.com`,
        passwordHash: await argon2.hash('demo1234'),
        role: 'CLIENT',
        clientProfile: {
          create: {
            trainerId: trainerUser.trainerProfile!.id,
            name: `Client ${i}`,
            age: 25 + i,
            weight: 70 + i * 5,
            height: 175,
          },
        },
      },
    })
  }

  // Шаблон тренировки с 3 днями
  // ... (создаёт workout_template, days, exercises)
}
```
