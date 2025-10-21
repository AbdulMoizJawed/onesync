"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { AlertCircle } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          router.push('/auth/login?error=client_not_initialized')
          return
        }
        
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          setError("An unexpected error occurred")
          setLoading(false)
          return
        }

        if (data.session) {
          console.log("Auth callback successful, redirecting to dashboard")
          setSuccess(true)
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          console.log("No session found, redirecting to login")
          setError("Missing authentication tokens")
          setLoading(false)
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Card className="w-full max-w-md card-dark">
          <CardContent className="flex flex-col items-center justify-center py-8 text-gray-400">
            <CustomLoader size="lg" className="mb-4" />
            <p className="text-center text-gray-400">Completing sign in...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <Card className="w-full max-w-md card-dark">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Confirmation Failed</CardTitle>
            <CardDescription className="text-gray-400">There was an issue confirming your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="glass border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-gray-300">{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardContent className="pt-0">
            <Button onClick={() => router.push("/auth/login")} className="w-full button-primary">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <Card className="w-full max-w-md card-dark">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="OneSync Logo" width={80} height={80} className="rounded-lg" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Account Confirmed!</CardTitle>
            <CardDescription className="text-gray-400">
              Your email has been confirmed successfully. Redirecting you now...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full button-primary">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
