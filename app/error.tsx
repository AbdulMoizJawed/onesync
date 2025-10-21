"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-2xl text-white">Something went wrong!</CardTitle>
          <p className="text-gray-400 mt-2">
            An unexpected error occurred. Our team has been notified.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="p-3 bg-gray-800 rounded border border-gray-700">
              <p className="text-xs text-red-400 font-mono">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Button onClick={reset} className="w-full button-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Error ID: {error.digest}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
