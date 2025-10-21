'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

export default function TestSpotOnTrackPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isrc, setIsrc] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [trackData, setTrackData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('test')

  // Initial API test (stable reference for useEffect)
  const testAPI = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🧪 Testing SpotOnTrack API...')

      // Test tracks endpoint
      const response = await fetch('/api/spotontrack/tracks?title=God\'s Plan&artist=Drake')
      const data = await response.json()

      if (response.ok) {
        setTestResult(data)
        console.log('✅ API test successful:', data)

        // If the track has an ISRC, pre-populate the ISRC field
        if (data.success && data.data && data.data.isrc) {
          setIsrc(data.data.isrc)
        }
      } else {
        throw new Error(data.error || 'API test failed')
      }
    } catch (err: any) {
      setError(err.message)
      console.error('❌ API test failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Search for tracks
  const handleSearch = async () => {
    if (!searchQuery) return
    
    setLoading(true)
    setError(null)
    setSearchResults([])
    
    try {
      const response = await fetch(`/api/spotontrack/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.data || [])
      } else {
        setError(data.message || 'Failed to search tracks')
      }
    } catch (err: any) {
      setError('Failed to connect to SpotOnTrack API')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Get comprehensive track analytics
  const handleTrackLookup = async () => {
    if (!isrc) return
    
    setLoading(true)
    setError(null)
    setTrackData(null)
    
    try {
      const response = await fetch(`/api/spotontrack/analytics?isrc=${encodeURIComponent(isrc)}`)
      const data = await response.json()
      
      if (data.success) {
        setTrackData(data.data || null)
      } else {
        setError(data.message || 'Failed to get track data')
      }
    } catch (err: any) {
      setError('Failed to connect to SpotOnTrack API')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handle selecting a track from search results
  const handleSearchResultClick = (isrc: string) => {
    setIsrc(isrc)
    setActiveTab('analytics')
  }

  useEffect(() => {
    // Auto-run test on page load
    testAPI()
  }, [testAPI])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">SpotOnTrack API Integration</h1>
          <p className="text-gray-600">
            Test and explore music analytics across Spotify, Apple Music, Deezer, and Shazam platforms
          </p>
        </div>
        <a 
          href="/test-spotontrack/docs" 
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Documentation
        </a>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button 
          className={`mr-4 py-2 px-4 ${activeTab === 'test' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('test')}
        >
          API Test
        </button>
        <button 
          className={`mr-4 py-2 px-4 ${activeTab === 'search' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
        <button 
          className={`mr-4 py-2 px-4 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Track Analytics
        </button>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* API Test Tab */}
      {activeTab === 'test' && (
        <div>
          <div className="mb-6">
            <button 
              onClick={testAPI}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? 'Testing...' : 'Test API'}
            </button>
          </div>

          {testResult && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <h2 className="text-lg font-semibold mb-2">✅ API Test Successful!</h2>
              <p><strong>Track found:</strong> {testResult.success ? 'Yes' : 'No'}</p>
              
              {testResult.success && testResult.data && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Track Details:</h3>
                  <ul className="list-disc list-inside">
                    <li><strong>Title:</strong> {testResult.data.name || testResult.data.title}</li>
                    <li><strong>Artist:</strong> {testResult.data.artist}</li>
                    <li><strong>ISRC:</strong> {testResult.data.isrc}</li>
                    {testResult.data.peak_position && <li><strong>Peak Position:</strong> #{testResult.data.peak_position}</li>}
                    {testResult.data.chart_weeks && <li><strong>Chart Weeks:</strong> {testResult.data.chart_weeks}</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {testResult && (
            <details className="mt-6">
              <summary className="cursor-pointer font-semibold">Full API Response</summary>
              <pre className="bg-gray-100 p-4 rounded mt-2 overflow-x-auto text-sm">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
      
      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          <div className="mb-6 flex">
            <input
              type="text"
              placeholder="Search for a track or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-grow p-2 border rounded-l"
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Results ({searchResults.length})</h2>
              <div className="grid gap-4">
                {searchResults.map((track, index) => (
                  <div 
                    key={index} 
                    className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSearchResultClick(track.isrc)}
                  >
                    <div className="flex">
                      {track.artwork && (
                        <Image
                          src={track.artwork}
                          alt={track.name}
                          width={64}
                          height={64}
                          unoptimized
                          className="w-16 h-16 mr-4 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{track.name}</h3>
                        <p className="text-gray-600">
                          {track.artist || (track.artists && track.artists[0]?.name) || 'Unknown Artist'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">ISRC: {track.isrc}</p>
                        {track.release_date && (
                          <p className="text-sm text-gray-500">Released: {track.release_date}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <div className="mb-6 flex">
            <input
              type="text"
              placeholder="Enter ISRC..."
              value={isrc}
              onChange={(e) => setIsrc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrackLookup()}
              className="flex-grow p-2 border rounded-l"
            />
            <button 
              onClick={handleTrackLookup}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
            >
              {loading ? 'Loading...' : 'Get Analytics'}
            </button>
          </div>
          
          {trackData && (
            <div>
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex mb-4">
                  {trackData.artwork && (
                    <Image
                      src={trackData.artwork}
                      alt={trackData.name}
                      width={96}
                      height={96}
                      className="w-24 h-24 mr-6 object-cover rounded"
                      unoptimized
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{trackData.name}</h2>
                    <p className="text-lg text-gray-700">{trackData.artist}</p>
                    <p className="text-sm text-gray-500">ISRC: {trackData.isrc}</p>
                    {trackData.release_date && (
                      <p className="text-sm text-gray-500">Released: {trackData.release_date}</p>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mt-6 mb-3">Analytics Summary</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Spotify Charts</div>
                    <div className="text-xl font-bold">{trackData.spotify_charts?.length || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Apple Charts</div>
                    <div className="text-xl font-bold">{trackData.apple_charts?.length || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Deezer Charts</div>
                    <div className="text-xl font-bold">{trackData.deezer_charts?.length || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Shazam Charts</div>
                    <div className="text-xl font-bold">{trackData.shazam_charts?.length || 0}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Spotify Playlists</div>
                    <div className="text-xl font-bold">{trackData.spotify_playlists?.length || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Apple Playlists</div>
                    <div className="text-xl font-bold">{trackData.apple_playlists?.length || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Deezer Playlists</div>
                    <div className="text-xl font-bold">{trackData.deezer_playlists?.length || 0}</div>
                  </div>
                </div>
              </div>
              
              {trackData.spotify_streams && trackData.spotify_streams.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Spotify Streams</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b text-left">Date</th>
                          <th className="py-2 px-4 border-b text-right">Daily</th>
                          <th className="py-2 px-4 border-b text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trackData.spotify_streams.slice(0, 7).map((stream: any, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="py-2 px-4 border-b">{stream.date}</td>
                            <td className="py-2 px-4 border-b text-right">{formatNumber(stream.daily)}</td>
                            <td className="py-2 px-4 border-b text-right">{formatNumber(stream.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {trackData.spotify_streams.length > 7 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Showing 7 of {trackData.spotify_streams.length} data points
                    </p>
                  )}
                </div>
              )}
              
              {trackData.shazam_data && trackData.shazam_data.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Shazam Data</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b text-left">Date</th>
                          <th className="py-2 px-4 border-b text-right">Daily</th>
                          <th className="py-2 px-4 border-b text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trackData.shazam_data.slice(0, 7).map((shazam: any, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="py-2 px-4 border-b">{shazam.date}</td>
                            <td className="py-2 px-4 border-b text-right">{formatNumber(shazam.daily)}</td>
                            <td className="py-2 px-4 border-b text-right">{formatNumber(shazam.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {trackData.shazam_data.length > 7 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Showing 7 of {trackData.shazam_data.length} data points
                    </p>
                  )}
                </div>
              )}
              
              <details className="mt-6">
                <summary className="cursor-pointer font-semibold">Full Analytics Data</summary>
                <pre className="bg-gray-100 p-4 rounded mt-2 overflow-x-auto text-sm">
                  {JSON.stringify(trackData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Format numbers with commas
function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return '-'
  return new Intl.NumberFormat().format(num)
}
