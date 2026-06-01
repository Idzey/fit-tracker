# Раздел 8 — Уведомления

## 8.1 Push-инфраструктура

```
React Native App
  └─► expo-notifications (регистрация токена)
        └─► POST /devices/token → сохранить в device_tokens

Backend (pg-boss job / event trigger)
  └─► Expo Push API (https://exp.host/--/api/v2/push/send)
        ├─► FCM (Android)
        └─► APNs (iOS)
```

Expo Push API — абстракция: одна HTTP-точка, Expo сам маршрутизирует на FCM/APNs.

## 8.2 Регистрация токена на клиенте

```typescript
// frontend/src/lib/push-notifications.ts

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

export async function registerPushToken(api: ApiClient) {
  if (!Device.isDevice) return // Симулятор не поддерживает push

  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const token = (await Notifications.getExpoPushTokenAsync()).data

  await api.post('/devices/token', {
    token,
    platform: Platform.OS, // 'ios' | 'android'
  })
}
```

## 8.3 Отправка push с backend

```typescript
// backend/src/lib/push.ts

import { Expo, ExpoPushMessage } from 'expo-server-sdk'

const expo = new Expo()

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const tokens = await prisma.deviceToken.findMany({ where: { userId } })
  if (!tokens.length) return

  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({ to: t.token, title, body, data, sound: 'default' }))

  const chunks = expo.chunkPushNotifications(messages)

  for (const chunk of chunks) {
    const receipts = await expo.sendPushNotificationsAsync(chunk)

    // Удаляем невалидные токены
    for (let i = 0; i < receipts.length; i++) {
      if (receipts[i].status === 'error' &&
          receipts[i].details?.error === 'DeviceNotRegistered') {
        await prisma.deviceToken.delete({ where: { token: messages[i].to as string } })
      }
    }
  }
}
```

## 8.4 Планировщик напоминаний (pg-boss)

```typescript
// backend/src/workers/reminders.worker.ts

// Каждую минуту pg-boss проверяет assigned_programs
// у которых есть workout_day на сегодня и ещё нет workout_log

boss.schedule('send-workout-reminders', '* * * * *', async () => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun … 6=Sat

  // Находим клиентов, у которых тренировка сегодня и ещё не начата
  const due = await prisma.assignedProgram.findMany({
    where: {
      workoutLogs: {
        none: {
          day: { dayNumber: dayOfWeek },
          createdAt: { gte: startOfDay(today) },
        },
      },
    },
    include: {
      client: { include: { user: true } },
      template: { include: { days: { where: { dayNumber: dayOfWeek } } } },
    },
  })

  for (const program of due) {
    if (!program.template.days.length) continue

    await sendPushNotification(
      program.client.userId,
      "Time to work out! 💪",
      `Your training "${program.template.name}" is scheduled for today`,
      { type: 'WORKOUT_REMINDER', programId: program.id },
    )
  }
})
```

## 8.5 Уведомление тренеру при завершении тренировки

```typescript
// backend/src/modules/workouts/workouts.service.ts

export async function completeWorkout(workoutLogId: string, clientId: string) {
  const log = await prisma.workoutLog.update({
    where: { id: workoutLogId, clientId },
    data: { status: 'COMPLETED', completedAt: new Date() },
    include: {
      client: { include: { trainer: { include: { user: true } } } },
      day: { include: { template: true } },
    },
  })

  const trainerId = log.client.trainer.userId

  // SSE для realtime dashboard
  await emitToUser(trainerId, 'workout_completed', {
    clientId,
    clientName: log.client.name,
    workoutLogId,
    templateName: log.day.template.name,
    completedAt: log.completedAt,
  })

  // Push notification
  await sendPushNotification(
    trainerId,
    `${log.client.name} completed a workout`,
    log.day.template.name,
    { type: 'WORKOUT_COMPLETED', workoutLogId },
  )

  // Сохранить в notifications для in-app центра уведомлений
  await prisma.notification.create({
    data: {
      userId: trainerId,
      type: 'WORKOUT_COMPLETED',
      title: `${log.client.name} completed a workout`,
      body: log.day.template.name,
      data: { workoutLogId },
    },
  })
}
```

## 8.6 Сводная таблица уведомлений

| Тип | Триггер | Канал | Получатель |
|---|---|---|---|
| `WORKOUT_REMINDER` | pg-boss cron (ежеминутно) | Push | CLIENT |
| `WORKOUT_COMPLETED` | POST /workouts/:id/complete | Push + SSE + in-app | TRAINER |
| `PHOTO_UPLOADED` | POST /uploads/:id/confirm | Push + in-app | TRAINER |
| `SUBSCRIPTION_EXPIRING` | pg-boss cron (daily, за 3 дня) | Push + in-app | TRAINER |
