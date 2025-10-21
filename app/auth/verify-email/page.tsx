"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth"

export default function VerifyEmailPage() {
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState("")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in (email was confirmed), redirect to dashboard
    if (user) {
      router.push("/")
    }
  }, [user, router])

  const handleResendEmail = async () => {
    setResendLoading(true)
    setResendError("")
    setResendSuccess(false)

    try {
      // Note: Supabase doesn't have a direct resend email confirmation method
      // Users would need to sign up again or we'd need to implement a custom solution
      setResendError("To resend the confirmation email, please try signing up again with the same email address.")
    } catch (error) {
      setResendError("Failed to resend email. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl">
          <CardHeader className="space-y-4 pb-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="OneSync Logo"
                width={180}
                height={60}
                className="rounded-lg"
              />
            </div>
            
            <div className="text-center space-y-4">
              {/* Email Icon */}
              <div className="mx-auto w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">
                  Check Your Email
                </CardTitle>
                <p className="text-gray-400 text-base leading-relaxed">
                  We've sent a confirmation link to your email address. 
                  Please click the link in the email to verify your account and complete the signup process.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Alert */}
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Account created successfully! Confirmation email sent.
              </AlertDescription>
            </Alert>

            {/* Resend Email Section */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Didn't receive the email? Check your spam folder or click below to get help.
                </p>
                
                {resendSuccess && (
                  <Alert className="border-green-500 bg-green-500/10 mb-4">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                      Instructions sent! Please check your email.
                    </AlertDescription>
                  </Alert>
                )}

                {resendError && (
                  <Alert variant="destructive" className="bg-red-950/50 border-red-800 mb-4">
                    <AlertDescription className="text-red-200">
                      {resendError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 mb-4"
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Getting Help...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Didn't Receive Email?
                    </>
                  )}
                </Button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl"
                >
                  <Link href="/auth/login">
                    Back to Login
                  </Link>
                </Button>
                
                <Button
                  asChild
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl"
                >
                  <Link href="/auth/signup">
                    Try Signing Up Again
                  </Link>
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-950/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-white">Next Steps:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Check your email inbox and spam folder</li>
                <li>• Click the confirmation link in the email</li>
                <li>• You'll be redirected back to sign in</li>
                <li>• If you don't see the email, try signing up again</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}