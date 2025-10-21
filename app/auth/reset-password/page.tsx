"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Lock } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import Image from "next/image"
import { supabase } from "@/lib/auth"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      if (!supabase || !supabase.auth) {
        throw new Error("Authentication service is not available")
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      toast.success("Password updated successfully!")
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)

    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "Failed to reset password. Please try again.")
      toast.error("Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center">
        <CustomLoader size="lg" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl">
          <CardHeader className="text-center py-8 px-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">Password Reset!</CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Your password has been successfully updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Alert className="bg-green-950/50 border-green-800 mb-4">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                Redirecting to login page...
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl">
        <CardHeader className="text-center py-8 px-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="OneSync Logo" width={80} height={80} className="rounded-2xl" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">Create New Password</CardTitle>
          <CardDescription className="text-gray-400 text-base">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-400 font-medium text-sm">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="h-12 bg-gray-950/90 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl px-4"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-400 font-medium text-sm">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="h-12 bg-gray-950/90 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl px-4"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-800">
                <AlertCircle className="h-4 w-4 text-red-200" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-800/20 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <CustomLoader size="sm" className="mr-2" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
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

