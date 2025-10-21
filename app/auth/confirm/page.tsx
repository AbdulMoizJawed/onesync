"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Mail } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import Link from "next/link"

function ConfirmPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        if (!supabase) {
          setError("Authentication service unavailable")
          setLoading(false)
          return
        }

        // Check if this is a confirmation link with token
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        
        if (token && type === 'signup') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            console.error("Email confirmation error:", error)
            setError(error.message)
          } else if (data.user) {
            setConfirmed(true)
            // Redirect to dashboard after successful confirmation
            setTimeout(() => {
              router.push("/")
            }, 3000)
          }
        } else {
          // No token, just show confirmation message
          setConfirmed(true)
        }
      } catch (err: any) {
        console.error("Confirmation error:", err)
        setError("An unexpected error occurred during confirmation")
      } finally {
        setLoading(false)
      }
    }

    confirmEmail()
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CustomLoader size="lg" />
            <p className="text-gray-400 mt-4">Confirming your email...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          {confirmed ? (
            <>
              <div className="mx-auto w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle className="text-2xl text-white">Email Confirmed!</CardTitle>
              <p className="text-gray-400 mt-2">
                Your email has been successfully confirmed. You can now access all features.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
              <p className="text-gray-400 mt-2">
                We&apos;ve sent you a confirmation link. Please check your email and click the link to confirm your account.
              </p>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {confirmed ? (
            <div className="space-y-3">
              <Button asChild className="w-full button-primary">
                <Link href="/">
                  Go to Dashboard
                </Link>
              </Button>
              <p className="text-center text-sm text-gray-500">
                Redirecting automatically in 3 seconds...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                <Link href="/auth/login">
                  Back to Login
                </Link>
              </Button>
              <p className="text-center text-sm text-gray-500">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300">
                  try signing up again
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CustomLoader size="lg" />
            <p className="text-gray-400 mt-4">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmPageInner />
    </Suspense>
  )
}
