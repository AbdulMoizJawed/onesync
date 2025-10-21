"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { envConfig } from '@/lib/env-config'

interface StripeConnectDebugProps {
  className?: string
}

export function StripeConnectDebug({ className = '' }: StripeConnectDebugProps) {
  const [testResults, setTestResults] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const runConnectTests = async () => {
    setTesting(true)
    const results = {
      envConfig: false,
      createAccount: false,
      accountSession: false,
      onboardingLink: false,
      errors: [] as string[]
    }

    try {
      // Test 1: Environment configuration
      if (envConfig.stripePublishableKey && envConfig.stripeSecretKey) {
        results.envConfig = true
      } else {
        results.errors.push('Missing Stripe environment variables')
      }

      // Test 2: Create Connect account
      try {
        const createResponse = await fetch('/api/stripe/create-connect-account', {
          method: 'POST'
        })
        const createData = await createResponse.json()
        
        if (createResponse.ok && createData.success && createData.accountId) {
          results.createAccount = true
          
          // Test 3: Account session creation
          try {
            const sessionResponse = await fetch('/api/stripe/account-sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                account: createData.accountId
              })
            })
            const sessionData = await sessionResponse.json()
            
            if (sessionResponse.ok && sessionData.success && sessionData.accountSession?.client_secret) {
              results.accountSession = true
            } else {
              results.errors.push(`Account session failed: ${sessionData.error || 'Unknown error'}`)
            }
          } catch (error) {
            results.errors.push(`Account session request failed: ${error}`)
          }

          // Test 4: Onboarding link
          try {
            const linkResponse = await fetch('/api/stripe/onboarding-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'onboarding' })
            })
            const linkData = await linkResponse.json()
            
            if (linkResponse.ok && linkData.success && (linkData.url || linkData.client_secret)) {
              results.onboardingLink = true
            } else {
              results.errors.push(`Onboarding link failed: ${linkData.error || 'Unknown error'}`)
            }
          } catch (error) {
            results.errors.push(`Onboarding link request failed: ${error}`)
          }
        } else {
          results.errors.push(`Account creation failed: ${createData.error || 'Unknown error'}`)
        }
      } catch (error) {
        results.errors.push(`Account creation request failed: ${error}`)
      }

    } catch (error) {
      results.errors.push(`General error: ${error}`)
    }

    setTestResults(results)
    setTesting(false)
  }

  useEffect(() => {
    runConnectTests()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-400" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge className={success 
        ? 'bg-green-500/20 text-green-400 border-green-500/30'
        : 'bg-red-500/20 text-red-400 border-red-500/30'
      }>
        {success ? 'PASS' : 'FAIL'}
      </Badge>
    )
  }

  return (
    <Card className={`card-dark ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Stripe Connect Integration Test
          </CardTitle>
          <Button
            onClick={runConnectTests}
            disabled={testing}
            variant="outline"
            size="sm"
            className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-test
              </>
            )}
          </Button>
        </div>
        <p className="text-gray-400 text-sm">
          Validates Stripe Connect SDK setup and API integration
        </p>
      </CardHeader>
      <CardContent>
        {testing ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-gray-300">Running integration tests...</span>
            </div>
          </div>
        ) : testResults ? (
          <div className="space-y-4">
            {/* Test Results */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.envConfig)}
                  <span className="text-gray-300">Environment Configuration</span>
                </div>
                {getStatusBadge(testResults.envConfig)}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.createAccount)}
                  <span className="text-gray-300">Create Connect Account</span>
                </div>
                {getStatusBadge(testResults.createAccount)}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.accountSession)}
                  <span className="text-gray-300">Account Session Creation</span>
                </div>
                {getStatusBadge(testResults.accountSession)}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.onboardingLink)}
                  <span className="text-gray-300">Onboarding Link Generation</span>
                </div>
                {getStatusBadge(testResults.onboardingLink)}
              </div>
            </div>

            {/* Overall Status */}
            <div className="mt-6">
              {testResults.envConfig && testResults.createAccount && testResults.accountSession && testResults.onboardingLink ? (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-400">
                    ✅ All Stripe Connect integration tests passed! The "Connect Stripe" button should work correctly.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">
                    ❌ Some tests failed. Check the errors below and fix the configuration.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Errors */}
            {testResults.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-white font-medium mb-2">Errors:</h4>
                <div className="space-y-2">
                  {testResults.errors.map((error: string, index: number) => (
                    <div key={index} className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration Info */}
            <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
              <h4 className="text-white font-medium mb-2">Configuration Status:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Publishable Key:</span>
                  <span className="text-white ml-2">
                    {envConfig.stripePublishableKey ? 
                      `${envConfig.stripePublishableKey.substring(0, 12)}...` : 
                      'Not configured'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Secret Key:</span>
                  <span className="text-white ml-2">
                    {envConfig.stripeSecretKey ? 
                      `${envConfig.stripeSecretKey.substring(0, 12)}...` : 
                      'Not configured'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Click "Re-test" to run integration tests
          </div>
        )}
      </CardContent>
    </Card>
  )
}
