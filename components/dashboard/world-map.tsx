"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StreamingLocation {
  id: string
  country: string
  city: string
  streams: number
  revenue: number
  region: "North America" | "Europe" | "Asia" | "South America" | "Oceania" | "Africa"
}

interface WorldMapProps {
  locations?: StreamingLocation[]
}

export function WorldMap({ locations = [] }: WorldMapProps) {
  const regionData = locations.reduce((acc, location) => {
    if (!acc[location.region]) {
      acc[location.region] = { streams: 0, revenue: 0, countries: [] }
    }
    acc[location.region].streams += location.streams
    acc[location.region].revenue += location.revenue
    if (!acc[location.region].countries.includes(location.country)) {
      acc[location.region].countries.push(location.country)
    }
    return acc
  }, {} as Record<string, { streams: number; revenue: number; countries: string[] }>)

  const getRegionColor = (streams: number) => {
    if (streams > 10000) return "bg-green-500"
    if (streams > 5000) return "bg-yellow-500"
    if (streams > 2000) return "bg-orange-500"
    return "bg-blue-500"
  }

  const getRegionOpacity = (streams: number) => {
    if (streams > 10000) return "opacity-90"
    if (streams > 5000) return "opacity-70"
    if (streams > 2000) return "opacity-50"
    return "opacity-30"
  }

  const topLocations = locations
    .sort((a, b) => b.streams - a.streams)
    .slice(0, 5)

  return (
    <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-subtle-pulse"></div>
          Global Streaming Activity
        </CardTitle>
        <p className="text-gray-400 text-sm">Your music's reach across the world</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Simplified World Regions Visualization */}
        {(!locations || locations.length === 0) ? (
          <div className="h-80 bg-gray-800/30 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
              <div className="w-8 h-8 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
            </div>
            <p className="text-gray-400 mb-2 font-medium">Waiting for global streaming data</p>
            <p className="text-gray-500 text-xs max-w-md mb-3">
              Your global streaming analytics will appear here once your music begins to generate activity worldwide.
            </p>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
              <span>Global data updates daily</span>
            </div>
            
            {/* Decorative dots for global feel */}
            <div className="absolute top-4 right-4 flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-subtle-pulse"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-subtle-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-subtle-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        ) : (
          <div className="h-80 bg-gray-800/30 rounded-lg p-6 relative overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full">
              {Object.entries(regionData).map(([region, data]) => (
                <div
                  key={region}
                  className={`relative rounded-lg p-4 hover-lift transition-all duration-300 cursor-pointer group ${getRegionColor(data.streams)} ${getRegionOpacity(data.streams)}`}
                >
                  <div className="text-white">
                    <h3 className="font-semibold text-sm mb-1">{region}</h3>
                    <p className="text-xs opacity-90">{data.streams.toLocaleString()} streams</p>
                    <p className="text-xs opacity-90">${data.revenue.toFixed(2)}</p>
                    <p className="text-xs opacity-75 mt-1">{data.countries.length} countries</p>
                  </div>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                </div>
              ))}
            </div>
            
            {/* Decorative dots for global feel */}
            <div className="absolute top-4 right-4 flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-subtle-pulse"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-subtle-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-subtle-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        )}
        
        {/* Top Locations */}
        {topLocations.length > 0 ? (
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <span>Top Streaming Locations</span>
              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                Live Data
              </Badge>
            </h4>
            <div className="space-y-2">
              {topLocations.map((location, index) => (
                <div key={location.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover-fade transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={`text-xs ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-500/20 text-gray-300' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="text-white text-sm font-medium">{location.city}, {location.country}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{location.streams.toLocaleString()} streams</span>
                        <span>•</span>
                        <span>{location.region}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm font-medium">${location.revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded-lg p-4 flex items-center justify-center">
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></span>
              Top streaming locations will appear here when available
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-800/50">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 bg-green-500 rounded-sm opacity-90"></div>
            <span>High Activity (10k+ streams)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm opacity-70"></div>
            <span>Medium (5k+ streams)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 bg-blue-500 rounded-sm opacity-30"></div>
            <span>Low (2k+ streams)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
