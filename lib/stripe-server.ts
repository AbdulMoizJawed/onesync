import Stripe from 'stripe'

export function createStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover' as any
  })
}

export function getStripeInstance(): Stripe | null {
  try {
    return createStripeClient()
  } catch (error) {
    console.error('Failed to initialize Stripe:', error)
    return null
  }
}
