"use client"

import React, { useState } from 'react'
import { 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'

export function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Replace with your actual return URL
        return_url: `${window.location.origin}/payment/success`,
      },
    })

    if (error) {
      // Show error to your customer
      setErrorMessage(error.message ?? 'An unexpected error occurred.')
    } else {
      // Your customer will be redirected to your `return_url`
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-500 text-sm">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={isLoading || !stripe}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  )
}
