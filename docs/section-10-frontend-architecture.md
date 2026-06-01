# Раздел 10 — Frontend-архитектура

## 10.1 Структура папок

```
frontend/src/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/
│   ├── (trainer)/
│   ├── (client)/
│   └── _layout.tsx
│
├── features/                     # Feature-based модули
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm
│   │   ├── hooks/                # useLogin, useRegister
│   │   └── schemas/              # loginSchema, registerSchema (Zod)
│   ├── clients/
│   │   ├── components/           # ClientCard, ClientList
│   │   ├── hooks/                # useClients, useClient, useCreateClient
│   │   └── schemas/
│   ├── workouts/
│   │   ├── components/           # WorkoutCard, ExerciseRow, WorkoutBuilder
│   │   ├── hooks/                # useWorkoutLog, useCompleteWorkout
│   │   └── schemas/
│   ├── progress/
│   │   ├── components/           # ProgressChart, StreakBadge
│   │   └── hooks/                # useProgress
│   ├── photos/
│   │   ├── components/           # PhotoGrid, UploadButton
│   │   └── hooks/                # usePhotos, useUploadPhoto
│   ├── notifications/
│   │   ├── components/           # NotificationItem, NotificationBadge
│   │   ├── hooks/                # useNotifications, useSse
│   │   └── sse-client.ts
│   └── subscriptions/
│       ├── components/           # PaywallSheet, PlanCard
│       └── hooks/                # useSubscription
│
├── shared/
│   ├── components/               # Button, Input, Avatar, Skeleton, Toast...
│   ├── hooks/                    # useDebounce, usePagination
│   └── lib/
│       ├── api-client.ts         # axios instance + interceptors
│       ├── query-client.ts       # TanStack Query config
│       └── secure-store.ts       # SecureStore helpers
│
├── store/                        # Zustand stores
│   ├── auth.store.ts
│   └── ui.store.ts
│
└── api/                          # Orval-generated (не редактировать вручную)
    ├── generated/
    │   ├── fittrack.ts           # Typed API functions
    │   └── fittrack.schemas.ts   # Zod schemas from OpenAPI
    └── orval.config.ts
```

---

## 10.2 TanStack Query: стратегия ключей и кэша

### Query keys

```typescript
// frontend/src/features/clients/hooks/query-keys.ts

export const clientKeys = {
  all: ['clients'] as const,
  list: () => [...clientKeys.all, 'list'] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  photos: (id: string) => [...clientKeys.all, id, 'photos'] as const,
  progress: (id: string) => [...clientKeys.all, id, 'progress'] as const,
}

export const workoutKeys = {
  all: ['workouts'] as const,
  today: () => [...workoutKeys.all, 'today'] as const,
  log: (id: string) => [...workoutKeys.all, 'log', id] as const,
  templates: () => [...workoutKeys.all, 'templates'] as const,
  template: (id: string) => [...workoutKeys.all, 'template', id] as const,
}
```

### Инвалидация после мутаций

```typescript
// После завершения тренировки — обновляем связанные queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: workoutKeys.today() })
  queryClient.invalidateQueries({ queryKey: clientKeys.progress(clientId) })
}

// После создания клиента — обновляем список + subscription (лимит)
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: clientKeys.list() })
  queryClient.invalidateQueries({ queryKey: ['subscription'] })
}
```

### Оптимистичные обновления

```typescript
// Обновление лога упражнения — немедленная реакция UI
const mutation = useMutation({
  mutationFn: updateExerciseLog,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: workoutKeys.log(variables.logId) })
    const previous = queryClient.getQueryData(workoutKeys.log(variables.logId))

    queryClient.setQueryData(workoutKeys.log(variables.logId), (old) =>
      old ? mergeExerciseLog(old, variables) : old
    )

    return { previous }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(workoutKeys.log(variables.logId), context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: workoutKeys.log(variables.logId) })
  },
})
```

### Где применяются оптимистичные updates

| Действие | Почему |
|---|---|
| Отметить подход выполненным | Мгновенный отклик при тренировке — UX критично |
| Загрузка фото (placeholder) | Показываем превью до завершения upload |
| Создание шаблона | Предотвращает "дёрганье" списка при медленном интернете |

---

## 10.3 Zustand stores

```typescript
// frontend/src/store/auth.store.ts

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      logout: async () => {
        await SecureStore.deleteItemAsync('accessToken')
        await SecureStore.deleteItemAsync('refreshToken')
        set({ user: null, isAuthenticated: false })
        queryClient.clear()
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandSecureStorage),
    }
  )
)
```

```typescript
// frontend/src/store/ui.store.ts

interface UIState {
  paywallVisible: boolean
  showPaywall: () => void
  hidePaywall: () => void
}

export const useUIStore = create<UIState>((set) => ({
  paywallVisible: false,
  showPaywall: () => set({ paywallVisible: true }),
  hidePaywall: () => set({ paywallVisible: false }),
}))
```

**Правило:** Zustand — только для UI-состояния и auth. Серверные данные — всегда TanStack Query, не Zustand.

---

## 10.4 Orval: генерация API-клиента

```typescript
// frontend/src/api/orval.config.ts

import { defineConfig } from 'orval'

export default defineConfig({
  fittrack: {
    input: '../backend/openapi.yaml',
    output: {
      mode: 'single',
      target: './generated/fittrack.ts',
      schemas: './generated/fittrack.schemas.ts',
      client: 'react-query',
      override: {
        mutator: {
          path: '../shared/lib/api-client.ts',
          name: 'apiClient',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
})
```

**Команда генерации:**
```bash
npx orval --config src/api/orval.config.ts
```

Каждый раз при изменении `openapi.yaml` — перегенерировать. Генерированные файлы не редактировать вручную.

---

## 10.5 Формы: React Hook Form + Zod

```typescript
// frontend/src/features/auth/components/LoginForm.tsx

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate: login, isPending } = useLogin()

  return (
    <Controller
      control={control}
      name="email"
      render={({ field }) => (
        <Input
          {...field}
          label="Email"
          error={errors.email?.message}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}
    />
    // ...
  )
}
```

---

## 10.6 Единый подход к error/loading/empty states

```typescript
// frontend/src/shared/components/QueryState.tsx

interface Props<T> {
  query: UseQueryResult<T>
  loading: ReactNode
  empty: ReactNode
  children: (data: T) => ReactNode
}

export function QueryState<T>({ query, loading, empty, children }: Props<T>) {
  if (query.isLoading) return <>{loading}</>
  if (query.isError) return <ErrorView onRetry={query.refetch} />
  if (!query.data || isEmpty(query.data)) return <>{empty}</>
  return <>{children(query.data)}</>
}

// Использование:
<QueryState
  query={clientsQuery}
  loading={<ClientListSkeleton />}
  empty={<EmptyClients onAdd={() => router.push('/clients/new')} />}
>
  {(clients) => <ClientList clients={clients} />}
</QueryState>
```
