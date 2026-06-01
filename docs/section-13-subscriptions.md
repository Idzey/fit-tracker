# Раздел 13 — Подписки и монетизация

## 13.1 Схема взаимодействия

```
iOS/Android app
  └─► RevenueCat SDK (Purchases.purchasePackage)
        └─► App Store / Google Play IAP
              └─► RevenueCat webhook → POST /webhooks/revenuecat
                    └─► обновить subscriptions в БД

Web (email-ссылка)
  └─► ЮMoney checkout URL
        └─► пользователь платит
              └─► ЮMoney notification → POST /webhooks/yoomoney
                    └─► обновить subscriptions в БД
```

## 13.2 RevenueCat интеграция

### Frontend

```typescript
// frontend/src/features/subscriptions/lib/revenuecat.ts

import Purchases, { PurchasesPackage } from 'react-native-purchases'

export async function initRevenueCat(userId: string) {
  Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_KEY! })
  await Purchases.logIn(userId)
}

export async function purchasePro(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg)
  const isActive = customerInfo.entitlements.active['pro'] !== undefined
  return isActive
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases()
  return customerInfo.entitlements.active['pro'] !== undefined
}
```

### Backend webhook handler

```typescript
// backend/src/modules/subscriptions/revenuecat.webhook.ts

export async function handleRevenuecatWebhook(req: FastifyRequest, reply: FastifyReply) {
  const signature = req.headers['x-revenuecat-signature'] as string
  if (!verifyRevenuecatWebhook(JSON.stringify(req.body), signature)) {
    return reply.status(401).send()
  }

  const event = req.body as RevenuecatEvent

  if (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') {
    await prisma.subscription.upsert({
      where: { trainerId: event.app_user_id },
      update: {
        plan: 'PRO',
        status: 'ACTIVE',
        expiresAt: new Date(event.expiration_at_ms),
        revenuecatId: event.id,
      },
      create: {
        trainerId: event.app_user_id,
        plan: 'PRO',
        status: 'ACTIVE',
        expiresAt: new Date(event.expiration_at_ms),
        revenuecatId: event.id,
      },
    })
  }

  if (event.type === 'CANCELLATION' || event.type === 'EXPIRATION') {
    await prisma.subscription.update({
      where: { trainerId: event.app_user_id },
      data: { plan: 'FREE', status: 'CANCELLED' },
    })
  }

  reply.status(200).send()
}
```

## 13.3 ЮMoney интеграция

### Создание платёжной ссылки

```typescript
// backend/src/modules/subscriptions/yoomoney.service.ts

export function createYoomoneyPaymentUrl(trainerId: string): string {
  const params = new URLSearchParams({
    receiver: process.env.YOOMONEY_WALLET!,
    'quickpay-form': 'donate',
    targets: 'FitTrack Pro подписка',
    paymentType: 'AC', // банковская карта
    sum: '990',
    label: trainerId, // вернётся в notification для идентификации
    successURL: `${process.env.APP_SCHEME}://payment-success`,
  })

  return `https://yoomoney.ru/quickpay/confirm.xml?${params}`
}
```

### Webhook от ЮMoney

```typescript
export async function handleYoomoneyWebhook(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as YoomoneyNotification

  // Верификация подписи
  const hash = crypto
    .createHash('sha1')
    .update([
      body.notification_type,
      body.operation_id,
      body.amount,
      body.currency,
      body.datetime,
      body.sender,
      body.codepro,
      process.env.YOOMONEY_SECRET!,
      body.label,
    ].join('&'))
    .digest('hex')

  if (hash !== body.sha1_hash) return reply.status(401).send()

  if (body.unaccepted || body.codepro) return reply.status(200).send() // не завершён

  const trainerId = body.label
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 дней

  await prisma.subscription.upsert({
    where: { trainerId },
    update: { plan: 'PRO', status: 'ACTIVE', expiresAt, yoomoneyOrderId: body.operation_id },
    create: { trainerId, plan: 'PRO', status: 'ACTIVE', expiresAt, yoomoneyOrderId: body.operation_id },
  })

  reply.status(200).send()
}
```

## 13.4 Plan enforcement middleware

```typescript
// Применяется на POST /trainer/clients
export const PLAN_LIMITS = {
  FREE: { clients: 3, templates: 5, storageMb: 500 },
  PRO: { clients: Infinity, templates: Infinity, storageMb: 10240 },
}

export async function enforcePlanLimit(resource: 'clients' | 'templates') {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const trainer = await getTrainerProfile(req.user.id)
    const subscription = await getOrCreateSubscription(trainer.id)
    const limit = PLAN_LIMITS[subscription.plan][resource]

    const count = resource === 'clients'
      ? await prisma.clientProfile.count({ where: { trainerId: trainer.id } })
      : await prisma.workoutTemplate.count({ where: { trainerId: trainer.id } })

    if (count >= limit) {
      reply.status(403).send({ code: 'PLAN_LIMIT_REACHED', resource })
    }
  }
}
```

## 13.5 pg-boss: проверка истёкших подписок

```typescript
// Ежедневно в 9:00 UTC
boss.schedule('check-expired-subscriptions', '0 9 * * *', async () => {
  const expired = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
  })

  for (const sub of expired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'EXPIRED', plan: 'FREE' },
    })
  }
})

// За 3 дня до истечения — напомнить
boss.schedule('notify-expiring-subscriptions', '0 9 * * *', async () => {
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const expiring = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', expiresAt: { lt: soon, gt: new Date() } },
    include: { trainer: { include: { user: true } } },
  })

  for (const sub of expiring) {
    await sendPushNotification(
      sub.trainer.userId,
      'Your Pro subscription is expiring soon',
      `Renew before ${sub.expiresAt!.toLocaleDateString()}`,
    )
  }
})
```
