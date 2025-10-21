/**
 * Admin utility functions for checking admin access
 */

interface User {
  email?: string | null
  [key: string]: any
}

/**
 * Check if a user has admin access based on their email
 * Admin access is granted to users with @onesync.music email addresses
 * or the specific email info@onesync.music
 */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user || !user.email) {
    return false
  }

  const email = user.email.toLowerCase()
  
  return (
    email.endsWith('@onesync.music') || 
    email === 'info@onesync.music'
  )
}

/**
 * Get a list of allowed admin email domains
 */
export function getAdminEmailDomains(): string[] {
  return ['@onesync.music']
}

/**
 * Get specific allowed admin emails (not including domain patterns)
 */
export function getAdminEmails(): string[] {
  return ['info@onesync.music']
}

