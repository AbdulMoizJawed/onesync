import { Metadata } from 'next'
import { ApiStatus } from '@/components/api-status'
import ErrorMonitor from '@/components/dev/error-monitor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Settings, Database, Monitor, Zap, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Development Dashboard - Music Distribution App',
  description: 'Monitor app health, performance, and configuration',
}

export default function DevDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Development Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor your app&apos;s health, performance, and configuration
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Development Mode
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">API Status</p>
                <p className="text-lg font-semibold">Checking...</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className="text-lg font-semibold">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Monitoring</p>
                <p className="text-lg font-semibold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Performance</p>
                <p className="text-lg font-semibold">Good</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Status
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Error Monitor
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <ApiStatus />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <ErrorMonitor />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Query Performance</span>
                    <Badge variant="outline">Good</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Connection Pool</span>
                    <Badge variant="outline">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Hit Rate</span>
                    <Badge variant="outline">85%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Frontend Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Page Load Time</span>
                    <Badge variant="outline">Fast</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bundle Size</span>
                    <Badge variant="outline">Optimized</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Core Web Vitals</span>
                    <Badge variant="outline">Good</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">Database Optimization</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Consider adding indexes for frequently queried columns in forum_posts and analytics tables.
                  </p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900">Caching Strategy</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Implement Redis caching for static data like categories and user profiles.
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900">Code Splitting</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Large components like the music player could benefit from dynamic imports.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Setup Guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/docs/api-setup">
                    API Configuration
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer">
                    Supabase Documentation
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href="https://stripe.com/docs/connect" target="_blank" rel="noopener noreferrer">
                    Stripe Connect Setup
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer">
                    Next.js Documentation
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href="https://tailwindcss.com/docs" target="_blank" rel="noopener noreferrer">
                    Tailwind CSS Docs
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">
                    shadcn/ui Components
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                <div>📁 app/ - Next.js app router pages</div>
                <div>📁 components/ - Reusable UI components</div>
                <div>📁 lib/ - Utility functions and configurations</div>
                <div>📁 scripts/ - Database migration scripts</div>
                <div>📁 public/ - Static assets</div>
                <div>📄 .env.local - Environment variables (not in git)</div>
                <div>📄 .env.example - Environment template</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
