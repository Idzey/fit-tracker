import * as Sentry from '@sentry/node'

const dsn = process.env.SENTRY_DSN
const enabled = Boolean(dsn)

Sentry.init({
  dsn,
  enabled,
  environment: process.env.NODE_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
})

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!enabled) return

  Sentry.withScope((scope) => {
    if (context) scope.setContext('context', context)
    Sentry.captureException(error)
  })
}

export async function flushSentry(timeoutMs = 2_000) {
  if (!enabled) return
  await Sentry.flush(timeoutMs)
}
