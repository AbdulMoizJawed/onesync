"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type UserRole = 'admin' | 'user' | null

interface RoleContextType {
  role: UserRole
  isAdmin: boolean
  isLoading: boolean
  checkRole: (requiredRole: UserRole) => boolean
  refetchRole: () => Promise<void>
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserRole = async () => {
    if (!user) {
      setRole(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Fast path for admin emails - no database call needed
      const email = user.email?.toLowerCase() || ''
      const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
      
      const domainOk = email.endsWith('@onesync.music')
      const listOk = allowlist.includes(email)
      
      if (domainOk || listOk) {
        console.log('🚀 Fast admin detection for:', email)
        setRole('admin')
        setIsLoading(false)
        return
      }
      
      // Get user role from database for non-admin users
      if (!supabase) {
        console.error('Supabase client not available')
        setRole('user')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user role:', error)
        setRole('user') // Default to user role
        return
      }

      const userRole = profile?.role || 'user'
      setRole(userRole as UserRole)
    } catch (error) {
      console.error('Error checking user role:', error)
      setRole('user') // Default to user role on error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserRole()
  }, [user])

  const checkRole = (requiredRole: UserRole): boolean => {
    if (!requiredRole) return true
    if (!role) return false
    
    // Admin can access everything
    if (role === 'admin') return true
    
    // Check specific role
    return role === requiredRole
  }

  const isAdmin = role === 'admin'

  const value: RoleContextType = {
    role,
    isAdmin,
    isLoading,
    checkRole,
    refetchRole: fetchUserRole
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

// Higher-order component for role-based access control
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole
) {
  return function WrappedComponent(props: P) {
    const { checkRole, isLoading } = useRole()
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )
    }

    if (!checkRole(requiredRole)) {
      return (
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-400">
            You need {requiredRole} privileges to access this content.
          </p>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Component for conditional rendering based on role
interface RoleGuardProps {
  role?: UserRole
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleGuard({ role, fallback = null, children }: RoleGuardProps) {
  const { checkRole, isLoading } = useRole()
  
  if (isLoading) {
    return (
      <div className="inline-block">
        <div className="animate-pulse bg-gray-700 h-4 w-16 rounded"></div>
      </div>
    )
  }

  if (!checkRole(role || null)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Admin-only component wrapper
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard role="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
