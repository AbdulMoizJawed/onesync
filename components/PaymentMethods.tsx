'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: 'paypal' | 'bank_transfer' | 'crypto' | 'stripe' | 'wise';
  is_default: boolean;
  is_active: boolean;
  paypal_email?: string;
  account_holder_name?: string;
  bank_name?: string;
  routing_number?: string;
  account_number?: string;
  swift_code?: string;
  iban?: string;
  crypto_type?: string;
  crypto_address?: string;
  stripe_account_id?: string;
  wise_account_id?: string;
  wise_email?: string;
  country_code?: string;
  currency?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentMethodsProps {
  userId: string;
}

export default function PaymentMethods({ userId }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    method_type: 'paypal' as 'paypal' | 'bank_transfer' | 'crypto' | 'stripe' | 'wise',
    is_default: false,
    paypal_email: '',
    account_holder_name: '',
    bank_name: '',
    routing_number: '',
    account_number: '',
    swift_code: '',
    iban: '',
    crypto_type: '',
    crypto_address: '',
    stripe_account_id: '',
    wise_account_id: '',
    wise_email: '',
    country_code: '',
    currency: 'USD',
    notes: ''
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [userId]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`/api/payment-methods?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.payment_methods);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...formData
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchPaymentMethods();
        setShowAddForm(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      alert('Failed to add payment method');
    }
  };

  const resetForm = () => {
    setFormData({
      method_type: 'paypal' as 'paypal' | 'bank_transfer' | 'crypto' | 'stripe' | 'wise',
      is_default: false,
      paypal_email: '',
      account_holder_name: '',
      bank_name: '',
      routing_number: '',
      account_number: '',
      swift_code: '',
      iban: '',
      crypto_type: '',
      crypto_address: '',
      stripe_account_id: '',
      wise_account_id: '',
      wise_email: '',
      country_code: '',
      currency: 'USD',
      notes: ''
    });
  };

  const setAsDefault = async (id: string) => {
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          user_id: userId,
          is_default: true
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchPaymentMethods();
      } else {
        alert(data.error || 'Failed to set as default');
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
      alert('Failed to set as default');
    }
  };

  const deletePaymentMethod = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      const response = await fetch(`/api/payment-methods?id=${id}&user_id=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchPaymentMethods();
      } else {
        alert(data.error || 'Failed to remove payment method');
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      alert('Failed to remove payment method');
    }
  };

  const renderPaymentMethodDetails = (method: PaymentMethod) => {
    switch (method.method_type) {
      case 'paypal':
        return <span className="text-gray-600">{method.paypal_email}</span>;
      case 'bank_transfer':
        return (
          <div className="text-gray-600">
            <div>{method.bank_name}</div>
            <div>***{method.account_number?.slice(-4)}</div>
          </div>
        );
      case 'crypto':
        return (
          <div className="text-gray-600">
            <div className="font-medium">{method.crypto_type?.toUpperCase()}</div>
            <div className="font-mono text-sm">
              {method.crypto_address?.slice(0, 6)}...{method.crypto_address?.slice(-4)}
            </div>
          </div>
        );
      case 'stripe':
        return <span className="text-gray-600">Stripe Account</span>;
      case 'wise':
        return <span className="text-gray-600">{method.wise_email || method.wise_account_id}</span>;
      default:
        return null;
    }
  };

  const renderFormFields = () => {
    switch (formData.method_type) {
      case 'paypal':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PayPal Email
              </label>
              <input
                type="email"
                value={formData.paypal_email}
                onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        );
      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  value={formData.routing_number}
                  onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SWIFT Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.swift_code}
                  onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN (Optional)
                </label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );
      case 'crypto':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cryptocurrency Type
              </label>
              <select
                value={formData.crypto_type}
                onChange={(e) => setFormData({ ...formData, crypto_type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select cryptocurrency</option>
                <option value="bitcoin">Bitcoin (BTC)</option>
                <option value="ethereum">Ethereum (ETH)</option>
                <option value="usdc">USD Coin (USDC)</option>
                <option value="usdt">Tether (USDT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={formData.crypto_address}
                onChange={(e) => setFormData({ ...formData, crypto_address: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter your wallet address"
                required
              />
            </div>
          </div>
        );
      case 'wise':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wise Email
              </label>
              <input
                type="email"
                value={formData.wise_email}
                onChange={(e) => setFormData({ ...formData, wise_email: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading payment methods...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
        >
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-4 mb-8">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payment methods found. Add one to receive payouts.
          </div>
        ) : (
          paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`border rounded-lg p-4 ${
                method.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900 capitalize">
                      {method.method_type.replace('_', ' ')}
                    </span>
                    {method.is_default && (
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  {renderPaymentMethodDetails(method)}
                  {method.notes && (
                    <p className="text-sm text-gray-500 mt-2">{method.notes}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!method.is_default && (
                    <button
                      onClick={() => setAsDefault(method.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => deletePaymentMethod(method.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Payment Method Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment Method</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  value={formData.method_type}
                  onChange={(e) => setFormData({ ...formData, method_type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="wise">Wise</option>
                </select>
              </div>

              {renderFormFields()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any additional notes about this payment method"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700">
                  Set as default payment method
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium"
                >
                  Add Payment Method
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}