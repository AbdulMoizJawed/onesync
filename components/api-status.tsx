"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Settings, ExternalLink } from "lucide-react"
import { getApiStatus } from "@/lib/env-config"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ApiStatus() {
  const [status, setStatus] = useState(getApiStatus())

  useEffect(() => {
    setStatus(getApiStatus())
  }, [])

  const getStatusIcon = (isConnected: boolean, isOptional: boolean = false) => {
    if (isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-400" />
    } else if (isOptional) {
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />
    } else {
      return <XCircle className="w-4 h-4 text-red-400" />
    }
  }

  const getStatusBadge = (isConnected: boolean, isOptional: boolean = false) => {
    if (isConnected) {
      return <Badge className="bg-green-600 text-white">Connected</Badge>
    } else if (isOptional) {
      return <Badge className="bg-yellow-600 text-white">Optional</Badge>
    } else {
      return <Badge className="bg-red-600 text-white">Not Configured</Badge>
    }
  }

  const apiServices = [
    {
      name: "Supabase Database",
      description: "Core database and authentication",
      connected: status.supabase,
      required: true,
      setupUrl: "https://supabase.com"
    },
    {
      name: "Stripe Payments",
      description: "Payment processing and payouts",
      connected: status.stripe,
      required: true,
      setupUrl: "https://stripe.com"
    },
    {
      name: "Spotify API",
      description: "Artist search and metadata",
      connected: status.spotify,
      required: false,
      setupUrl: "https://developer.spotify.com"
    },
    {
      name: "Apple Music API",
      description: "Music credits and industry data",
      connected: status.appleMusicApi,
      required: false,
      setupUrl: "https://developer.apple.com/music/"
    },
    {
      name: "RoEx Audio",
      description: "AI-powered mastering services",
      connected: false, // RoEx API not configured
      required: false,
      setupUrl: "https://roexaudio.com"
    },
    {
      name: "SpotonTrack",
      description: "Industry statistics and analytics",
      connected: status.spotontrack,
      required: false,
      setupUrl: "https://spotontrack.com"
    },
    {
      name: "Apple Music API",
      description: "Apple Music integration",
      connected: status.appleMusicApi,
      required: false,
      setupUrl: "https://developer.apple.com/music/"
    }
  ]

  const requiredServicesConnected = apiServices.filter(s => s.required).every(s => s.connected)

  return (
    <Card className="card-dark">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          API Configuration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!requiredServicesConnected && (
          <Alert className="bg-red-950/50 border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Some required services are not configured. The app may not function properly.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {apiServices.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.connected, !service.required)}
                <div>
                  <div className="text-white font-medium">{service.name}</div>
                  <div className="text-gray-400 text-sm">{service.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(service.connected, !service.required)}
                {!service.connected && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    <a href={service.setupUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Setup
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            Need help setting up these services? Check out our{" "}
            <Link href="/docs/api-setup" className="text-blue-400 hover:text-blue-300 underline">
              API setup documentation
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
