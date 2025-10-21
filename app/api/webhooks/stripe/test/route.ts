import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createStripeClient } from '@/lib/stripe-server'

export async function GET() {
  try {
    const stripe = createStripeClient()
    // Test webhook endpoint configuration
    const webhookEndpoints = await stripe.webhookEndpoints.list({ limit: 10 })
    
    return NextResponse.json({
      success: true,
      webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
      stripe_keys_configured: {
        secret_key: !!process.env.STRIPE_SECRET_KEY,
        publishable_key: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      },
      endpoints: webhookEndpoints.data.map(endpoint => ({
        id: endpoint.id,
        url: endpoint.url,
        status: endpoint.status,
        enabled_events: endpoint.enabled_events.slice(0, 10), // First 10 events
        created: new Date(endpoint.created * 1000).toISOString()
      })),
      recommended_events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'payment_intent.succeeded',
        'transfer.created',
        'payout.paid',
        'payout.failed',
        'account.updated',
        'account.application.deauthorized'
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  // Test webhook processing with a dummy event
  return NextResponse.json({
    message: 'This endpoint only accepts webhook events from Stripe',
    webhook_url: '/api/webhooks/stripe',
    test_url: '/api/webhooks/stripe/test',
    timestamp: new Date().toISOString()
  }, { status: 405 })
}
