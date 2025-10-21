"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { isAdminUser } from '@/utils/admin'
import { 
  Users, 
  Music, 
  Database,
  ExternalLink,
  BarChart3,
  Lock,
  AlertCircle,
  Bell,
  Send,
  Activity,
  DollarSign,
  MessageSquare,
  Zap,
  TrendingUp,
  Eye,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Settings,
  Shield,
  FileText,
  Upload,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Ban,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AdminStats {
  totalUsers: number
  totalReleases: number
  totalNotifications: number
  unreadNotifications: number
  totalRevenue: number
  activeUploads: number
  pendingReviews: number
  takedownRequests: number
  payoutRequests: number
  timestamp: string
}

interface NotificationForm {
  user_id: string
  title: string
  message: string
  type: 'release' | 'payout' | 'system' | 'promotion' | 'warning'
}

interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
  role?: string
  status?: string
}

interface Release {
  id: string
  title: string
  artist: string
  status: string
  created_at: string
  user_id: string
  cover_art?: string
  audio_file?: string
  admin_notes?: string
}

interface PayoutRequest {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
  payment_method: string
  admin_notes?: string
}

interface TakedownRequest {
  id: string
  title: string
  artist: string
  complainant: string
  status: string
  created_at: string
  reason: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [takedownRequests, setTakedownRequests] = useState<TakedownRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [notificationForm, setNotificationForm] = useState<NotificationForm>({
    user_id: '',
    title: '',
    message: '',
    type: 'system'
  })
  const [sendingNotification, setSendingNotification] = useState(false)

  // Admin authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login?redirect=/admin')
        return
      }
      
      if (!isAdminUser(user)) {
        router.push('/')
        return
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && isAdminUser(user)) {
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchReleases(),
        fetchPayoutRequests(),
        fetchTakedownRequests()
      ])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          ...data,
          totalNotifications: 0,
          unreadNotifications: 0,
          totalRevenue: 0,
          activeUploads: 0,
          pendingReviews: 5,
          takedownRequests: 3,
          payoutRequests: 8
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      if (!supabase) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchReleases = async () => {
    try {
      const response = await fetch('/api/admin/release-queue')
      if (response.ok) {
        const data = await response.json()
        setReleases(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching releases:', error)
    }
  }

  const fetchPayoutRequests = async () => {
    try {
      const response = await fetch('/api/admin/payout-requests')
      if (response.ok) {
        const data = await response.json()
        setPayoutRequests(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching payout requests:', error)
    }
  }

  const fetchTakedownRequests = async () => {
    // Mock data for now - would be replaced with real API call
    setTakedownRequests([
      {
        id: '1',
        title: 'Sample Song',
        artist: 'Sample Artist',
        complainant: 'Rights Holder Inc.',
        status: 'pending',
        created_at: new Date().toISOString(),
        reason: 'Copyright infringement claim'
      }
    ])
  }

  const handleReleaseAction = async (releaseId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch('/api/admin/release-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: releaseId, action, reason })
      })

      if (response.ok) {
        toast.success(`Release ${action}d successfully`)
        fetchReleases()
      } else {
        throw new Error(`Failed to ${action} release`)
      }
    } catch (error) {
      console.error(`Error ${action}ing release:`, error)
      toast.error(`Failed to ${action} release`)
    }
  }

  const handlePayoutAction = async (payoutId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const response = await fetch('/api/admin/payout-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payoutId, status, admin_notes: notes })
      })

      if (response.ok) {
        toast.success(`Payout ${status} successfully`)
        fetchPayoutRequests()
      } else {
        throw new Error(`Failed to ${status} payout`)
      }
    } catch (error) {
      console.error(`Error ${status}ing payout:`, error)
      toast.error(`Failed to ${status} payout`)
    }
  }

  const sendNotification = async () => {
    if (!notificationForm.user_id || !notificationForm.title || !notificationForm.message) {
      toast.error('Please fill in all notification fields')
      return
    }

    setSendingNotification(true)
    try {
      // Mock notification sending - would be replaced with real API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Notification sent successfully')
      setNotificationForm({
        user_id: '',
        title: '',
        message: '',
        type: 'system'
      })
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setSendingNotification(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-400 mr-3" />
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-400 border-green-400">
                {user.email}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Releases</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalReleases || 0}</p>
                </div>
                <Music className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Reviews</p>
                  <p className="text-2xl font-bold text-white">{stats?.pendingReviews || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Payout Requests</p>
                  <p className="text-2xl font-bold text-white">{stats?.payoutRequests || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="releases" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Music className="w-4 h-4 mr-2" />
              Releases
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="payouts" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Payouts
            </TabsTrigger>
            <TabsTrigger value="takedowns" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <AlertCircle className="w-4 h-4 mr-2" />
              Takedowns
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <Upload className="w-4 h-4 text-green-400 mr-3" />
                        <div>
                          <p className="text-white text-sm">New release uploaded</p>
                          <p className="text-gray-400 text-xs">2 minutes ago</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-400">New</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-purple-400 mr-3" />
                        <div>
                          <p className="text-white text-sm">Payout request submitted</p>
                          <p className="text-gray-400 text-xs">15 minutes ago</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-purple-400 border-purple-400">Pending</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-400 mr-3" />
                        <div>
                          <p className="text-white text-sm">Takedown request received</p>
                          <p className="text-gray-400 text-xs">1 hour ago</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-red-400 border-red-400">Urgent</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col"
                      onClick={() => setActiveTab('releases')}
                    >
                      <Music className="w-6 h-6 mb-2" />
                      Review Releases
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col"
                      onClick={() => setActiveTab('payouts')}
                    >
                      <DollarSign className="w-6 h-6 mb-2" />
                      Process Payouts
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col"
                      onClick={() => setActiveTab('users')}
                    >
                      <Users className="w-6 h-6 mb-2" />
                      Manage Users
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col"
                      onClick={() => setActiveTab('takedowns')}
                    >
                      <AlertCircle className="w-6 h-6 mb-2" />
                      Handle Takedowns
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Releases Tab */}
          <TabsContent value="releases" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Music className="w-5 h-5 mr-2 text-green-400" />
                    Release Management
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchReleases}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {releases.length === 0 ? (
                    <div className="text-center py-8">
                      <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No releases found</p>
                    </div>
                  ) : (
                    releases.map((release) => (
                      <div key={release.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{release.title}</h3>
                            <p className="text-gray-400 text-sm">{release.artist}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge
                                variant={
                                  release.status === 'approved' ? 'default' :
                                  release.status === 'rejected' ? 'destructive' : 'secondary'
                                }
                              >
                                {release.status}
                              </Badge>
                              <span className="text-gray-500 text-xs">
                                {new Date(release.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {release.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleReleaseAction(release.id, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReleaseAction(release.id, 'reject', 'Quality issues')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
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

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                    User Management
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 bg-gray-800 border-gray-700 text-white"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUsers}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .filter(user => 
                      !searchTerm || 
                      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((user) => (
                      <div key={user.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{user.full_name || user.email}</h3>
                              <p className="text-gray-400 text-sm">{user.email}</p>
                              <p className="text-gray-500 text-xs">
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              Active
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-purple-400" />
                  Payout Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No payout requests found</p>
                    </div>
                  ) : (
                    payoutRequests.map((payout) => (
                      <div key={payout.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">${payout.amount.toFixed(2)}</h3>
                            <p className="text-gray-400 text-sm">Payment Method: {payout.payment_method}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge
                                variant={
                                  payout.status === 'approved' ? 'default' :
                                  payout.status === 'rejected' ? 'destructive' : 'secondary'
                                }
                              >
                                {payout.status}
                              </Badge>
                              <span className="text-gray-500 text-xs">
                                {new Date(payout.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {payout.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handlePayoutAction(payout.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handlePayoutAction(payout.id, 'rejected', 'Insufficient funds')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
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

          {/* Takedowns Tab */}
          <TabsContent value="takedowns" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                  Takedown Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {takedownRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No takedown requests found</p>
                    </div>
                  ) : (
                    takedownRequests.map((takedown) => (
                      <div key={takedown.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{takedown.title}</h3>
                            <p className="text-gray-400 text-sm">Artist: {takedown.artist}</p>
                            <p className="text-gray-400 text-sm">Complainant: {takedown.complainant}</p>
                            <p className="text-gray-500 text-xs mt-1">{takedown.reason}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="destructive">{takedown.status}</Badge>
                              <span className="text-gray-500 text-xs">
                                {new Date(takedown.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Take Down
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
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

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-yellow-400" />
                  Send Notification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">User Email</label>
                    <Input
                      placeholder="user@example.com"
                      value={notificationForm.user_id}
                      onChange={(e) => setNotificationForm({...notificationForm, user_id: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">Title</label>
                    <Input
                      placeholder="Notification title"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      placeholder="Notification message"
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">Type</label>
                    <Select 
                      value={notificationForm.type} 
                      onValueChange={(value: any) => setNotificationForm({...notificationForm, type: value})}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="release">Release</SelectItem>
                        <SelectItem value="payout">Payout</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={sendNotification}
                    disabled={sendingNotification}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingNotification ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
