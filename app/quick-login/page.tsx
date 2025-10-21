"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function QuickLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!supabase) {
      setError("Authentication service not available")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage("Login successful! Redirecting...")
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError("")

    if (!supabase) {
      setError("Authentication service not available")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      setMessage("Account created! Check your email to verify.")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestLogin = async () => {
    setEmail("test@onesync.music")
    setPassword("test123456")
    setLoading(true)
    setError("")

    if (!supabase) {
      setError("Authentication service not available")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "test@onesync.music",
        password: "test123456",
      })

      if (error) {
        // If test user doesn't exist, create it
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: "test@onesync.music",
          password: "test123456",
        })
        
        if (signUpError) throw signUpError
        setMessage("Test account created! Please check email or try logging in.")
      } else {
        setMessage("Test login successful! Redirecting...")
        setTimeout(() => {
          router.push("/")
        }, 1000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-center">Quick Login</CardTitle>
          <p className="text-gray-400 text-center text-sm">
            Login to access the sidebar pages
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert>
              <AlertDescription className="text-green-400">{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Login
            </Button>
          </form>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">or</p>
            <Button 
              variant="outline" 
              onClick={handleTestLogin}
              disabled={loading}
              className="w-full mb-2"
            >
              Use Test Account
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleSignUp}
              disabled={loading}
              className="w-full"
            >
              Create New Account
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-gray-800">
            <p className="text-gray-400 text-xs">
              Once logged in, all sidebar pages will work properly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
