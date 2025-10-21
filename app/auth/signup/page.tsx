"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { useAuth } from "@/lib/auth"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const { signUp, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const redirected = useRef(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    
    if (user && !authLoading && !redirected.current) {
      redirected.current = true
      router.push("/")
    }
  }, [user, authLoading, router, isMounted])

  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center" suppressHydrationWarning>
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/logo.png"
            alt="OneSync Logo"
            width={120}
            height={40}
            className="rounded-lg"
          />
          <CustomLoader size="sm" />
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email || !password || !confirmPassword || !fullName) {
      setError("Please fill in all fields.")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    try {
      const result = await signUp(email, password, {
        full_name: fullName
      })
      
      if (result.error) {
        setError(result.error)
      } else {
        // For now, always redirect to verify email since Supabase requires email confirmation
        // The auth callback will handle redirecting to dashboard after verification
        router.push("/auth/verify-email")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-8">
      {/* Signup Form */}
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
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-white text-center">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-500 text-center text-lg">
                Start your music distribution journey
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-400 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-gray-950/90 border-gray-700 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-400 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-gray-950/90 border-gray-700 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-400 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 bg-gray-950/90 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-white hover:bg-slate-700 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-400 font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 bg-gray-950/90 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-white hover:bg-slate-700 rounded-lg"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-b from-gray-300 to-gray-500 text-gray-950 hover:from-gray-400 hover:to-gray-600 font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-950" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-800 px-4 text-gray-500">Already have an account?</span>
                </div>
              </div>
              
              <Button
                asChild
                variant="outline"
                className="w-full h-12 border-gray-700 text-gray-400 hover:bg-slate-700 hover:text-white rounded-xl transition-all duration-300"
              >
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Text */}
        <p className="text-center text-sm text-slate-500">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-gray-400 hover:text-white">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-gray-400 hover:text-white">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}