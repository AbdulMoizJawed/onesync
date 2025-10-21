"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Mail } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import Image from "next/image"

import { supabase } from "@/lib/auth"

export default function ForgotPasswordPage() {

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Basic validation
    if (!email) {
      setError("Please enter your email address.")
      setLoading(false)
      return
    }

    try {
      if (!supabase || !supabase.auth) {
        throw new Error("Authentication service is not available")
      }
      
      // Check if the resetPasswordForEmail method exists
      if (typeof supabase.auth.resetPasswordForEmail !== 'function') {
        throw new Error("Password reset functionality is not available")
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        throw error
      }
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || "Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center" suppressHydrationWarning>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-white font-bold text-xl">OS</span>
          </div>
          <CustomLoader size="sm" />
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4" suppressHydrationWarning>
        <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl">
          <CardHeader className="text-center py-8 px-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">Check Your Email</CardTitle>
            <CardDescription className="text-gray-500 text-base">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Alert className="bg-green-950/50 border-green-800">
                <Mail className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  Please check your email and click the reset link to create a new password.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => router.push("/auth/login")}
                variant="outline"
                className="w-full bg-transparent border-gray-800 text-white hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4" suppressHydrationWarning>
      <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl">
        <CardHeader className="text-center py-8 px-8">
          <div className="flex justify-center mb-6">
            {/* User's logo, keep as requested */}
            <Image src="/logo.png" alt="OneSync Logo" width={80} height={80} className="rounded-2xl" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">Reset Password</CardTitle>
          <CardDescription className="text-gray-500 text-base">
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-400 font-medium text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 bg-gray-950/90 border-gray-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl px-4"
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-800">
                <AlertCircle className="h-4 w-4 text-red-200" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-800/20 transition-all duration-300 transform hover:scale-[1.02]" disabled={loading}>
              {loading ? (
                <>
                  <CustomLoader size="sm" className="mr-2" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 space-y-4 text-center">
            <Link 
              href="/auth/login" 
              className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
