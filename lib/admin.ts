// Centralized admin access evaluation
export interface AdminEvaluation {
  email: string
  isAdmin: boolean
  domainOk: boolean
  listOk: boolean
  allowlist: string[]
  method: 'domain' | 'allowlist' | 'database' | 'none'
}

export function evaluateAdmin(rawEmail: string | null | undefined): AdminEvaluation {
  const email = (rawEmail || '').trim().toLowerCase()
  
  // Get admin emails from environment
  const adminEmails = [
    ...(process.env.ADMIN_EMAILS || '').split(','),
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',')
  ]
  const allowlist = adminEmails
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  
  // Check @onesync.music domain (primary method)
  const domainOk = email.endsWith('@onesync.music')
  
  // Check explicit allowlist (secondary method)
  const listOk = allowlist.includes(email)
  
  // Determine access and method
  const isAdmin = !!email && (domainOk || listOk)
  const method = domainOk ? 'domain' : listOk ? 'allowlist' : 'none'
  
  return { email, isAdmin, domainOk, listOk, allowlist, method }
}

// Enhanced admin check with role support
export interface AdminCheckResult extends AdminEvaluation {
  hasRole?: boolean
  roleSource?: 'database' | 'environment'
}

export async function checkAdminAccess(
  email: string | null | undefined,
  supabaseClient?: any
): Promise<AdminCheckResult> {
  const baseEval = evaluateAdmin(email)
  
  // If we have a supabase client, also check database role
  if (supabaseClient && email) {
    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('email', email.trim())
        .single()
      
      if (profile?.role === 'admin') {
        return {
          ...baseEval,
          isAdmin: true,
          hasRole: true,
          roleSource: 'database',
          method: 'database'
        }
      }
    } catch (error) {
      console.warn('Could not check database role:', error)
    }
  }
  
  return {
    ...baseEval,
    hasRole: false,
    roleSource: 'environment'
  }
}
