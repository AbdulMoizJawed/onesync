"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from "sonner"
import { 
  CreditCard, 
  Building, 
  DollarSign, 
  Plus,
  Trash2,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { validatePayoutMethod } from '@/lib/payment-validation'

interface PayoutMethod {
  id: string
  type: string
  details: any
  is_default: boolean
  is_active: boolean
  created_at: string
}

export default function PayoutMethodsManager() {
  const { user } = useAuth()
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    type: '',
    email: '',
    account_holder_name: '',
    account_number: '',
    routing_number: '',
    bank_name: '',
    account_id: '',
    is_default: false
  })

  useEffect(() => {
    if (user) {
      loadPayoutMethods()
    }
  }, [user])

  // Validate form data in real-time
  useEffect(() => {
    if (!formData.type) {
      setValidationErrors({})
      return
    }

    const details: Record<string, any> = {}
    switch (formData.type) {
      case 'paypal':
      case 'wise':
        details.email = formData.email
        break
      case 'bank_transfer':
        details.account_holder_name = formData.account_holder_name
        details.account_number = formData.account_number
        details.routing_number = formData.routing_number
        details.bank_name = formData.bank_name
        break
      case 'stripe':
        details.account_id = formData.account_id
        break
    }

    const validation = validatePayoutMethod(formData.type, details)
    setValidationErrors(validation.errors)
  }, [formData])

  const loadPayoutMethods = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/payout-methods?user_id=${user.id}`)
      const result = await response.json()

      if (response.ok) {
        setPayoutMethods(result.data || [])
      } else {
        console.error('Failed to load payout methods:', result.error)
        if (result.error.includes('does not exist') || result.error.includes('relation') || result.error.includes('table')) {
          toast.error('Payout system not set up. Please run the database setup first.')
          console.log('📝 Run this SQL in Supabase dashboard: create-payout-system-complete.sql')
        } else {
          toast.error('Failed to load payout methods')
        }
      }
    } catch (error) {
      console.error('Error loading payout methods:', error)
      toast.error('Failed to load payout methods')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayoutMethod = async () => {
    if (!user) return

    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    try {
      setLoading(true)

      // Prepare details based on type
      let details = {}
      switch (formData.type) {
        case 'paypal':
          details = { email: formData.email }
          break
        case 'bank_transfer':
          details = {
            account_holder_name: formData.account_holder_name,
            account_number: formData.account_number,
            routing_number: formData.routing_number,
            bank_name: formData.bank_name
          }
          break
        case 'stripe':
          details = { account_id: formData.account_id }
          break
        case 'wise':
          details = { email: formData.email }
          break
        default:
          toast.error('Please select a payout method type')
          return
      }

      const response = await fetch('/api/payout-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          type: formData.type,
          details,
          is_default: formData.is_default
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Payout method added successfully!')
        setShowAddForm(false)
        setFormData({
          type: '',
          email: '',
          account_holder_name: '',
          account_number: '',
          routing_number: '',
          bank_name: '',
          account_id: '',
          is_default: false
        })
        setValidationErrors({})
        loadPayoutMethods()
      } else {
        // Handle validation errors from server
        if (result.details && typeof result.details === 'object') {
          setValidationErrors(result.details)
          toast.error('Please fix the validation errors')
        } else {
          toast.error(result.error || 'Failed to add payout method')
        }
      }
    } catch (error) {
      console.error('Error adding payout method:', error)
      toast.error('Failed to add payout method')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayoutMethod = async (methodId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payout-methods?id=${methodId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Payout method deleted successfully!')
        loadPayoutMethods()
      } else {
        toast.error(result.error || 'Failed to delete payout method')
      }
    } catch (error) {
      console.error('Error deleting payout method:', error)
      toast.error('Failed to delete payout method')
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'paypal':
        return <DollarSign className="h-4 w-4" />
      case 'bank_transfer':
        return <Building className="h-4 w-4" />
      case 'stripe':
        return <CreditCard className="h-4 w-4" />
      case 'wise':
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'paypal':
        return 'PayPal'
      case 'bank_transfer':
        return 'Bank Transfer'
      case 'stripe':
        return 'Stripe'
      case 'wise':
        return 'Wise'
      default:
        return type
    }
  }

  if (!user) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            Please log in to manage payout methods
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Payout Methods</CardTitle>
              <CardDescription className="text-gray-400">
                Manage how you receive payments
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payoutMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No payout methods configured</p>
              <p className="text-sm">Add a payout method to receive payments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payoutMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getMethodIcon(method.type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">
                          {getMethodLabel(method.type)}
                        </span>
                        {method.is_default && (
                          <Badge className="bg-blue-600 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {method.type === 'paypal' && method.details.email}
                        {method.type === 'bank_transfer' && 
                          `${method.details.bank_name} - ${method.details.account_number}`}
                        {method.type === 'stripe' && method.details.account_id}
                        {method.type === 'wise' && method.details.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePayoutMethod(method.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showAddForm && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-white">Add Payout Method</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-gray-300">Method Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select payout method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="wise">Wise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.type === 'paypal' || formData.type === 'wise') && (
                  <div>
                    <Label className="text-gray-300">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter your email"
                    />
                  </div>
                )}

                {formData.type === 'bank_transfer' && (
                  <>
                    <div>
                      <Label className="text-gray-300">Account Holder Name</Label>
                      <Input
                        value={formData.account_holder_name}
                        onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Account Number</Label>
                      <Input
                        value={formData.account_number}
                        onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Routing Number</Label>
                      <Input
                        value={formData.routing_number}
                        onChange={(e) => setFormData({...formData, routing_number: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Bank Name</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </>
                )}

                {formData.type === 'stripe' && (
                  <div>
                    <Label className="text-gray-300">Stripe Account ID</Label>
                    <Input
                      value={formData.account_id}
                      onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="acct_xxxxxxxxxxxxxxxx"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                    className="rounded bg-gray-700 border-gray-600"
                  />
                  <Label htmlFor="is_default" className="text-gray-300">
                    Set as default payout method
                  </Label>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={handleAddPayoutMethod}
                  disabled={loading || !formData.type}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add Method
                </Button>
                <Button 
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
