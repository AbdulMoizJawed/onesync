import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export interface RoleCheckResult {
  isAuthorized: boolean
  user: any
  role: string | null
  error?: string
}

export async function checkUserRole(requiredRole: 'admin' | 'user' = 'user'): Promise<RoleCheckResult> {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        isAuthorized: false,
        user: null,
        role: null,
        error: 'Not authenticated'
      }
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return {
        isAuthorized: false,
        user,
        role: null,
        error: 'Profile not found'
      }
    }

    const userRole = profile?.role || 'user'
    
    // Check admin access using both database role and email domain/allowlist
    if (requiredRole === 'admin') {
      const email = user.email?.toLowerCase() || ''
      const allowlist = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
      
      const domainOk = email.endsWith('@onesync.music')
      const listOk = allowlist.includes(email)
      const dbRoleOk = userRole === 'admin'
      
      const isAdmin = !!email && (domainOk || listOk || dbRoleOk)
      
      return {
        isAuthorized: isAdmin,
        user,
        role: userRole,
        error: isAdmin ? undefined : 'Admin access required'
      }
    }

    // For regular user access, any authenticated user is authorized
    return {
      isAuthorized: true,
      user,
      role: userRole
    }

  } catch (error) {
    console.error('Role check error:', error)
    return {
      isAuthorized: false,
      user: null,
      role: null,
      error: 'Role check failed'
    }
  }
}

export async function withRoleCheck(
  handler: (request: NextRequest, context: { user: any; role: string }) => Promise<NextResponse>,
  requiredRole: 'admin' | 'user' = 'user'
) {
  return async (request: NextRequest) => {
    const roleCheck = await checkUserRole(requiredRole)
    
    if (!roleCheck.isAuthorized) {
      return NextResponse.json(
        { error: roleCheck.error || 'Unauthorized' },
        { status: roleCheck.error === 'Not authenticated' ? 401 : 403 }
      )
    }

    return handler(request, { 
      user: roleCheck.user, 
      role: roleCheck.role || 'user' 
    })
  }
}

export function createRoleGuard(requiredRole: 'admin' | 'user' = 'user') {
  return async (request: NextRequest) => {
    const roleCheck = await checkUserRole(requiredRole)
    
    if (!roleCheck.isAuthorized) {
      return NextResponse.json(
        { 
          error: roleCheck.error || 'Unauthorized',
          required: requiredRole,
          current: roleCheck.role 
        },
        { status: roleCheck.error === 'Not authenticated' ? 401 : 403 }
      )
    }

    return NextResponse.next()
  }
}
