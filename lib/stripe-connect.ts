import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover' as any,
})

export async function createConnectAccount(artistId: string, email: string, country: string = 'US') {
  try {
    // Create a Connected account for the artist
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        artist_id: artistId,
        platform: 'music_distribution'
      }
    })

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/artist-settings/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/artist-settings/payments?success=true`,
      type: 'account_onboarding',
    })

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
      created: account.created
    }
  } catch (error) {
    console.error('Error creating Connect account:', error)
    throw error
  }
}

export async function createAccountLink(accountId: string, type: 'account_onboarding' | 'account_update' = 'account_update') {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/artist-settings/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/artist-settings/payments?success=true`,
      type: type,
    })

    return accountLink.url
  } catch (error) {
    console.error('Error creating account link:', error)
    throw error
  }
}

export async function createPayout(artistStripeAccountId: string, amount: number, releaseId: string, artistId: string) {
  try {
    // Create a transfer to the artist's Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount), // Amount in cents, ensure it's an integer
      currency: 'usd',
      destination: artistStripeAccountId,
      transfer_group: `release_${releaseId}`,
      metadata: {
        release_id: releaseId,
        artist_id: artistId,
        type: 'royalty_payout',
        platform: 'music_distribution'
      }
    })

    return {
      transferId: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      status: 'pending',
      created: transfer.created
    }
  } catch (error) {
    console.error('Error creating payout:', error)
    throw error
  }
}

export async function getAccountBalance(artistStripeAccountId: string) {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: artistStripeAccountId
    })

    return {
      available: balance.available.map(bal => ({
        amount: bal.amount,
        currency: bal.currency
      })),
      pending: balance.pending.map(bal => ({
        amount: bal.amount,
        currency: bal.currency
      }))
    }
  } catch (error) {
    console.error('Error fetching balance:', error)
    throw error
  }
}

export async function getAccountDetails(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId)
    
    return {
      id: account.id,
      email: account.email,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      country: account.country,
      default_currency: account.default_currency,
      requirements: account.requirements,
      created: account.created
    }
  } catch (error) {
    console.error('Error fetching account details:', error)
    throw error
  }
}

export async function createSubscriptionForArtist(customerId: string, priceId: string, artistId: string, platformFeePercent: number = 15) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        artist_id: artistId,
        platform: 'music_distribution'
      },
      // Revenue share - platform takes specified percentage
      application_fee_percent: platformFeePercent,
      // Expand to include latest invoice
      expand: ['latest_invoice.payment_intent']
    })

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      current_period_end: (subscription as any).current_period_end,
      latest_invoice: subscription.latest_invoice
    }
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

export async function createCustomer(email: string, name: string, artistId: string) {
  try {
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        artist_id: artistId,
        platform: 'music_distribution'
      }
    })

    return {
      customerId: customer.id,
      email: customer.email,
      created: customer.created
    }
  } catch (error) {
    console.error('Error creating customer:', error)
    throw error
  }
}

export async function createCheckoutSession(options: {
  priceId?: string
  customerId?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  mode?: 'payment' | 'subscription'
  lineItems?: Array<{
    price_data?: {
      currency: string
      product_data: {
        name: string
        description?: string
      }
      unit_amount: number
    }
    quantity: number
  }>
}) {
  try {
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: options.mode || 'payment',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: options.metadata || {},
    }

    if (options.customerId) {
      sessionConfig.customer = options.customerId
    }

    if (options.lineItems) {
      sessionConfig.line_items = options.lineItems
    } else if (options.priceId) {
      sessionConfig.line_items = [
        {
          price: options.priceId,
          quantity: 1,
        }
      ]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return {
      sessionId: session.id,
      url: session.url,
      paymentStatus: session.payment_status
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Revenue calculation helpers
export function calculateArtistShare(totalAmount: number, platformFeePercent: number = 15): {
  artistAmount: number
  platformFee: number
  platformFeePercent: number
} {
  const platformFee = Math.round(totalAmount * (platformFeePercent / 100))
  const artistAmount = totalAmount - platformFee

  return {
    artistAmount,
    platformFee,
    platformFeePercent
  }
}

export function calculateStreamingRoyalties(streamCount: number, revenuePerStream: number = 0.004): {
  totalRevenue: number
  streamCount: number
  revenuePerStream: number
} {
  const totalRevenue = Math.round(streamCount * revenuePerStream * 100) // Convert to cents

  return {
    totalRevenue,
    streamCount,
    revenuePerStream
  }
}
