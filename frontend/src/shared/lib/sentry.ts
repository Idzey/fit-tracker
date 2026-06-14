import * as Sentry from '@sentry/react-native'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN
const enabled = Boolean(dsn)

Sentry.init({
  dsn,
  enabled,
  debug: enabled && __DEV__,
  environment: process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production'),
  tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
})

export { Sentry }

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!enabled) return

  Sentry.withScope((scope) => {
    if (context) scope.setContext('context', context)
    Sentry.captureException(error)
  })
}
