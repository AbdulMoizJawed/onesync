"use client"

import React from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { stripe } from '@/lib/stripe'

interface StripeProviderProps {
  children: React.ReactNode
  options?: any // You can specify more specific types as needed
}

export function StripeProvider({ 
  children, 
  options = {} 
}: StripeProviderProps) {
  return (
    <Elements 
      stripe={stripe} 
      options={{
        mode: 'payment',
        amount: 1000, // Example amount in cents
        currency: 'usd',
        ...options
      }}
    >
      {children}
    </Elements>
  )
}
