'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert } from '@/components/ui/alert'
import { CheckCircle, XCircle } from 'lucide-react'

export default function DirectFTPFixPage() {
  // State for release fix
  const [releaseLoading, setReleaseLoading] = useState(false)
  const [releaseId, setReleaseId] = useState('')
  const [releaseResult, setReleaseResult] = useState<any>(null)
  const [releaseError, setReleaseError] = useState<string | null>(null)

  // State for connection test
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Test general FTP connection
  const testConnection = async () => {
    setConnectionLoading(true)
    setConnectionResult(null)
    setConnectionError(null)

    try {
      const response = await fetch('/api/test-ftp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setConnectionResult(data)
      } else {
        setConnectionError(data.error || data.details || 'An error occurred')
      }
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setConnectionLoading(false)
    }
  }

  // Test specific release FTP fix
  const handleDirectFix = async (e: React.FormEvent) => {
    e.preventDefault()
    setReleaseLoading(true)
    setReleaseResult(null)
    setReleaseError(null)

    try {
      const response = await fetch('/api/direct-ftp-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ releaseId }),
      })

      const data = await response.json()

      if (response.ok) {
        setReleaseResult(data)
      } else {
        setReleaseError(data.error || 'An error occurred')
      }
    } catch (err) {
      setReleaseError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setReleaseLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">FTP Connection Diagnostics</h1>
      
      <Tabs defaultValue="connection">
        <TabsList className="mb-4">
          <TabsTrigger value="connection">Test Connection</TabsTrigger>
          <TabsTrigger value="release">Test Release Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>FTP Connection Test</CardTitle>
              <CardDescription>
                Test the basic FTP connection to diagnose any connectivity issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testConnection} 
                disabled={connectionLoading}
                className="w-full"
              >
                {connectionLoading ? 'Testing Connection...' : 'Test FTP Connection'}
              </Button>
              
              {connectionError && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <div>
                    <h5 className="font-medium mb-1">Connection Error</h5>
                    <div className="text-sm">
                      {connectionError}
                      
                      {connectionResult?.troubleshooting && (
                        <div className="mt-2">
                          <strong>Troubleshooting Tips:</strong>
                          <ul className="list-disc pl-5 mt-1">
                            {connectionResult.troubleshooting.map((tip: string, i: number) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
              
              {connectionResult && connectionResult.success && (
                <Alert className="mt-4 bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <h5 className="font-medium mb-1 text-green-800">Connection Successful</h5>
                    <div className="text-sm text-green-700">
                      {connectionResult.message}
                      
                      {connectionResult.directoryContents && connectionResult.directoryContents.length > 0 && (
                        <div className="mt-2">
                          <strong>Directory Contents:</strong>
                          <ul className="list-disc pl-5 mt-1">
                            {connectionResult.directoryContents.slice(0, 10).map((item: any) => (
                              <li key={item.name}>
                                {item.name} {item.type === 2 ? '(Directory)' : '(File)'} - {Math.round(item.size / 1024)} KB
                              </li>
                            ))}
                            {connectionResult.directoryContents.length > 10 && (
                              <li>... and {connectionResult.directoryContents.length - 10} more items</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="release">
          <Card>
            <CardHeader>
              <CardTitle>Release Upload Test</CardTitle>
              <CardDescription>
                Test FTP upload for a specific release
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDirectFix} className="space-y-4">
                <div>
                  <Label htmlFor="releaseId">Release ID</Label>
                  <Input
                    id="releaseId"
                    value={releaseId}
                    onChange={(e) => setReleaseId(e.target.value)}
                    placeholder="Enter release ID"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={releaseLoading || !releaseId}
                  className="w-full"
                >
                  {releaseLoading ? 'Testing Upload...' : 'Test FTP Upload'}
                </Button>
              </form>

              {releaseError && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <div>
                    <h5 className="font-medium mb-1">Upload Error</h5>
                    <div className="text-sm">{releaseError}</div>
                  </div>
                </Alert>
              )}

              {releaseResult && releaseResult.success && (
                <Alert className="mt-4 bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <h5 className="font-medium mb-1 text-green-800">Upload Successful</h5>
                    <div className="text-sm text-green-700">
                      {releaseResult.message}
                      
                      {releaseResult.files && releaseResult.files.length > 0 && (
                        <div className="mt-2">
                          <strong>Files uploaded:</strong>
                          <ul className="list-disc pl-5 mt-1">
                            {releaseResult.files.map((file: string) => (
                              <li key={file}>{file}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
