"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function DebugPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [routes, setRoutes] = useState<string[]>([])
  const [routeStatus, setRouteStatus] = useState<{[key: string]: string}>({})

  const sidebarRoutes = useMemo(() => [
    "/",
    "/releases", 
    "/upload",
    "/artist-tools",
    "/analytics",
    "/industry-stats",
    "/beats",
    "/artists",
    "/mastering",
    "/sync",
    "/payments",
    "/notifications",
    "/forum",
    "/settings",
    "/support"
  ], [])

  useEffect(() => {
    setRoutes(sidebarRoutes)
  }, [sidebarRoutes])

  const testRoute = async (route: string) => {
    try {
      const response = await fetch(route, { method: 'HEAD' })
      setRouteStatus(prev => ({
        ...prev,
        [route]: response.ok ? 'OK' : `Error ${response.status}`
      }))
    } catch (error) {
      setRouteStatus(prev => ({
        ...prev,
        [route]: 'Network Error'
      }))
    }
  }

  const testAllRoutes = async () => {
    for (const route of sidebarRoutes) {
      await testRoute(route)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">Authentication Status</h3>
              <p className="text-gray-300">Loading: {loading ? 'Yes' : 'No'}</p>
              <p className="text-gray-300">User: {user ? 'Logged in' : 'Not logged in'}</p>
              {user && (
                <div className="text-sm text-gray-400 mt-2">
                  <p>User ID: {user.id}</p>
                  <p>Email: {user.email}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Supabase Status</h3>
              <p className="text-gray-300">Client: {supabase ? 'Connected' : 'Not connected'}</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Current URL</h3>
              <p className="text-gray-300">{typeof window !== 'undefined' ? window.location.href : 'Server side'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Route Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testAllRoutes} className="mb-4">
              Test All Sidebar Routes
            </Button>
            
            <div className="space-y-2">
              {routes.map(route => (
                <div key={route} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">{route}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      routeStatus[route] === 'OK' ? 'text-green-400' : 
                      routeStatus[route] ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {routeStatus[route] || 'Not tested'}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(route)}
                    >
                      Navigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push('/auth/login')} variant="outline">
              Go to Login
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Dashboard
            </Button>
            <Button onClick={() => router.push('/admin')} variant="outline">
              Go to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
