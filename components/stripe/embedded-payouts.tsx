"use client"

import { useEffect, useRef, useState } from 'react'
import { useStripeConnect } from './connect-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, DollarSign } from 'lucide-react'
import CustomLoader from '@/components/ui/custom-loader'

interface EmbeddedPayoutsProps {
  accountId: string
  className?: string
}

export function EmbeddedPayouts({ accountId, className = '' }: EmbeddedPayoutsProps) {
  const { connectInstance, isLoaded, error: connectError } = useStripeConnect()
  const payoutsRef = useRef<HTMLDivElement>(null)
  const [payoutsComponent, setPayoutsComponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !connectInstance || !payoutsRef.current) {
      return
    }

    let isMounted = true

    const initializePayouts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Create the payouts component
        const payouts = connectInstance.create('payouts')
        
        if (!isMounted) return

        // Mount the component
        payoutsRef.current!.innerHTML = ''
        payoutsRef.current!.appendChild(payouts)
        
        setPayoutsComponent(payouts)
        setLoading(false)

        // Listen for events
        payouts.on('loaderror', (event: any) => {
          console.error('Payouts load error:', event)
          if (isMounted) {
            setError('Failed to load payouts component')
            setLoading(false)
          }
        })

        payouts.on('ready', () => {
          console.log('Payouts component ready')
          if (isMounted) {
            setLoading(false)
          }
        })

      } catch (err: any) {
        console.error('Error initializing payouts:', err)
        if (isMounted) {
          setError(err.message || 'Failed to initialize payouts')
          setLoading(false)
        }
      }
    }

    initializePayouts()

    return () => {
      isMounted = false
      if (payoutsComponent) {
        try {
          payoutsComponent.destroy()
        } catch (err) {
          console.warn('Error destroying payouts component:', err)
        }
      }
    }
  }, [isLoaded, connectInstance, accountId])

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

  return (
    <Card className={`card-dark ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Payouts Dashboard
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Manage your payouts, view balances, and edit payout schedules
        </p>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <CustomLoader size="lg" showText text="Loading payouts..." />
          </div>
        )}
        
        <div 
          ref={payoutsRef}
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
              💡 This is a live Stripe Connect component. Changes you make here will affect your actual account.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
