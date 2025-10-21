"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error)
  }, [error])

  return (
    <html>
      <body className="bg-gray-950">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-900 border-gray-800">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-2xl text-white font-montserrat">Critical Error</CardTitle>
              <p className="text-gray-400 mt-2">
                A critical error occurred. Please try refreshing the page.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={reset} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
