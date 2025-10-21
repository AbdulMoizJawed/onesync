'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function EmergencyVerify() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [directTestResult, setDirectTestResult] = useState<any>(null)
  
  // Run emergency verification
  const runEmergencyVerification = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/test-spotontrack?artist=Taylor%20Swift')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Verification failed:', error)
      setResults({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }
  
  // Direct fetch test
  const runDirectTest = async () => {
    setLoading(true)
    
    try {
      // This uses the browser to make a direct request
      // This won't work due to CORS but demonstrates the concept
      const response = await fetch('https://www.spotontrack.com/api/v1/tracks?query=test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('api_key') || 'jgdRcPw42mGxmcgFb2icOopo4HCRbNkwfiefxeLCbc2f9fe8'}`,
          'Content-Type': 'application/json'
        }
      })
      
      setDirectTestResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
        cors: 'This test is expected to fail due to CORS restrictions'
      })
    } catch (error) {
      console.error('Direct test failed:', error)
      setDirectTestResult({ 
        error: String(error),
        note: 'This test is expected to fail due to CORS restrictions'
      })
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    // Auto-run verification on page load
    runEmergencyVerification()
  }, [])
  
  return (
    <div className="container py-8">
      <Card className="w-full max-w-3xl mx-auto mb-6">
        <CardHeader className="bg-blue-50">
          <CardTitle>� SPOTONTRACK SEARCH TEST</CardTitle>
          <CardDescription>
            Test SpotOnTrack API search functionality with Taylor Swift
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-4">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Running verification...</p>
              </div>
            ) : (
              <>
                {results && (
                  <div className="border rounded p-4">
                    <h3 className="text-lg font-semibold mb-2">Verification Results:</h3>
                    
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="font-medium w-32">Status:</span>
                        <span className={results.success ? 'text-green-600' : 'text-red-600'}>
                          {results.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      
                      {results.artist && (
                        <div className="flex">
                          <span className="font-medium w-32">Artist:</span>
                          <span>{results.artist}</span>
                        </div>
                      )}
                      
                      {results.data && (
                        <div className="flex">
                          <span className="font-medium w-32">ISRC:</span>
                          <span>{results.data.isrc || 'Not found'}</span>
                        </div>
                      )}
                      
                      {results.data && results.data.artists && (
                        <div className="flex">
                          <span className="font-medium w-32">Artists:</span>
                          <span>{results.data.artists.map((a: any) => a.name).join(', ')}</span>
                        </div>
                      )}
                      
                      {results.error && (
                        <div className="mt-2">
                          <div className="font-medium text-red-600">Error:</div>
                          <pre className="bg-red-50 p-2 text-xs overflow-auto max-h-32 rounded">
                            {results.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {directTestResult && (
                  <div className="border rounded p-4">
                    <h3 className="text-lg font-semibold mb-2">Direct Browser Test:</h3>
                    <pre className="bg-gray-100 p-2 text-xs overflow-auto max-h-32 rounded">
                      {JSON.stringify(directTestResult, null, 2)}
                    </pre>
                    <p className="text-xs mt-2 text-orange-600">
                      Note: Direct browser test expected to fail due to CORS restrictions.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            onClick={runEmergencyVerification}
            disabled={loading}
            variant="default"
          >
            {loading ? 'Running...' : 'Test SpotOnTrack Search'}
          </Button>
          
          <Button 
            onClick={runDirectTest}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Running...' : 'Test Direct Browser Call'}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="max-w-3xl mx-auto p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-bold text-lg mb-2">Troubleshooting Steps:</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Verify the API key in <code className="bg-gray-100 px-1">.env.local</code> is correct and properly formatted</li>
          <li>Ensure the development server has been restarted after changing environment variables</li>
          <li>Check that <code className="bg-gray-100 px-1">lib/spotontrack-api.ts</code> is properly loading the API key</li>
          <li>Clear browser cache or use incognito mode to rule out caching issues</li>
          <li>Use browser developer tools to inspect network requests for errors</li>
          <li>Verify that the SpotOnTrack API service is accessible and responding</li>
        </ol>
      </div>
    </div>
  )
}
