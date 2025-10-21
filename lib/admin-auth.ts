import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateAdmin } from '@/lib/admin'

export interface AdminAuthResult {
  isAdmin: boolean
  user: any
  error?: string
}

export async function checkAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()
    
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        isAdmin: false,
        user: null,
        error: 'Authentication required'
      }
    }

    const userEmail = session.user.email
    const adminEval = evaluateAdmin(userEmail)

    if (!adminEval.isAdmin) {
      return {
        isAdmin: false,
        user: session.user,
        error: 'Admin access required. Only @onesync.music emails are allowed.'
      }
    }

    return {
      isAdmin: true,
      user: session.user
    }
  } catch (error) {
    console.error('Admin auth check failed:', error)
    return {
      isAdmin: false,
      user: null,
      error: 'Authentication check failed'
    }
  }
}

export function createAdminApiResponse(authResult: AdminAuthResult) {
  if (!authResult.isAdmin) {
    return NextResponse.json(
      { 
        error: authResult.error || 'Unauthorized',
        details: 'Admin access required. Only @onesync.music emails or specifically authorized users can access this endpoint.'
      }, 
      { status: 401 }
    )
  }
  return null
}

// Wrapper function for admin-only API routes
export function withAdminAuth(handler: (request: NextRequest, authResult: AdminAuthResult, ...args: any[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: any[]) => {
    const authResult = await checkAdminAuth(request)
    
    if (!authResult.isAdmin) {
      return createAdminApiResponse(authResult)
    }

    return handler(request, authResult, ...args)
  }
}
