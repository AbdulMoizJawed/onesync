'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SpotOnTrackTester() {
  const [query, setQuery] = useState('Drake')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiStatus, setApiStatus] = useState<{key: string, valid: boolean} | null>(null)

  // Check API key status on load
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/status')
        const data = await response.json()
        
        setApiStatus({
          key: 'HIDDEN',
          valid: data.apis?.spotontrack === true
        })
      } catch (err) {
        console.error('Failed to check API status:', err)
        setApiStatus({
          key: 'ERROR',
          valid: false
        })
      }
    }
    
    checkApiStatus()
  }, [])

  // Function to search using our direct API endpoint
  const searchDirectApi = async () => {
    if (!query) return
    
    setLoading(true)
    setError('')
    setResults([])
    
    try {
      const response = await fetch(`/api/test-spotontrack?artist=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        // Transform the single result into an array for consistency
        setResults(data.data ? [data.data] : [])
      } else {
        setError(data.message || 'Search failed')
      }
    } catch (err) {
      setError('API request failed')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to search using the regular API
  const searchRegularApi = async () => {
    if (!query) return
    
    setLoading(true)
    setError('')
    setResults([])
    
    try {
      const response = await fetch(`/api/spotontrack-search?q=${encodeURIComponent(query)}&type=artist`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results || [])
      } else {
        setError(data.message || 'Search failed')
      }
    } catch (err) {
      setError('API request failed')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>SpotOnTrack API Tester</CardTitle>
          <CardDescription>
            Test the SpotOnTrack API integration with your real API key
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* API Status */}
          <div className="mb-6 p-4 rounded border">
            <h3 className="text-lg font-medium mb-2">API Status</h3>
            {apiStatus ? (
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${apiStatus.valid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>
                  SpotOnTrack API: <strong>{apiStatus.valid ? 'Valid' : 'Invalid'}</strong>
                </p>
              </div>
            ) : (
              <p>Checking API status...</p>
            )}
          </div>
          
          {/* Search Form */}
          <div className="flex items-center gap-2 mb-6">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter artist or track name"
              className="flex-1"
            />
            <Button onClick={searchDirectApi} disabled={loading}>
              {loading ? 'Searching...' : 'Test API'}
            </Button>
            <Button onClick={searchRegularApi} disabled={loading} variant="outline">
              {loading ? 'Searching...' : 'Search Regular API'}
            </Button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
              Error: {error}
            </div>
          )}
          
          {/* Results */}
          <div>
            <h3 className="text-lg font-medium mb-2">Results ({results.length})</h3>
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="font-medium">{result.name}</div>
                    {result.isrc && <div className="text-sm text-gray-500">ISRC: {result.isrc}</div>}
                    {result.release_date && <div className="text-sm text-gray-500">Released: {result.release_date}</div>}
                    {result.artwork && (
                      <Image
                        src={result.artwork}
                        alt={result.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 mt-2 object-cover rounded"
                        unoptimized
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                {loading ? 'Searching...' : 'No results found'}
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Using SpotOnTrack API integration
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
