'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DollarSign, TrendingUp, Music, Download, Zap, CreditCard, Wallet, Plus, Building, Bitcoin } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from "sonner"
import CustomLoader from "@/components/ui/custom-loader"

interface EarningsData {
  available_balance: number
  lifetime_earnings: number
  total_streams: number
  earning_tracks: number
}

interface PayoutMethod {
  id: string
  method_type: string
  is_primary: boolean
  paypal_email?: string
  account_holder_name?: string
  bank_name?: string
  crypto_currency?: string
  wallet_address?: string
  created_at: string
}

interface PayoutRequest {
  id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
  processed_at?: string
  failure_reason?: string
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([])
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMethod, setShowAddMethod] = useState(false)
  const [requestingPayout, setRequestingPayout] = useState(false)

  // New payout method form
  const [newMethod, setNewMethod] = useState({
    method_type: '',
    paypal_email: '',
    account_holder_name: '',
    account_number: '',
    routing_number: '',
    bank_name: '',
    crypto_currency: '',
    wallet_address: '',
    is_primary: false
  })

  const fetchData = useCallback(async () => {
    if (!user || !supabase) return
    
    try {
      // Fetch real earnings data from earnings table
      const { data: earningsData, error: earningsError } = await supabase
        .from("earnings")
        .select("*")
        .eq("user_id", user.id)

      if (!earningsError && earningsData?.length > 0) {
        // Calculate totals from real data
        const totalEarnings = earningsData.reduce((sum, earning) => sum + earning.amount, 0)
        const availableBalance = earningsData
          .filter(earning => earning.status === 'available')
          .reduce((sum, earning) => sum + earning.amount, 0)
        
        // Get unique tracks that have earnings
        const earningTrackIds = [...new Set(earningsData.map(e => e.release_id))]
        
        // Get total streams from releases
        const { data: releasesData } = await supabase
          .from("releases")
          .select("streams_total")
          .eq("user_id", user.id)
        
        const totalStreams = releasesData?.reduce((sum, release) => sum + (release.streams_total || 0), 0) || 0

        setEarnings({
          available_balance: availableBalance,
          lifetime_earnings: totalEarnings,
          total_streams: totalStreams,
          earning_tracks: earningTrackIds.length
        })
      } else {
        // No earnings data yet
        setEarnings({
          available_balance: 0,
          lifetime_earnings: 0,
          total_streams: 0,
          earning_tracks: 0
        })
      }

      // Fetch payout methods
      const { data: methodsData, error: methodsError } = await supabase
        .from("payout_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!methodsError && methodsData) {
        setPayoutMethods(methodsData)
      }

      // Fetch payout requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!requestsError && requestsData) {
        setPayoutRequests(requestsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Failed to load payment data")
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const addPayoutMethod = async () => {
    if (!user || !supabase) return
    
    try {
      const { error } = await supabase
        .from("payout_methods")
        .insert({
          user_id: user.id,
          ...newMethod
        })

      if (error) throw error

      toast.success("Payout method added successfully")
      setShowAddMethod(false)
      setNewMethod({
        method_type: '',
        paypal_email: '',
        account_holder_name: '',
        account_number: '',
        routing_number: '',
        bank_name: '',
        crypto_currency: '',
        wallet_address: '',
        is_primary: false
      })
      fetchData()
    } catch (error: any) {
      console.error('Error adding payout method:', error)
      toast.error(error.message || "Failed to add payout method")
    }
  }

  const requestPayout = async () => {
    if (!user || !supabase || !earnings) return
    
    const primaryMethod = payoutMethods.find(m => m.is_primary)
    if (!primaryMethod) {
      toast.error("Please set a primary payout method first")
      return
    }

    setRequestingPayout(true)
    try {
      const { error } = await supabase
        .from("payout_requests")
        .insert({
          user_id: user.id,
          payout_method_id: primaryMethod.id,
          amount: earnings.available_balance,
          status: 'pending'
        })

      if (error) throw error

      toast.success("Payout request submitted successfully!")
      fetchData() // Refresh data
    } catch (error: any) {
      console.error('Error requesting payout:', error)
      toast.error(error.message || "Failed to request payout")
    } finally {
      setRequestingPayout(false)
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'paypal': return <Wallet className="h-4 w-4" />
      case 'bank_transfer': return <Building className="h-4 w-4" />
      case 'crypto': return <Bitcoin className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'warning', text: 'Pending' },
      processing: { variant: 'default', text: 'Processing' },
      completed: { variant: 'success', text: 'Completed' },
      failed: { variant: 'destructive', text: 'Failed' }
    }
    const config = variants[status] || variants.pending
    return <Badge className={config.variant}>{config.text}</Badge>
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <CustomLoader size="lg" showText text="Loading payments..." />
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
            <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto">
              {/* Page Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 font-montserrat">Payment Center</h1>
                <p className="text-gray-400 font-inter">Manage your earnings, payouts, and payment methods</p>
              </div>

              {/* Earnings Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="card-dark">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Available Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(earnings?.available_balance || 0)}</div>
                    <p className="text-xs text-gray-500">Ready for payout</p>
                  </CardContent>
                </Card>

                <Card className="card-dark">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Lifetime Earnings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(earnings?.lifetime_earnings || 0)}</div>
                    <p className="text-xs text-gray-500">All time total</p>
                  </CardContent>
                </Card>

                <Card className="card-dark">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Streams</CardTitle>
                    <Music className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{earnings?.total_streams?.toLocaleString() || 0}</div>
                    <p className="text-xs text-gray-500">Across all platforms</p>
                  </CardContent>
                </Card>

                <Card className="card-dark">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Earning Tracks</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{earnings?.earning_tracks || 0}</div>
                    <p className="text-xs text-gray-500">Tracks with earnings</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payout Section */}
                <Card className="card-dark">
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle className="text-white font-montserrat">Request Payout</CardTitle>
                    <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Method
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-800">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add Payout Method</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-gray-300">Method Type</Label>
                            <Select value={newMethod.method_type} onValueChange={(value) => setNewMethod({...newMethod, method_type: value})}>
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                <SelectValue placeholder="Select method type" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="paypal">PayPal</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="crypto">Cryptocurrency</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {newMethod.method_type === 'paypal' && (
                            <div>
                              <Label className="text-gray-300">PayPal Email</Label>
                              <Input
                                type="email"
                                value={newMethod.paypal_email}
                                onChange={(e) => setNewMethod({...newMethod, paypal_email: e.target.value})}
                                className="bg-gray-800 border-gray-700 text-white"
                                placeholder="your@email.com"
                              />
                            </div>
                          )}

                          {newMethod.method_type === 'bank_transfer' && (
                            <>
                              <div>
                                <Label className="text-gray-300">Account Holder Name</Label>
                                <Input
                                  value={newMethod.account_holder_name}
                                  onChange={(e) => setNewMethod({...newMethod, account_holder_name: e.target.value})}
                                  className="bg-gray-800 border-gray-700 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-300">Bank Name</Label>
                                <Input
                                  value={newMethod.bank_name}
                                  onChange={(e) => setNewMethod({...newMethod, bank_name: e.target.value})}
                                  className="bg-gray-800 border-gray-700 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-300">Account Number</Label>
                                <Input
                                  value={newMethod.account_number}
                                  onChange={(e) => setNewMethod({...newMethod, account_number: e.target.value})}
                                  className="bg-gray-800 border-gray-700 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-300">Routing Number</Label>
                                <Input
                                  value={newMethod.routing_number}
                                  onChange={(e) => setNewMethod({...newMethod, routing_number: e.target.value})}
                                  className="bg-gray-800 border-gray-700 text-white"
                                />
                              </div>
                            </>
                          )}

                          {newMethod.method_type === 'crypto' && (
                            <>
                              <div>
                                <Label className="text-gray-300">Cryptocurrency</Label>
                                <Select value={newMethod.crypto_currency} onValueChange={(value) => setNewMethod({...newMethod, crypto_currency: value})}>
                                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                    <SelectValue placeholder="Select cryptocurrency" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700">
                                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-gray-300">Wallet Address</Label>
                                <Input
                                  value={newMethod.wallet_address}
                                  onChange={(e) => setNewMethod({...newMethod, wallet_address: e.target.value})}
                                  className="bg-gray-800 border-gray-700 text-white"
                                  placeholder="Wallet address"
                                />
                              </div>
                            </>
                          )}

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="is_primary"
                              checked={newMethod.is_primary}
                              onChange={(e) => setNewMethod({...newMethod, is_primary: e.target.checked})}
                              className="rounded"
                            />
                            <Label htmlFor="is_primary" className="text-gray-300">Set as primary method</Label>
                          </div>

                          <Button onClick={addPayoutMethod} className="w-full">
                            Add Payout Method
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Available for payout</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(earnings?.available_balance || 0)}</p>
                      </div>
                      <Button 
                        onClick={requestPayout}
                        disabled={!earnings?.available_balance || earnings.available_balance < 10 || requestingPayout || payoutMethods.length === 0}
                        className="ml-4"
                      >
                        {requestingPayout ? 'Processing...' : 'Request Payout'}
                      </Button>
                    </div>

                    {earnings?.available_balance && earnings.available_balance < 10 && (
                      <p className="text-sm text-yellow-600">Minimum payout amount is $10.00</p>
                    )}

                    {payoutMethods.length === 0 && (
                      <p className="text-sm text-red-400">Please add a payout method first</p>
                    )}

                    {/* Payout Methods */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-300">Payout Methods</p>
                      {payoutMethods.map((method) => (
                        <div key={method.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                          {getMethodIcon(method.method_type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white capitalize">{method.method_type.replace('_', ' ')}</span>
                              {method.is_primary && (
                                <Badge variant="default" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {method.method_type === 'paypal' && method.paypal_email}
                              {method.method_type === 'bank_transfer' && `${method.bank_name} - ${method.account_holder_name}`}
                              {method.method_type === 'crypto' && `${method.crypto_currency} - ${method.wallet_address}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Payout History */}
                <Card className="card-dark">
                  <CardHeader>
                    <CardTitle className="text-white font-montserrat">Payout History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payoutRequests.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No payout requests yet</p>
                      ) : (
                        payoutRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{formatCurrency(request.amount)}</span>
                                {getStatusBadge(request.status)}
                              </div>
                              <p className="text-xs text-gray-400">
                                {formatDate(request.created_at)} • {request.payment_method}
                              </p>
                              {request.failure_reason && (
                                <p className="text-xs text-red-400">{request.failure_reason}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
