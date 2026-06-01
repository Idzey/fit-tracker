# Раздел 9 — Экраны мобильного приложения

## 9.1 Карта навигации (Expo Router)

```
app/
├── (auth)/
│   ├── _layout.tsx          # Stack navigator, redirect если авторизован
│   ├── login.tsx
│   └── register.tsx
│
├── (trainer)/
│   ├── _layout.tsx          # Tabs: Dashboard, Clients, Settings
│   ├── index.tsx            # Dashboard (realtime feed)
│   ├── clients/
│   │   ├── index.tsx        # Clients list
│   │   ├── new.tsx          # Add client form
│   │   └── [id]/
│   │       ├── index.tsx    # Client detail (profile + workouts)
│   │       ├── progress.tsx # Progress history
│   │       └── photos.tsx   # Photo gallery
│   ├── templates/
│   │   ├── index.tsx        # Workout templates list
│   │   ├── new.tsx          # Create template
│   │   └── [id]/
│   │       ├── index.tsx    # Template detail
│   │       └── edit.tsx     # Edit template + days + exercises
│   └── settings/
│       ├── index.tsx        # Settings menu
│       ├── profile.tsx      # Edit profile
│       └── subscription.tsx # Plan & billing
│
├── (client)/
│   ├── _layout.tsx          # Tabs: Home, Workouts, Progress, Photos, Profile
│   ├── index.tsx            # Home (today's workout)
│   ├── workouts/
│   │   ├── index.tsx        # Workouts list (all assigned)
│   │   └── [logId]/
│   │       └── index.tsx    # Workout execution screen
│   ├── progress.tsx         # Progress stats + charts
│   ├── photos/
│   │   ├── index.tsx        # Photo gallery
│   │   └── upload.tsx       # Upload new photo
│   └── profile.tsx          # Profile + settings
│
└── _layout.tsx              # Root: определяет роль → redirect
```

---

## 9.2 Trainer — экраны

### Dashboard (`(trainer)/index.tsx`)

| Состояние | UI |
|---|---|
| Loading | Skeleton cards |
| Пустое | «Добавьте первого клиента» + CTA кнопка |
| Данные | Feed: последние завершённые тренировки, активные клиенты сегодня |
| SSE событие | Toast + обновление списка без перезагрузки |

### Clients list (`(trainer)/clients/index.tsx`)

| Состояние | UI |
|---|---|
| Loading | Skeleton list |
| Пустое | «Нет клиентов» + FAB кнопка Add |
| Данные | FlatList: аватар, имя, последняя тренировка, статус |
| Free limit | Badge «3/3», кнопка Add → Paywall |

### Client detail (`(trainer)/clients/[id]/index.tsx`)

| Состояние | UI |
|---|---|
| Loading | Skeleton profile |
| Данные | Профиль + назначенные программы + кнопка «Назначить программу» |
| Нет программы | CTA «Назначить первую программу» |

### Workout Builder (`(trainer)/templates/[id]/edit.tsx`)

| Состояние | UI |
|---|---|
| Loading | Skeleton |
| Данные | Accordion по дням → список упражнений (drag to reorder) |
| Пустой день | «+ Добавить упражнение» |
| Save | Оптимистичный update → rollback при ошибке |

### Settings / Subscription (`(trainer)/settings/subscription.tsx`)

| Состояние | UI |
|---|---|
| Free plan | Карточка плана + кнопка Upgrade → Paywall sheet |
| Pro plan | Карточка с датой продления + кнопка Manage |
| Loading | Skeleton |

---

## 9.3 Client — экраны

### Home (`(client)/index.tsx`)

| Состояние | UI |
|---|---|
| Loading | Skeleton |
| Нет тренировки сегодня | «Отдыхайте, следующая тренировка {дата}» |
| Тренировка назначена | Карточка: название, упражнения, кнопка Start |
| Тренировка завершена | Карточка с чекмаркой |

### Workout execution (`(client)/workouts/[logId]/index.tsx`)

| Состояние | UI |
|---|---|
| Загрузка | Skeleton |
| В процессе | ScrollView: упражнения → подходы (чекбоксы) → ввод фактических данных |
| Упражнение выполнено | Зачёркнуто + чекмарк |
| Все выполнены | Кнопка «Завершить тренировку» |
| Завершено | Success screen + confetti → Home |

### Progress (`(client)/progress.tsx`)

| Состояние | UI |
|---|---|
| Loading | Skeleton |
| Нет данных | «Завершите первую тренировку» |
| Данные | Streak badge, completion rate, chart по неделям |

### Photos (`(client)/photos/index.tsx`)

| Состояние | UI |
|---|---|
| Loading | Skeleton grid |
| Пустое | «Загрузите первое фото» + FAB |
| Данные | Grid 3 колонки, thumbnails |
| Upload | Прогресс-индикатор → оптимистичный placeholder |

---

## 9.4 Общие экраны

| Экран | Путь |
|---|---|
| Splash / Auth gate | `app/_layout.tsx` |
| 404 | `app/+not-found.tsx` |
| Paywall | Modal sheet, вызывается из любого экрана |
| Notifications | Modal sheet, иконка в header |
