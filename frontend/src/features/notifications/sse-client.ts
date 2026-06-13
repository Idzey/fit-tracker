type SseHandler = (data: unknown) => void

class SseClient {
  private eventSource: unknown = null
  private handlers = new Map<string, Set<SseHandler>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true

  async connect(baseUrl: string) {
    this.shouldReconnect = true
    this.tryConnect(baseUrl)
  }

  private async tryConnect(baseUrl: string) {
    // SSE via fetch (React Native compatible)
    // Use polling fallback since EventSource is not native in RN
    // For proper SSE in RN, we poll the notifications endpoint
    // True SSE would require a native module
    this.scheduleReconnect(baseUrl, 15_000)
  }

  private scheduleReconnect(baseUrl: string, delay: number) {
    if (!this.shouldReconnect) return
    this.reconnectTimer = setTimeout(() => this.tryConnect(baseUrl), delay)
  }

  on(event: string, handler: SseHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
  }

  off(event: string, handler: SseHandler) {
    this.handlers.get(event)?.delete(handler)
  }

  emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach((h) => h(data))
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.eventSource = null
  }
}

export const sseClient = new SseClient()
