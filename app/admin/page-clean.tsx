"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Music,
  Users,
  AlertTriangle,
  FileDown,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface AdminStats {
  totalUsers: number
  totalReleases: number
  pendingReleases: number
  payoutRequests: number
  takedownRequests: number
  syncRequests: number
}

// Component that uses useSearchParams wrapped in Suspense
function TabHandler({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab) {
      onTabChange(tab)
    }
  }, [searchParams, onTabChange])

  return null
}

function AdminContent() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [releaseQueue, setReleaseQueue] = useState<any[]>([])
  const [payoutRequests, setPayoutRequests] = useState<any[]>([])
  const [takedownRequests, setTakedownRequests] = useState<any[]>([])
  const [syncRequests, setSyncRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [rejectionDialog, setRejectionDialog] = useState<{
    open: boolean
    releaseId: string | null
    releaseTitle: string
  }>({ open: false, releaseId: null, releaseTitle: '' })
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch real data from API
      const [statsRes, queueRes, payoutRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/release-queue'),
        fetch('/api/admin/payout-requests')
      ])

      if (!statsRes.ok) throw new Error('Failed to fetch stats')

      const [statsData, queueData, payoutData] = await Promise.all([
        statsRes.json(),
        queueRes.ok ? queueRes.json() : { data: [] },
        payoutRes.ok ? payoutRes.json() : { data: [] }
      ])

      setStats(statsData)
      setReleaseQueue(queueData.data || [])
      setPayoutRequests(payoutData.data || [])
      
      // For features that need dedicated tables (coming soon)
      setTakedownRequests([])
      setSyncRequests([])
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleReleaseAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const release = releaseQueue.find(r => r.id === id)
      setRejectionDialog({
        open: true,
        releaseId: id,
        releaseTitle: release?.title || 'Unknown'
      })
      return
    }

    try {
      setProcessing(id)
      const res = await fetch('/api/admin/release-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      })

      if (!res.ok) throw new Error('Failed to update release')
      
      await fetchData()
    } catch (err) {
      console.error('Error updating release:', err)
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectWithReason = async () => {
    if (!rejectionDialog.releaseId || !rejectionReason.trim()) return

    try {
      setProcessing(rejectionDialog.releaseId)
      const res = await fetch('/api/admin/release-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: rejectionDialog.releaseId, 
          action: 'reject',
          reason: rejectionReason 
        })
      })

      if (!res.ok) throw new Error('Failed to reject release')
      
      setRejectionDialog({ open: false, releaseId: null, releaseTitle: '' })
      setRejectionReason('')
      await fetchData()
    } catch (err) {
      console.error('Error rejecting release:', err)
    } finally {
      setProcessing(null)
    }
  }

  const handlePayoutRequest = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setProcessing(id)
      const res = await fetch('/api/admin/payout-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (!res.ok) throw new Error('Failed to update payout request')
      
      await fetchData()
    } catch (err) {
      console.error('Error updating payout request:', err)
    } finally {
      setProcessing(null)
    }
  }

  const handleTakedownRequest = async (id: string, action: 'approve' | 'reject') => {
    // Implementation for takedown requests
    console.log('Takedown request:', id, action)
  }

  const handleSyncRequest = async (id: string, action: 'approve' | 'reject') => {
    // Implementation for sync requests
    console.log('Sync request:', id, action)
  }

  const handleExport = async (type: string) => {
    try {
      const res = await fetch(`/api/admin/export/${type}`)
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <TabHandler onTabChange={handleTabChange} />
      </Suspense>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="releases">Release Queue</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="takedowns">Takedowns</TabsTrigger>
            <TabsTrigger value="sync">Sync Requests</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered artists</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalReleases || 0}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Releases</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingReleases || 0}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Payout Requests</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.payoutRequests || 0}</div>
                  <p className="text-xs text-muted-foreground">Pending approval</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Releases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {releaseQueue.slice(0, 5).map((release) => (
                      <div key={release.id} className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {release.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            by {release.artist_name}
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          <Badge variant="outline">{release.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab('releases')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Review Releases
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab('payouts')}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Payouts
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab('export')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="releases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Release Queue</CardTitle>
                <CardDescription>Review and approve new releases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {releaseQueue.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No releases pending review</p>
                  ) : (
                    releaseQueue.map((release) => (
                      <div key={release.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{release.title}</h4>
                            <p className="text-sm text-muted-foreground">by {release.artist_name}</p>
                            <div className="flex gap-2 mt-2">
                              {release.genre && <Badge variant="outline">{release.genre}</Badge>}
                              {release.release_type && <Badge variant="outline">{release.release_type}</Badge>}
                              {release.explicit && <Badge variant="destructive">Explicit</Badge>}
                              {release.status && <Badge>{release.status}</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReleaseAction(release.id, 'approve')}
                              disabled={processing === release.id}
                            >
                              {processing === release.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReleaseAction(release.id, 'reject')}
                              disabled={processing === release.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/api/admin/export/releases?id=${release.id}`, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Submitted by: {release.profiles?.full_name || 'Unknown User'} ({release.profiles?.email || 'No email'})
                          <br />
                          Created: {new Date(release.created_at).toLocaleDateString()}
                          {release.streams > 0 && <span> • {release.streams} streams</span>}
                          {release.revenue > 0 && <span> • ${release.revenue.toFixed(2)} revenue</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payout Requests</CardTitle>
                <CardDescription>Manage artist payout requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending payout requests</p>
                  ) : (
                    payoutRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">${request.amount}</h4>
                            <p className="text-sm text-muted-foreground">
                              {request.profiles?.full_name} ({request.profiles?.email})
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Method: {request.payout_method} • Status: {request.status}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePayoutRequest(request.id, 'approved')}
                              disabled={processing === request.id}
                            >
                              {processing === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handlePayoutRequest(request.id, 'rejected')}
                              disabled={processing === request.id}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="takedowns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Takedown Requests</CardTitle>
                <CardDescription>Handle content takedown requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {takedownRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending takedown requests</p>
                  ) : (
                    takedownRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{request.content_title}</h4>
                            <p className="text-sm text-muted-foreground">Reason: {request.reason}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTakedownRequest(request.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleTakedownRequest(request.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync Requests</CardTitle>
                <CardDescription>Manage music synchronization requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending sync requests</p>
                  ) : (
                    syncRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{request.project_name}</h4>
                            <p className="text-sm text-muted-foreground">Track: {request.track_title}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncRequest(request.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSyncRequest(request.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>Export platform data for analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport('users')}
                    className="h-20 flex-col"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    Export Users
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('releases')}
                    className="h-20 flex-col"
                  >
                    <Music className="h-6 w-6 mb-2" />
                    Export Releases
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('analytics')}
                    className="h-20 flex-col"
                  >
                    <FileDown className="h-6 w-6 mb-2" />
                    Export Analytics
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('payouts')}
                    className="h-20 flex-col"
                  >
                    <DollarSign className="h-6 w-6 mb-2" />
                    Export Payouts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={rejectionDialog.open} onOpenChange={(open) => 
          setRejectionDialog({ ...rejectionDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Release</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting &ldquo;{rejectionDialog.releaseTitle}&rdquo;
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectionDialog({ open: false, releaseId: null, releaseTitle: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectWithReason}
                disabled={!rejectionReason.trim() || processing === rejectionDialog.releaseId}
              >
                {processing === rejectionDialog.releaseId ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject Release
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AdminContent />
    </Suspense>
  )
}
