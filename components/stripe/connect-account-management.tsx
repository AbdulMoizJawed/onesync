"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CreditCard, 
  DollarSign, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Settings,
  History,
  Wallet,
  Banknote
} from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"

interface StripeAccount {
  accountId: string
  status: 'charges_enabled' | 'incomplete' | 'pending'
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  chargesEnabled: boolean
  onboardingCompleted: boolean
}

interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  arrival_date: number
  description?: string
}

export function ConnectAccountManagement() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [account, setAccount] = useState<StripeAccount | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Payout form state
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutLoading, setPayoutLoading] = useState(false)
  
  // Settings state
  const [payoutSettings, setPayoutSettings] = useState({
    interval: 'weekly',
    weeklyAnchor: 'friday',
    monthlyAnchor: 15
  })
  const [settingsLoading, setSettingsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkExistingAccount()
    }
  }, [user])

  const checkExistingAccount = async () => {
    try {
      setInitialLoading(true)
      
      const response = await fetch('/api/stripe/account-status')
      const data = await response.json()
      
      if (response.ok && data.success && data.account) {
        setAccount(data.account)
        
        // If account exists and payouts are enabled, fetch payout history
        if (data.account.payoutsEnabled) {
          await fetchPayouts(data.account.accountId)
        }
      }
    } catch (err) {
      console.error('Error checking existing account:', err)
      setError('Failed to load account information')
    } finally {
      setInitialLoading(false)
    }
  }

  const createConnectAccount = async () => {
    if (!user) return
    
    setLoading(true)
    setError("")
    
    try {
      // First create the account
      const createResponse = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const createData = await createResponse.json()
      
      if (!createResponse.ok) {
        throw new Error(createData.error || 'Failed to create account')
      }
      
      // Then get the onboarding link
      const linkResponse = await fetch('/api/stripe/onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'onboarding' })
      })
      
      const linkData = await linkResponse.json()
      
      if (!linkResponse.ok) {
        throw new Error(linkData.error || 'Failed to generate onboarding link')
      }
      
      // Store account info
      setAccount({
        accountId: createData.accountId,
        status: 'incomplete',
        payoutsEnabled: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        onboardingCompleted: false
      })
      
      // Redirect to Stripe's hosted onboarding
      if (linkData.url) {
        window.location.href = linkData.url
      }
    } catch (err: any) {
      console.error('Error creating account:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const continueOnboarding = async () => {
    if (!account) return
    
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/stripe/onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'onboarding' })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate onboarding link')
      }
      
      // Redirect to Stripe's hosted onboarding
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error('Error generating onboarding link:', err)
      setError(err.message || 'Failed to continue onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const accessDashboard = async () => {
    if (!account) return
    
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/stripe/dashboard-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.accountId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to access dashboard')
      }
      
      // Open dashboard in new tab
      window.open(data.url, '_blank')
    } catch (err: any) {
      console.error('Error accessing dashboard:', err)
      setError(err.message || 'Failed to access dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayouts = async (accountId: string) => {
    try {
      const response = await fetch(`/api/stripe/payout-history?accountId=${accountId}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        setPayouts(data.payouts || [])
      }
    } catch (err) {
      console.error('Error fetching payouts:', err)
    }
  }

  const createPayout = async () => {
    if (!account || !payoutAmount) return
    
    const amount = parseFloat(payoutAmount) * 100 // Convert to cents
    
    if (amount < 100) {
      setError('Minimum payout amount is $1.00')
      return
    }
    
    setPayoutLoading(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch('/api/stripe/create-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.accountId,
          amount: amount,
          currency: 'usd'
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payout')
      }
      
      setSuccess(`Payout of $${payoutAmount} initiated successfully!`)
      setPayoutAmount("")
      
      // Refresh payout history
      await fetchPayouts(account.accountId)
    } catch (err: any) {
      console.error('Error creating payout:', err)
      setError(err.message || 'Failed to create payout. Please try again.')
    } finally {
      setPayoutLoading(false)
    }
  }

  const updatePayoutSettings = async () => {
    if (!account) return
    
    setSettingsLoading(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch('/api/stripe/update-payout-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.accountId,
          interval: payoutSettings.interval,
          weeklyAnchor: payoutSettings.weeklyAnchor,
          monthlyAnchor: payoutSettings.monthlyAnchor
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }
      
      setSuccess('Payout settings updated successfully!')
    } catch (err: any) {
      console.error('Error updating settings:', err)
      setError(err.message || 'Failed to update settings. Please try again.')
    } finally {
      setSettingsLoading(false)
    }
  }

  const renderAccountStatus = () => {
    if (!account) return null

    const getStatusInfo = () => {
      if (account.payoutsEnabled && account.chargesEnabled) {
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          status: "Active",
          description: "Your account is ready to receive payouts",
          color: "text-green-500"
        }
      } else if (account.detailsSubmitted) {
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          status: "Under Review",
          description: "Your account is being verified by Stripe",
          color: "text-yellow-500"
        }
      } else {
        return {
          icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
          status: "Setup Required",
          description: "Please complete your account setup",
          color: "text-orange-500"
        }
      }
    }

    const statusInfo = getStatusInfo()

    return (
      <div className="flex items-center gap-3">
        {statusInfo.icon}
        <div>
          <span className={`font-medium ${statusInfo.color}`}>{statusInfo.status}</span>
          <p className="text-sm text-gray-400">{statusInfo.description}</p>
        </div>
      </div>
    )
  }

  const renderPayouts = () => {
    if (payouts.length === 0) {
      return (
        <div className="text-center py-6">
          <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No payouts found</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {payouts.map((payout) => (
          <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium text-white">
                ${(payout.amount / 100).toFixed(2)} {payout.currency.toUpperCase()}
              </p>
              <p className="text-sm text-gray-400">
                {new Date(payout.created * 1000).toLocaleDateString()}
              </p>
            </div>
            <Badge 
              variant={payout.status === 'paid' ? 'default' : 'secondary'}
              className={
                payout.status === 'paid' ? 'bg-green-600' : 
                payout.status === 'pending' ? 'bg-yellow-600' : 
                'bg-red-600'
              }
            >
              {payout.status}
            </Badge>
          </div>
        ))}
      </div>
    )
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CustomLoader size="lg" showText text="Loading account..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Payout Management</h1>
        <p className="text-gray-400">
          Set up your payout account to receive royalty payments directly to your bank account.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-950/50 border-green-800">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      {!account ? (
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Set Up Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              Connect your bank account to receive royalty payments from your music releases.
              This process is powered by Stripe and is completely secure.
            </p>
            <Button 
              onClick={createConnectAccount}
              disabled={loading}
              className="button-primary w-full"
            >
              {loading ? (
                <>
                  <CustomLoader size="sm" className="mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Set Up Payouts
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Status */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderAccountStatus()}
              
              <div className="border-t border-gray-700 my-4"></div>
              
              <div className="space-y-3">
                {!account.detailsSubmitted ? (
                  <Button 
                    onClick={continueOnboarding}
                    disabled={loading}
                    className="button-primary w-full"
                  >
                    {loading ? 'Loading...' : 'Complete Account Setup'}
                  </Button>
                ) : (
                  <Button 
                    onClick={accessDashboard}
                    disabled={loading}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300"
                  >
                    {loading ? 'Loading...' : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Bank Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Payout */}
          {account.payoutsEnabled && (
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Manual Payout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-white">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="10.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="input-dark"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum $1.00</p>
                </div>
                
                <Button 
                  onClick={createPayout}
                  disabled={payoutLoading || !payoutAmount}
                  className="button-primary w-full"
                >
                  {payoutLoading ? (
                    <>
                      <CustomLoader size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Banknote className="w-4 h-4 mr-2" />
                      Create Payout
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payout Settings */}
          {account.payoutsEnabled && (
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Payout Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Frequency</Label>
                  <Select 
                    value={payoutSettings.interval}
                    onValueChange={(value) => setPayoutSettings(prev => ({ ...prev, interval: value }))}
                  >
                    <SelectTrigger className="input-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payoutSettings.interval === 'weekly' && (
                  <div>
                    <Label className="text-white">Weekly Anchor</Label>
                    <Select 
                      value={payoutSettings.weeklyAnchor}
                      onValueChange={(value) => setPayoutSettings(prev => ({ ...prev, weeklyAnchor: value }))}
                    >
                      <SelectTrigger className="input-dark">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {payoutSettings.interval === 'monthly' && (
                  <div>
                    <Label className="text-white">Monthly Anchor Day</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={payoutSettings.monthlyAnchor}
                      onChange={(e) => setPayoutSettings(prev => ({ 
                        ...prev, 
                        monthlyAnchor: parseInt(e.target.value) || 1 
                      }))}
                      className="input-dark"
                    />
                    <p className="text-xs text-gray-500 mt-1">Day of month (1-31)</p>
                  </div>
                )}

                <Button 
                  onClick={updatePayoutSettings}
                  disabled={settingsLoading}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300"
                >
                  {settingsLoading ? 'Updating...' : 'Update Schedule'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payout History */}
          {account.payoutsEnabled && (
            <Card className="card-dark lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderPayouts()}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
