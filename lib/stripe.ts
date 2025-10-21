import { loadStripe } from '@stripe/stripe-js'
import Stripe from 'stripe'

// Ensure the publishable key is loaded from environment variables
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Memoize the Stripe instance to avoid recreating on every render
export const stripe = stripePublishableKey 
  ? loadStripe(stripePublishableKey, {
      // Optional configuration
      apiVersion: '2025-09-30.clover' as any, // Use the latest API version
      betas: ['payment_element_in_checkout_beta_1'], // Enable latest features
    })
  : null

// Server-side Stripe instance for API routes
let stripeInstance: Stripe | null = null

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    stripeInstance = new Stripe(secret, { apiVersion: '2025-09-30.clover' as any })
  }
  return stripeInstance
}

// Helper function to check if Stripe is configured
export const isStripeConfigured = (): boolean => !!stripePublishableKey

// Payment types
export interface RoyaltyPayout {
  id: string
  userId: string
  releaseId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  payoutDate: string
  stripePayoutId?: string
  metadata?: Record<string, any>
}

export interface RoyaltyAdvance {
  id: string
  userId: string
  releaseId: string
  advanceAmount: number
  currency: string
  interestRate: number
  repaymentTerms: string
  status: 'pending' | 'approved' | 'disbursed' | 'repaying' | 'completed'
  approvedDate?: string
  disbursedDate?: string
  stripePaymentIntentId?: string
}

export interface RoyaltySplit {
  id: string
  releaseId: string
  collaborators: {
    userId: string
    percentage: number
    role: string
  }[]
  splitType: 'equal' | 'custom'
  status: 'active' | 'inactive'
}

// Stripe helper functions
export const createPayoutAccount = async (userId: string, email: string) => {
  try {
    const account = await getStripe().accounts.create({
      type: 'express',
      email,
      metadata: {
        userId,
      },
    })
    return account
  } catch (error) {
    console.error('Error creating Stripe account:', error)
    throw error
  }
}

export const createAccountLink = async (accountId: string, refreshUrl: string, returnUrl: string) => {
  try {
    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
    return accountLink
  } catch (error) {
    console.error('Error creating account link:', error)
    throw error
  }
}

export const createPayout = async (accountId: string, amount: number, currency = 'usd') => {
  try {
    const payout = await getStripe().payouts.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
    }, {
      stripeAccount: accountId,
    })
    return payout
  } catch (error) {
    console.error('Error creating payout:', error)
    throw error
  }
}

export const createPaymentIntent = async (amount: number, currency = 'usd', metadata?: Record<string, string>) => {
  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
    })
    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

export const calculateSplitAmounts = (totalAmount: number, splits: RoyaltySplit['collaborators']) => {
  return splits.map(split => ({
    ...split,
    amount: (totalAmount * split.percentage) / 100
  }))
}
