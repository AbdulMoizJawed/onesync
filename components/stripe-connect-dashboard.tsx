'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, ExternalLink, CreditCard, DollarSign } from 'lucide-react'
import { useAuth } from '@/lib/auth'

interface StripeAccount {
  id: string
  type: string
  country: string
  default_currency: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  business_type?: string
  business_profile?: {
    name?: string
    url?: string
  }
  created: number
}

interface ConnectAccountData {
  id: string
  stripe_account_id: string
  account_status: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  created_at: string
  updated_at: string
}

export default function StripeConnectDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [connectAccount, setConnectAccount] = useState<ConnectAccountData | null>(null)
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null)

  // Fetch existing connect account on mount
  useEffect(() => {
    if (user && !authLoading) {
      fetchConnectAccount()
    }
  }, [user, authLoading])

  const fetchConnectAccount = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/account-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.connectAccount) {
          setConnectAccount(data.connectAccount)
          setStripeAccount(data.stripeAccount)
        }
      } else if (response.status !== 404) {
        const errorData = await response.json()
        console.error('Error fetching account:', errorData)
      }
    } catch (error) {
      console.error('Error fetching connect account:', error)
    } finally {
      setLoading(false)
    }
  }

  const createConnectAccount = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'express', // Can be 'express' or 'standard'
          country: 'US', // Default to US, should be configurable
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Connect account')
      }

      setSuccess('Connect account created successfully!')
      setConnectAccount(data.connectAccount)
      
      // Refresh the account data
      await fetchConnectAccount()
    } catch (error) {
      console.error('Error creating connect account:', error)
      setError(error instanceof Error ? error.message : 'Failed to create connect account')
    } finally {
      setLoading(false)
    }
  }

  const createOnboardingLink = async () => {
    if (!connectAccount) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/onboarding-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: connectAccount.stripe_account_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating onboarding link:', error)
      setError(error instanceof Error ? error.message : 'Failed to create onboarding link')
    } finally {
      setLoading(false)
    }
  }

  const getAccountStatus = () => {
    if (!connectAccount || !stripeAccount) return 'Not Created'
    
    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      return 'Active'
    } else if (stripeAccount.details_submitted) {
      return 'Under Review'
    } else {
      return 'Incomplete'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500'
      case 'Under Review':
        return 'bg-yellow-500'
      case 'Incomplete':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    )
  }

  // Show auth required message if not logged in
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect
          </CardTitle>
          <CardDescription>
            Payment processing for your music distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to manage your payment settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const accountStatus = getAccountStatus()

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect Account
          </CardTitle>
          <CardDescription>
            Manage your payment processing and payouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Account Status</p>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(accountStatus)}>
                  {accountStatus}
                </Badge>
                {connectAccount && (
                  <span className="text-xs text-muted-foreground">
                    ID: {connectAccount.stripe_account_id}
                  </span>
                )}
              </div>
            </div>

            {!connectAccount ? (
              <Button
                onClick={createConnectAccount}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            ) : accountStatus === 'Incomplete' ? (
              <Button
                onClick={createOnboardingLink}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Complete Setup
                <ExternalLink className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={createOnboardingLink}
                variant="outline"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Manage Account
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      {stripeAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Charges</p>
                <div className="flex items-center gap-2">
                  {stripeAccount.charges_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">
                    {stripeAccount.charges_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Payouts</p>
                <div className="flex items-center gap-2">
                  {stripeAccount.payouts_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">
                    {stripeAccount.payouts_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Details</p>
                <div className="flex items-center gap-2">
                  {stripeAccount.details_submitted ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">
                    {stripeAccount.details_submitted ? 'Submitted' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </div>

            {stripeAccount.business_profile?.name && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium">Business Information</p>
                <p className="text-sm text-muted-foreground">
                  {stripeAccount.business_profile.name}
                </p>
                {stripeAccount.business_profile.url && (
                  <p className="text-sm text-muted-foreground">
                    {stripeAccount.business_profile.url}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>1. Create Account:</strong> Click "Create Account" to set up your Stripe Connect account</p>
            <p><strong>2. Complete Onboarding:</strong> Provide your business and banking information</p>
            <p><strong>3. Start Processing:</strong> Once approved, you can receive payments and payouts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
