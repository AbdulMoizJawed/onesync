"use client"

/**
 * Stub provider for Intercom compatibility
 * Intercom has been replaced with email support
 */
export function IntercomProvider({ children }: { children: React.ReactNode }) {
  // No Intercom initialization - using email support instead
  return <>{children}</>
}
