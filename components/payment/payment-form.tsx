"use client"

import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface PaymentFormProps {
  amount: number
  currency?: string
  description: string
  onSuccess?: (paymentIntent: any) => void
  onError?: (error: string) => void
}

export function PaymentForm({ 
  amount, 
  currency = 'usd', 
  description, 
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Card element not found')
      setIsProcessing(false)
      return
    }

    try {
      // Create payment intent on your server
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: { description },
        }),
      })

      const { client_secret } = await response.json()

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        onError?.(stripeError.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        setSucceeded(true)
        onSuccess?.(paymentIntent)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  if (succeeded) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <Alert className="border-green-800 bg-green-900/20">
            <AlertDescription className="text-green-400">
              Payment successful! Thank you for your purchase.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-lg sm:text-xl">Payment Details</CardTitle>
        <p className="text-gray-400 text-sm sm:text-base">{description}</p>
        <p className="text-base sm:text-lg font-semibold text-white">
          ${amount.toFixed(2)} {currency.toUpperCase()}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 sm:p-4 border border-gray-700 rounded-lg bg-gray-800/50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#ffffff',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                  },
                },
              }}
            />
          </div>

          {error && (
            <Alert className="border-red-800 bg-red-900/20">
              <AlertDescription className="text-red-400 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full button-primary h-11 sm:h-auto text-sm sm:text-base"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm sm:text-base">Processing...</span>
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
