"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { loadConnectAndInitialize } from '@stripe/connect-js'

interface StripeConnectContextType {
  connectInstance: any | null
  isLoaded: boolean
  error: string | null
  isInitializing: boolean
}

const StripeConnectContext = createContext<StripeConnectContextType>({
  connectInstance: null,
  isLoaded: false,
  error: null,
  isInitializing: false
})

export const useStripeConnect = () => {
  const context = useContext(StripeConnectContext)
  if (!context) {
    throw new Error('useStripeConnect must be used within a StripeConnectProvider')
  }
  return context
}

interface StripeConnectProviderProps {
  children: ReactNode
  publishableKey: string
  fetchClientSecret: () => Promise<string>
  appearance?: {
    theme?: 'stripe' | 'night' | 'flat'
    labels?: 'above' | 'floating'
    variables?: Record<string, string>
  }
}

export function StripeConnectProvider({
  children,
  publishableKey,
  fetchClientSecret,
  appearance = {
    theme: 'night',
    labels: 'floating',
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#1f2937',
      colorText: '#f9fafb',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    }
  }
}: StripeConnectProviderProps) {
  const [connectInstance, setConnectInstance] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadStripeConnect = async () => {
      if (!publishableKey) {
        setError('Stripe publishable key is required')
        return
      }

      try {
        setIsInitializing(true)
        setError(null)

        if (!isMounted) return

        console.log('Initializing Stripe Connect with key:', publishableKey.substring(0, 12) + '...')

        // Initialize using the official loadConnectAndInitialize method
        const instance = await loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret,
          appearance
        })

        if (isMounted) {
          setConnectInstance(instance)
          setIsLoaded(true)
          console.log('Stripe Connect initialized successfully')
        }
      } catch (err: any) {
        console.error('Stripe Connect initialization error:', err)
        if (isMounted) {
          setError(err.message || 'Failed to initialize Stripe Connect')
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    loadStripeConnect()

    return () => {
      isMounted = false
    }
  }, [publishableKey, fetchClientSecret, appearance])

  const value = {
    connectInstance,
    isLoaded,
    error,
    isInitializing
  }

  return (
    <StripeConnectContext.Provider value={value}>
      {children}
    </StripeConnectContext.Provider>
  )
}
