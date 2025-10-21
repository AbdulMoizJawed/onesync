'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SpotOnTrackDocsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <div className="sticky top-6">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">Documentation</h3>
              <nav className="space-y-1">
                <NavItem 
                  id="overview" 
                  active={activeSection === 'overview'} 
                  onClick={() => setActiveSection('overview')}
                >
                  Overview
                </NavItem>
                <NavItem 
                  id="endpoints" 
                  active={activeSection === 'endpoints'} 
                  onClick={() => setActiveSection('endpoints')}
                >
                  API Endpoints
                </NavItem>
                <NavItem 
                  id="implementation" 
                  active={activeSection === 'implementation'} 
                  onClick={() => setActiveSection('implementation')}
                >
                  Implementation
                </NavItem>
                <NavItem 
                  id="configuration" 
                  active={activeSection === 'configuration'} 
                  onClick={() => setActiveSection('configuration')}
                >
                  Configuration
                </NavItem>
                <NavItem 
                  id="testing" 
                  active={activeSection === 'testing'} 
                  onClick={() => setActiveSection('testing')}
                >
                  Testing
                </NavItem>
              </nav>
              <div className="mt-6 pt-4 border-t">
                <Link 
                  href="/test-spotontrack" 
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                >
                  ← Back to Test Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          {activeSection === 'overview' && (
            <section id="overview">
              <h2 className="text-2xl font-bold mb-4">SpotOnTrack API Integration</h2>
              <p className="mb-4">
                SpotOnTrack is a professional music analytics service that provides data on track 
                performance across multiple streaming platforms. Our integration enables artists and labels 
                to access comprehensive analytics in one place.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <FeatureCard 
                  title="Multi-Platform Analytics" 
                  description="Track performance across Spotify, Apple Music, Deezer, and Shazam in one place."
                />
                <FeatureCard 
                  title="Chart Performance" 
                  description="Monitor chart positions and historical performance across global charts."
                />
                <FeatureCard 
                  title="Playlist Tracking" 
                  description="Discover which playlists your tracks are featured in across streaming platforms."
                />
                <FeatureCard 
                  title="Streaming Data" 
                  description="Access detailed streaming statistics and trends for your releases."
                />
              </div>
            </section>
          )}

          {activeSection === 'endpoints' && (
            <section id="endpoints">
              <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
              <p className="mb-6">
                The following API endpoints have been implemented to access SpotOnTrack data:
              </p>
              
              <div className="space-y-6">
                <EndpointCard 
                  name="Search" 
                  path="/api/spotontrack/search" 
                  method="GET"
                  description="Search for tracks by name, artist, or ISRC"
                  params={[
                    { name: "q", required: true, description: "Search query" },
                    { name: "type", required: false, description: "Type of search (track, artist, isrc)" },
                    { name: "limit", required: false, description: "Maximum results to return (default: 10)" }
                  ]}
                />
                
                <EndpointCard 
                  name="Comprehensive Analytics" 
                  path="/api/spotontrack/analytics" 
                  method="GET"
                  description="Get all analytics for a track across all platforms"
                  params={[
                    { name: "isrc", required: true, description: "ISRC code of the track" }
                  ]}
                />
                
                <EndpointCard 
                  name="Charts" 
                  path="/api/spotontrack/charts" 
                  method="GET"
                  description="Get chart positions for a track"
                  params={[
                    { name: "isrc", required: true, description: "ISRC code of the track" },
                    { name: "platform", required: false, description: "Platform to retrieve charts from (spotify, apple, deezer, shazam, all)" }
                  ]}
                />
                
                <EndpointCard 
                  name="Playlists" 
                  path="/api/spotontrack/playlists" 
                  method="GET"
                  description="Get playlist inclusions for a track"
                  params={[
                    { name: "isrc", required: true, description: "ISRC code of the track" },
                    { name: "platform", required: false, description: "Platform to retrieve playlists from (spotify, apple, deezer, all)" }
                  ]}
                />
                
                <EndpointCard 
                  name="Streams" 
                  path="/api/spotontrack/streams" 
                  method="GET"
                  description="Get streaming data for a track"
                  params={[
                    { name: "isrc", required: true, description: "ISRC code of the track" }
                  ]}
                />
                
                <EndpointCard 
                  name="Shazam" 
                  path="/api/spotontrack/shazam" 
                  method="GET"
                  description="Get Shazam data for a track"
                  params={[
                    { name: "isrc", required: true, description: "ISRC code of the track" }
                  ]}
                />
              </div>
            </section>
          )}

          {activeSection === 'implementation' && (
            <section id="implementation">
              <h2 className="text-2xl font-bold mb-4">Implementation Details</h2>
              <p className="mb-4">
                The SpotOnTrack API client is implemented in <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/lib/spotontrack-api.ts</code> with the following features:
              </p>
              
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Proper error handling and rate limiting</li>
                <li>API key validation and management</li>
                <li>Comprehensive data fetching across all platforms</li>
                <li>Parallel requests for optimized performance</li>
                <li>TypeScript interfaces for type safety</li>
              </ul>
              
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2">Key Components</h3>
                <ul className="list-none space-y-2">
                  <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/lib/spotontrack-api.ts</code> - Core API client</li>
                  <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/app/api/spotontrack/</code> - API route handlers</li>
                  <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/app/test-spotontrack/</code> - Test interface</li>
                  <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/docs/SPOTONTRACK_API.md</code> - Documentation</li>
                </ul>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">Data Flow</h3>
              <p>
                The SpotOnTrack API integration follows this data flow:
              </p>
              <ol className="list-decimal pl-6 space-y-2 mt-2">
                <li>Client components make requests to internal API routes</li>
                <li>API routes use the SpotOnTrack API client to fetch data</li>
                <li>The API client makes authenticated requests to SpotOnTrack</li>
                <li>Data is transformed and returned in a consistent format</li>
                <li>Client components render the data with proper error handling</li>
              </ol>
            </section>
          )}

          {activeSection === 'configuration' && (
            <section id="configuration">
              <h2 className="text-2xl font-bold mb-4">Configuration</h2>
              <p className="mb-6">
                The SpotOnTrack API integration requires configuration through environment variables.
              </p>
              
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
                <p className="mb-4">Add the following to your <code>.env.local</code> file:</p>
                <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                  SPOTONTRACK_API_KEY=your_api_key_here
                </pre>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">API Key Management</h3>
              <p className="mb-4">
                The API key is loaded via the application's environment configuration system in <code>lib/env-config.ts</code>.
                This ensures secure handling of the API key and prevents exposing it to the client.
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
                <h4 className="text-yellow-800 dark:text-yellow-200 font-semibold">Note</h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  The SpotOnTrack API has rate limits that may affect your usage. Implement caching 
                  strategies for production use to avoid hitting these limits.
                </p>
              </div>
            </section>
          )}

          {activeSection === 'testing' && (
            <section id="testing">
              <h2 className="text-2xl font-bold mb-4">Testing</h2>
              <p className="mb-4">
                You can test the SpotOnTrack API integration using the test interface at <Link href="/test-spotontrack" className="text-blue-500 hover:text-blue-700">/test-spotontrack</Link>.
              </p>
              
              <h3 className="text-lg font-semibold mb-2">Test Features</h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>API connection test</li>
                <li>Track search functionality</li>
                <li>Comprehensive track analytics</li>
                <li>Data visualization for charts, playlists, and streaming</li>
                <li>Response inspection for debugging</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-2">Troubleshooting</h3>
              <div className="space-y-4 mb-6">
                <TroubleshootingItem 
                  problem="API Key Not Working" 
                  solution={"Verify your API key is correctly set in .env.local and that it\u2019s a valid SpotOnTrack API key."}
                />
                <TroubleshootingItem 
                  problem="Rate Limiting Errors" 
                  solution={"If you receive 429 Too Many Requests errors, you\u2019ve hit the API rate limit. Implement caching or reduce request frequency."}
                />
                <TroubleshootingItem 
                  problem="No Data Returned" 
                  solution={"Ensure you\u2019re using valid ISRCs or track identifiers. Not all tracks have data on all platforms."}
                />
                <TroubleshootingItem 
                  problem="Type Errors" 
                  solution={"If you encounter TypeScript errors, check that you\u2019re using the correct interfaces from the SpotOnTrack API client."}
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded">
                <h4 className="text-blue-800 dark:text-blue-200 font-semibold">Pro Tip</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  When testing with specific tracks, try using popular tracks like &quot;God&apos;s Plan&quot; by Drake 
                  which typically have data across all platforms for the most comprehensive test results.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function NavItem({ id, active, onClick, children }: { 
  id: string, 
  active: boolean, 
  onClick: () => void, 
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
        active 
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

function FeatureCard({ title, description }: { title: string, description: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  )
}

function EndpointCard({ 
  name, 
  path, 
  method, 
  description, 
  params 
}: { 
  name: string, 
  path: string, 
  method: string,
  description: string,
  params: { name: string, required: boolean, description: string }[]
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        <span className={`text-xs px-2 py-1 rounded ${
          method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
          method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }`}>
          {method}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-3">
          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{path}</code>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{description}</p>
        
        {params.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Parameters</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
              {params.map((param, index) => (
                <div 
                  key={param.name}
                  className={`px-3 py-2 text-sm ${
                    index !== params.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs">{param.name}</code>
                    {param.required && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{param.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TroubleshootingItem({ problem, solution }: { problem: string, solution: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <h4 className="font-semibold text-md mb-1">{problem}</h4>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{solution}</p>
    </div>
  )
}
