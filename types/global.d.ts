declare global {
  interface Window {
    Intercom?: {
      (action: 'show'): void
      (action: 'hide'): void
      (action: 'showNewMessage', message?: string): void
      (action: 'showArticle', articleId: string): void
      (action: 'trackEvent', eventName: string, metadata?: Record<string, any>): void
      (action: 'update', userData: Record<string, any>): void
      (action: 'getUnreadCount'): number
      (action: 'boot', settings: Record<string, any>): void
      (action: 'shutdown'): void
    }
    intercomSettings?: any
  }
}

export {}