'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { ArrowLeft, CreditCard, Wallet, Building } from 'lucide-react'
import { toast } from "sonner"
import Link from 'next/link'

export default function AddPayoutMethodPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [newMethod, setNewMethod] = useState({
    method_type: '',
    paypal_email: '',
    account_holder_name: '',
    account_number: '',
    routing_number: '',
    bank_name: '',
    is_primary: false
  })

  const addPayoutMethod = async () => {
    if (!user) return
    
    // Validation
    if (!newMethod.method_type) {
      toast.error("Please select a payout method type")
      return
    }

    if (newMethod.method_type === 'paypal' && !newMethod.paypal_email) {
      toast.error("Please enter your PayPal email")
      return
    }

    if (newMethod.method_type === 'bank_transfer') {
      if (!newMethod.account_holder_name || !newMethod.bank_name || !newMethod.account_number || !newMethod.routing_number) {
        toast.error("Please fill in all bank transfer fields")
        return
      }
      
      // Validate routing number format
      if (newMethod.routing_number.length !== 9 || !/^\d{9}$/.test(newMethod.routing_number)) {
        toast.error("Routing number must be exactly 9 digits")
        return
      }
    }


    setLoading(true)
    try {
      const response = await fetch('/api/payouts/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMethod)
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle database table missing error
        if (data.error?.includes('does not exist') || data.error?.includes('relation') || data.error?.includes('table')) {
          toast.error('Payout system not set up. Please contact admin to run database setup.')
          console.log('📝 Admin: Run create-payout-system-complete.sql in Supabase dashboard')
          return
        }
        throw new Error(data.error || 'Failed to add payout method')
      }

      toast.success("Payout method added successfully")
      router.push('/payouts')
    } catch (error: any) {
      console.error('Error adding payout method:', error)
      toast.error(error.message || "Failed to add payout method")
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'paypal': return <Wallet className="h-5 w-5" />
      case 'bank_transfer': return <Building className="h-5 w-5" />
      default: return <CreditCard className="h-5 w-5" />
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <Link href="/payouts">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Payouts
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Add Payout Method</h1>
                  <p className="text-gray-400">Set up a new way to receive your earnings</p>
                </div>
              </div>

              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-white">Payout Method Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-gray-300 mb-3 block">Method Type</Label>
                    <Select value={newMethod.method_type} onValueChange={(value) => setNewMethod({...newMethod, method_type: value})}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select payout method type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="paypal">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            PayPal
                          </div>
                        </SelectItem>
                        <SelectItem value="bank_transfer">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Bank Transfer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newMethod.method_type && (
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        {getMethodIcon(newMethod.method_type)}
                        <h3 className="text-white font-medium capitalize">
                          {newMethod.method_type.replace('_', ' ')} Details
                        </h3>
                      </div>

                      {newMethod.method_type === 'paypal' && (
                        <div>
                          <Label className="text-gray-300 mb-2 block">PayPal Email Address</Label>
                          <Input
                            type="email"
                            value={newMethod.paypal_email}
                            onChange={(e) => setNewMethod({...newMethod, paypal_email: e.target.value})}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="your@email.com"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Make sure this email is associated with your PayPal account
                          </p>
                        </div>
                      )}

                      {newMethod.method_type === 'bank_transfer' && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-gray-300 mb-2 block">Account Holder Name</Label>
                            <Input
                              value={newMethod.account_holder_name}
                              onChange={(e) => setNewMethod({...newMethod, account_holder_name: e.target.value})}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="Full name on bank account"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300 mb-2 block">Bank Name</Label>
                            <Input
                              value={newMethod.bank_name}
                              onChange={(e) => setNewMethod({...newMethod, bank_name: e.target.value})}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="Bank of America, Chase, etc."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-300 mb-2 block">Account Number</Label>
                              <Input
                                value={newMethod.account_number}
                                onChange={(e) => setNewMethod({...newMethod, account_number: e.target.value})}
                                className="bg-gray-800 border-gray-700 text-white"
                                placeholder="Account number"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-300 mb-2 block">Routing Number</Label>
                              <Input
                                value={newMethod.routing_number}
                                onChange={(e) => setNewMethod({...newMethod, routing_number: e.target.value})}
                                className="bg-gray-800 border-gray-700 text-white"
                                placeholder="9-digit routing number"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {newMethod.method_type && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_primary"
                        checked={newMethod.is_primary}
                        onChange={(e) => setNewMethod({...newMethod, is_primary: e.target.checked})}
                        className="rounded bg-gray-800 border-gray-700"
                      />
                      <Label htmlFor="is_primary" className="text-gray-300">
                        Set as primary payout method
                      </Label>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Link href="/payouts" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Cancel
                      </Button>
                    </Link>
                    <Button 
                      onClick={addPayoutMethod} 
                      disabled={loading || !newMethod.method_type}
                      className="flex-1"
                    >
                      {loading ? 'Adding...' : 'Add Payout Method'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
