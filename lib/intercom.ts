"use client"

import { useCallback } from 'react'

/**
 * Stub hook for Intercom compatibility
 * All functions now open email to support@onesync.music
 */
export function useIntercom() {
  const openSupportEmail = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:support@onesync.music?subject=Support Request from OneSync Platform'
    }
  }

  const showMessenger = useCallback(() => {
    openSupportEmail()
  }, [])

  const hideMessenger = useCallback(() => {
    // No-op
  }, [])

  const showNewMessage = useCallback((message?: string) => {
    openSupportEmail()
  }, [])

  const showArticle = useCallback((articleId: string) => {
    openSupportEmail()
  }, [])

  const trackEvent = useCallback((eventName: string, metadata?: Record<string, any>) => {
    // No-op for tracking
  }, [])

  const updateUser = useCallback((userData: Record<string, any>) => {
    // No-op
  }, [])

  const getUnreadCount = useCallback((): number => {
    return 0
  }, [])

  const isIntercomAvailable = useCallback((): boolean => {
    return true // Always available via email
  }, [])

  return {
    showMessenger,
    hideMessenger,
    showNewMessage,
    showArticle,
    trackEvent,
    updateUser,
    getUnreadCount,
    isIntercomAvailable
  }
}
