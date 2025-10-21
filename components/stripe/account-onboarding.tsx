"use client"

import { useEffect, useRef, useState } from 'react'
import { useStripeConnect } from './connect-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CreditCard, CheckCircle } from 'lucide-react'
import CustomLoader from '@/components/ui/custom-loader'

interface AccountOnboardingProps {
  accountId: string
  onComplete?: () => void
  className?: string
}

export function AccountOnboarding({ 
  accountId, 
  onComplete,
  className = '' 
}: AccountOnboardingProps) {
  const { connectInstance, isLoaded, error: connectError } = useStripeConnect()
  const onboardingRef = useRef<HTMLDivElement>(null)
  const [onboardingComponent, setOnboardingComponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!isLoaded || !connectInstance || !onboardingRef.current) {
      return
    }

    let isMounted = true

    const initializeOnboarding = async () => {
      try {
        setLoading(true)
        setError(null)

        // Create the account onboarding component
        const onboarding = connectInstance.create('account-onboarding')
        
        if (!isMounted) return

        // Mount the component
        onboardingRef.current!.innerHTML = ''
        onboardingRef.current!.appendChild(onboarding)
        
        setOnboardingComponent(onboarding)
        setLoading(false)

        // Listen for events
        onboarding.on('loaderror', (event: any) => {
          console.error('Onboarding load error:', event)
          if (isMounted) {
            setError('Failed to load onboarding component')
            setLoading(false)
          }
        })

        onboarding.on('ready', () => {
          console.log('Onboarding component ready')
          if (isMounted) {
            setLoading(false)
          }
        })

        // Listen for completion
        onboarding.on('exit', (event: any) => {
          console.log('Onboarding exit:', event)
          if (event.reason === 'complete') {
            if (isMounted) {
              setIsComplete(true)
            }
            onComplete?.()
          }
        })

      } catch (err: any) {
        console.error('Error initializing onboarding:', err)
        if (isMounted) {
          setError(err.message || 'Failed to initialize onboarding')
          setLoading(false)
        }
      }
    }

    initializeOnboarding()

    return () => {
      isMounted = false
      if (onboardingComponent) {
        try {
          onboardingComponent.destroy()
        } catch (err) {
          console.warn('Error destroying onboarding component:', err)
        }
      }
    }
  }, [isLoaded, connectInstance, accountId, onComplete])

  if (connectError) {
    return (
      <Alert className="border-red-500/50 bg-red-500/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-400">
          Failed to load Stripe Connect: {connectError}
        </AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-500/50 bg-red-500/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-400">
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (isComplete) {
    return (
      <Card className={`card-dark border-green-500/50 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2 font-montserrat">
              Account Setup Complete!
            </h3>
            <p className="text-gray-400">
              Your Stripe account has been successfully configured for payouts.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`card-dark ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Account Setup
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Complete your account setup to start receiving payouts
        </p>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <CustomLoader size="lg" showText text="Loading account setup..." />
          </div>
        )}
        
        <div 
          ref={onboardingRef}
          className={`${loading ? 'hidden' : 'block'} min-h-[400px]`}
          style={{
            // Ensure proper styling for embedded component
            width: '100%',
            minHeight: '400px'
          }}
        />
        
        {!loading && !error && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-gray-400 text-xs">
              🔒 Your information is secure and encrypted. Stripe uses industry-standard security measures.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
