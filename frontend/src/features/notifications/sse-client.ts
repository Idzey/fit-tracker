type SseHandler = (data: unknown) => void

interface SseEvent {
  id?: string
  event?: string
  data?: string
}

class SseClient {
  private handlers = new Map<string, Set<SseHandler>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private abortController: AbortController | null = null
  private shouldReconnect = true
  private lastEventId: string | null = null

  connect(baseUrl: string, token: string) {
    this.disconnect()
    this.shouldReconnect = true
    this.tryConnect(baseUrl, token)
  }

  private async tryConnect(baseUrl: string, token: string) {
    const url = new URL('/sse', baseUrl)
    url.searchParams.set('token', token)
    if (this.lastEventId) url.searchParams.set('lastEventId', this.lastEventId)

    this.abortController = new AbortController()

    try {
      const response = await fetch(url.toString(), {
        headers: this.lastEventId ? { 'Last-Event-ID': this.lastEventId } : undefined,
        signal: this.abortController.signal,
      })

      if (!response.ok) throw new Error(`SSE failed: ${response.status}`)
      if (!response.body || !('getReader' in response.body)) {
        this.scheduleReconnect(baseUrl, token, 30_000)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          this.handleMessage(part)
        }
      }

      this.scheduleReconnect(baseUrl, token, 3_000)
    } catch {
      this.scheduleReconnect(baseUrl, token, 5_000)
    }
  }

  private handleMessage(raw: string) {
    if (!raw.trim() || raw.startsWith(':')) return

    const event: SseEvent = {}
    for (const line of raw.split('\n')) {
      const index = line.indexOf(':')
      if (index === -1) continue
      const key = line.slice(0, index)
      const value = line.slice(index + 1).trimStart()

      if (key === 'id') event.id = value
      if (key === 'event') event.event = value
      if (key === 'data') event.data = event.data ? `${event.data}\n${value}` : value
    }

    if (event.id) this.lastEventId = event.id
    if (!event.event) return

    let payload: unknown = event.data
    if (event.data) {
      try {
        payload = JSON.parse(event.data)
      } catch {
        payload = event.data
      }
    }

    this.emit(event.event, payload)
  }

  private scheduleReconnect(baseUrl: string, token: string, delay: number) {
    if (!this.shouldReconnect) return
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => this.tryConnect(baseUrl, token), delay)
  }

  on(event: string, handler: SseHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
  }

  off(event: string, handler: SseHandler) {
    this.handlers.get(event)?.delete(handler)
  }

  emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach((handler) => handler(data))
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.abortController?.abort()
    this.reconnectTimer = null
    this.abortController = null
  }
}

export const sseClient = new SseClient()

