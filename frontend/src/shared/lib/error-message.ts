type ApiErrorData = {
  message?: string | string[]
  error?: string
}

type ApiError = {
  message?: string
  response?: {
    status?: number
    data?: ApiErrorData | string
  }
}

function normalizeMessage(message: string | string[] | undefined) {
  if (Array.isArray(message)) return message.join('\n')
  return message
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const apiError = error as ApiError
  const data = apiError?.response?.data

  if (typeof data === 'string' && data.trim()) return data

  const dataMessage = typeof data === 'object' ? normalizeMessage(data?.message) ?? data?.error : null
  if (dataMessage) return dataMessage

  if (apiError?.message) return apiError.message

  return fallback
}
