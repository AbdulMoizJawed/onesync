"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"

interface ApiStatus {
  endpoint: string
  status: 'healthy' | 'error' | 'checking'
  message: string
  responseTime?: number
  lastChecked?: string
}

export default function SpotOnTrackVerifier() {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    {
      endpoint: '/api/status',
      status: 'checking',
      message: 'Checking API endpoint...'
    },
    {
      endpoint: '/api/search',
      status: 'checking', 
      message: 'Checking API endpoint...'
    },
    {
      endpoint: '/api/artist/tracks',
      status: 'checking',
      message: 'Checking API endpoint...'
    }
  ])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifyAllEndpoints()
  }, [])

  const verifyAllEndpoints = async () => {
    setLoading(true)
    
    const endpoints = [
      '/api/status',
      '/api/search?q=test',
      '/api/artist/tracks?artist=test'
    ]

    const updatedStatuses: ApiStatus[] = []

    for (const endpoint of endpoints) {
      const startTime = Date.now()
      try {
        const response = await fetch(endpoint)
        const responseTime = Date.now() - startTime
        
        if (response.ok) {
          updatedStatuses.push({
            endpoint,
            status: 'healthy',
            message: 'API endpoint is working correctly',
            responseTime,
            lastChecked: new Date().toLocaleTimeString()
          })
        } else {
          const errorText = await response.text()
          updatedStatuses.push({
            endpoint,
            status: 'error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            responseTime,
            lastChecked: new Date().toLocaleTimeString()
          })
        }
      } catch (error) {
        updatedStatuses.push({
          endpoint,
          status: 'error',
          message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastChecked: new Date().toLocaleTimeString()
        })
      }
    }

    setApiStatuses(updatedStatuses)
    setLoading(false)
  }

  const getStatusIcon = (status: 'healthy' | 'error' | 'checking') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'checking':
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: 'healthy' | 'error' | 'checking') => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-900/30 text-green-400 border-green-700">Healthy</Badge>
      case 'error':
        return <Badge className="bg-red-900/30 text-red-400 border-red-700">Error</Badge>
      case 'checking':
        return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-700">Checking</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="card-dark border-gray-800">
        <CardContent className="p-8 text-center">
          <CustomLoader size="lg" showText text="Verifying SpotOnTrack API endpoints..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="card-dark border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-400" />
            SpotOnTrack API Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Overall Status</span>
            <div className="flex items-center gap-2">
              {apiStatuses.every(s => s.status === 'healthy') ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400">All systems operational</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400">Some issues detected</span>
                </>
              )}
            </div>
          </div>
          
          <Button 
            onClick={verifyAllEndpoints}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Re-check All Endpoints
          </Button>
        </CardContent>
      </Card>

      {apiStatuses.map((status, index) => (
        <Card key={index} className="card-dark border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(status.status)}
                <div>
                  <h3 className="text-white font-medium">{status.endpoint}</h3>
                  <p className="text-gray-400 text-sm">{status.message}</p>
                </div>
              </div>
              {getStatusBadge(status.status)}
            </div>

            {status.responseTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Response Time:</span>
                <span className="text-white">{status.responseTime}ms</span>
              </div>
            )}

            {status.lastChecked && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-400">Last Checked:</span>
                <span className="text-white">{status.lastChecked}</span>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(status.endpoint, '_blank')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Test Endpoint
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="card-dark border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-white font-medium">Available Endpoints:</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><code className="bg-gray-800 px-2 py-1 rounded">/api/status</code> - Check API status</li>
              <li><code className="bg-gray-800 px-2 py-1 rounded">/api/search</code> - Search for music</li>
              <li><code className="bg-gray-800 px-2 py-1 rounded">/api/artist/tracks</code> - Get artist tracks</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
