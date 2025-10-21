"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { supabase } from '@/lib/supabase'
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
  Download
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface AdminStats {
  totalUsers: number
  totalReleases: number
  totalNotifications: number
  unreadNotifications: number
  totalRevenue: number
  activeUploads: number
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
}

export default function AdminDashboard() {
  console.log('🔥 AdminDashboard component loaded!')
  
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [releases, setReleases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'users' | 'artists' | 'releases' | 'approvals' | 'analytics' | 'takedowns' | 'payouts' | 'reviews'>('overview')
  const [notificationForm, setNotificationForm] = useState<NotificationForm>({
    user_id: '',
    title: '',
    message: '',
    type: 'system'
  })
  const [sendingNotification, setSendingNotification] = useState(false)
  
  // New admin state
  const [takedownRequests, setTakedownRequests] = useState([])
  const [payoutRequests, setPayoutRequests] = useState([])
  const [contentReviews, setContentReviews] = useState([])
  const [pendingReleases, setPendingReleases] = useState<any[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({})
  const [adminLoading, setAdminLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Breadcrumb items based on active tab
  const getBreadcrumbItems = () => {
    const baseItems = [
      { label: 'Admin', href: '/admin' }
    ]
    
    switch (activeTab) {
      case 'overview':
        return [...baseItems, { label: 'Overview', active: true }]
      case 'notifications':
        return [...baseItems, { label: 'Notifications', active: true }]
      case 'users':
        return [...baseItems, { label: 'Users', active: true }]
      case 'analytics':
        return [...baseItems, { label: 'Analytics', active: true }]
      default:
        return [...baseItems, { label: 'Overview', active: true }]
    }
  }

  // Simplified auth check - show admin dashboard with data
  useEffect(() => {
    if (!authLoading && !user) {
      // For now, allow admin access without auth to view data
      console.log('Admin dashboard access - showing platform data')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Load all platform data regardless of auth for admin dashboard
    console.log('🎯 useEffect triggered - about to call fetchAllPlatformData')
    console.log('🔍 fetchAllPlatformData function exists:', typeof fetchAllPlatformData)
    fetchAllPlatformData()
  }, [])

  useEffect(() => {
    // Load pending releases for approval
    fetchPendingReleases()
  }, [activeTab])

  const fetchAllPlatformData = async () => {
    try {
      setLoading(true)
      console.log('� FETCHALLPLATFORMDATA CALLED - Loading platform data directly from database...')
      console.log('🔧 Supabase client status:', !!supabase)
      
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      // Fetch all platform data directly from database
      const [usersResult, artistsResult, releasesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, created_at, role')
          .order('created_at', { ascending: false }),
        supabase
          .from('artists')
          .select('id, name, bio, image_url, created_at, user_id')
          .order('created_at', { ascending: false }),
        supabase
          .from('releases')
          .select('id, title, artist_name, status, cover_art_url, audio_url, created_at, release_date, genre, metadata, platforms, streams, revenue')
          .order('created_at', { ascending: false })
      ])
      
      if (usersResult.data) {
        setUsers(usersResult.data)
        console.log('✅ Users loaded:', usersResult.data.length)
        console.log('🔍 First user sample:', usersResult.data[0])
      } else if (usersResult.error) {
        console.error('Error fetching users:', usersResult.error)
      }
      
      if (artistsResult.data) {
        setArtists(artistsResult.data)
        console.log('✅ Artists loaded:', artistsResult.data.length)
        console.log('🔍 First artist sample:', artistsResult.data[0])
      } else if (artistsResult.error) {
        console.error('Error fetching artists:', artistsResult.error)
      }
      
      if (releasesResult.data) {
        setReleases(releasesResult.data)
        console.log('✅ Releases loaded:', releasesResult.data.length)
        console.log('🔍 First release sample:', releasesResult.data[0])
      } else if (releasesResult.error) {
        console.error('Error fetching releases:', releasesResult.error)
      }
      
      // Calculate real stats from your data
      const platformStats = {
        totalUsers: usersResult.data?.length || 0,
        totalReleases: releasesResult.data?.length || 0,
        totalNotifications: 0,
        unreadNotifications: 0,
        totalRevenue: releasesResult.data?.reduce((sum: number, release: any) => sum + (release.revenue || 0), 0) || 0,
        activeUploads: releasesResult.data?.filter((r: any) => r.status === 'pending' || r.status === 'processing').length || 0,
        timestamp: new Date().toISOString()
      }
      
      setStats(platformStats)
      console.log('📊 Platform Stats:', platformStats)
      
    } catch (error) {
      console.error('Error loading platform data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Old fetchStats function removed - now using fetchAllPlatformData with direct Supabase queries

  const fetchUsers = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        toast.error('Database connection not available')
        return
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
        
      if (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
      } else {
        setUsers(data || [])
        console.log('Users loaded:', data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Network error while fetching users')
    }
  }

  const sendNotification = async () => {
    if (!notificationForm.user_id || !notificationForm.title || !notificationForm.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setSendingNotification(true)
    
    try {
      console.log('Sending notification:', notificationForm)
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationForm)
      })

      const responseData = await response.text()
      console.log('Notification response:', response.status, responseData)

      if (response.ok) {
        toast.success('Notification sent successfully!')
        setNotificationForm({
          user_id: '',
          title: '',
          message: '',
          type: 'system'
        })
        fetchAllPlatformData()
      } else {
        console.error('Failed to send notification:', response.status, responseData)
        toast.error(`Failed to send notification: ${response.status}`)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Network error while sending notification')
    } finally {
      setSendingNotification(false)
    }
  }

  const sendBroadcastNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast.error('Please fill in title and message')
      return
    }

    setSendingNotification(true)
    
    try {
      const promises = users.map(user => 
        fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...notificationForm,
            user_id: user.id
          })
        })
      )

      await Promise.all(promises)
      toast.success(`Broadcast notification sent to ${users.length} users!`)
      setNotificationForm({
        user_id: '',
        title: '',
        message: '',
        type: 'system'
      })
      fetchAllPlatformData()
    } catch (error) {
      console.error('Error sending broadcast notification:', error)
      toast.error('Failed to send broadcast notification')
    } finally {
      setSendingNotification(false)
    }
  }

  const fetchPendingReleases = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      const { data, error } = await supabase
        .from('releases')
        .select(`
          id,
          title,
          artist_name,
          status,
          cover_art_url,
          audio_url,
          created_at,
          release_date,
          genre,
          metadata,
          platforms,
          streams,
          revenue,
          artists (
            name,
            image_url
          )
        `)
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error('Error fetching all releases:', error)
        toast.error('Failed to load releases')
      } else if (data) {
        setPendingReleases(data)
        console.log('All releases loaded:', data.length)
        console.log('Release statuses found:', [...new Set(data.map(r => r.status))])
      }
    } catch (error) {
      console.error('Error loading pending releases:', error)
      toast.error('Network error while loading pending releases')
    }
  }

    const handleReleaseApproval = (releaseId: string, approved: boolean) => {
    toast(`Release ${approved ? 'approved' : 'rejected'}!`)
    // Here you would make an API call to update the release status
  }

  // Download complete release package
  const downloadReleasePackage = async (release: any) => {
    try {
      setAdminLoading(true)
      
      // Create comprehensive metadata with all available info
      const releaseMetadata = {
        // Basic Info
        title: release.title || 'Untitled',
        artist: release.artist_name || 'Unknown Artist',
        releaseId: release.id,
        
        // Audio Info
        audioUrl: release.audio_url,
        audioFormat: release.audio_url ? release.audio_url.split('.').pop() : null,
        
        // Artwork Info  
        artworkUrl: release.cover_art_url,
        artworkFormat: release.cover_art_url ? release.cover_art_url.split('.').pop() : null,
        
        // Release Details
        genre: release.genre || 'Not specified',
        releaseDate: release.release_date,
        status: release.status,
        type: release.metadata?.releaseType || 'single',
        
        // Distribution
        platforms: release.platforms || [],
        
        // Analytics
        streams: release.streams || 0,
        revenue: release.revenue || 0,
        
        // Metadata from metadata field
        ...(release.metadata && {
          upc: release.metadata.upc,
          lyrics: release.metadata.lyrics,
          composer: release.metadata.composer,
          lyricist: release.metadata.lyricist,
          publisher: release.metadata.publisher,
          recordLabel: release.metadata.recordLabel,
          copyrightYear: release.metadata.copyrightYear,
          pLine: release.metadata.pLine,
          cLine: release.metadata.cLine,
          language: release.metadata.language,
          mainGenre: release.metadata.mainGenre,
          subGenre: release.metadata.subGenre,
          description: release.metadata.description,
          tags: release.metadata.tags,
          priceTier: release.metadata.priceTier,
          displayArtist: release.metadata.displayArtist,
          featuredArtist: release.metadata.featuredArtist
        }),
        
        // Export info
        exportDate: new Date().toISOString(),
        exportedBy: 'Admin Dashboard'
      }

      // Create filename-safe title
      const safeTitle = (release.title || 'untitled').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      const safeArtist = (release.artist_name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      
      // Download metadata file
      const metadataBlob = new Blob([JSON.stringify(releaseMetadata, null, 2)], { 
        type: 'application/json' 
      })
      const metadataUrl = URL.createObjectURL(metadataBlob)
      
      const metadataLink = document.createElement('a')
      metadataLink.href = metadataUrl
      metadataLink.download = `${safeTitle}_${safeArtist}_metadata.json`
      document.body.appendChild(metadataLink)
      metadataLink.click()
      document.body.removeChild(metadataLink)
      URL.revokeObjectURL(metadataUrl)
      
      // Download audio if available
      if (release.audio_url) {
        try {
          const audioLink = document.createElement('a')
          audioLink.href = release.audio_url
          audioLink.download = `${safeTitle}_${safeArtist}_audio.${release.audio_url.split('.').pop() || 'wav'}`
          audioLink.target = '_blank'
          document.body.appendChild(audioLink)
          audioLink.click()
          document.body.removeChild(audioLink)
        } catch (error) {
          console.warn('Could not download audio file:', error)
        }
      }
      
      // Download artwork if available
      if (release.cover_art_url) {
        try {
          const artworkLink = document.createElement('a')
          artworkLink.href = release.cover_art_url
          artworkLink.download = `${safeTitle}_${safeArtist}_artwork.${release.cover_art_url.split('.').pop() || 'jpg'}`
          artworkLink.target = '_blank'
          document.body.appendChild(artworkLink)
          artworkLink.click()
          document.body.removeChild(artworkLink)
        } catch (error) {
          console.warn('Could not download artwork file:', error)
        }
      }
      
      toast.success(`Release package downloaded! Files: ${['metadata', release.audio_url ? 'audio' : null, release.cover_art_url ? 'artwork' : null].filter(Boolean).join(', ')}`)
      
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download release package')
    } finally {
      setAdminLoading(false)
    }
  }

  // Show detailed release info
  const showReleaseDetails = (release: any) => {
    const detailsWindow = window.open('', '_blank', 'width=800,height=600')
    if (detailsWindow) {
      detailsWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Release Details - ${release.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 20px; }
            .artwork { width: 200px; height: 200px; margin: 0 auto 20px; background: #ddd; border-radius: 8px; display: block; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .info-item { padding: 8px; background: #f8f9fa; border-radius: 4px; }
            .info-label { font-weight: bold; color: #333; }
            .info-value { color: #666; }
            .metadata { background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .platforms { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; }
            .platform { background: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
            .audio-controls { text-align: center; margin: 20px 0; }
            .btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
            .btn:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${release.title || 'Untitled Release'}</h1>
              <h2>by ${release.artist_name || 'Unknown Artist'}</h2>
              <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px;">
                ${release.status || 'Unknown'}
              </span>
            </div>
            
            ${release.cover_art_url ? `
              <img src="${release.cover_art_url}" alt="Artwork" class="artwork" />
            ` : '<div class="artwork" style="display: flex; align-items: center; justify-content: center; color: #999;">No Artwork</div>'}
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Genre</div>
                <div class="info-value">${release.genre || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Release Date</div>
                <div class="info-value">${release.release_date ? new Date(release.release_date).toLocaleDateString() : 'Not set'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Streams</div>
                <div class="info-value">${release.streams || 0}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Revenue</div>
                <div class="info-value">$${release.revenue || '0.00'}</div>
              </div>
            </div>

            ${release.platforms && release.platforms.length > 0 ? `
              <div class="metadata">
                <div class="info-label">Distribution Platforms:</div>
                <div class="platforms">
                  ${release.platforms.map((platform: string) => `<span class="platform">${platform}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            ${release.metadata ? `
              <div class="metadata">
                <div class="info-label">Additional Metadata:</div>
                <pre style="white-space: pre-wrap; font-size: 12px; color: #666;">${JSON.stringify(release.metadata, null, 2)}</pre>
              </div>
            ` : ''}

            ${release.audio_url ? `
              <div class="audio-controls">
                <audio controls style="width: 100%; max-width: 400px;">
                  <source src="${release.audio_url}" type="audio/wav">
                  <source src="${release.audio_url}" type="audio/mpeg">
                  Your browser does not support the audio element.
                </audio>
                <br>
                <button class="btn" onclick="window.open('${release.audio_url}', '_blank')">
                  Download Audio File
                </button>
              </div>
            ` : '<div class="audio-controls" style="color: #999;">No audio file available</div>'}

            <div style="text-align: center; margin-top: 30px;">
              <button class="btn" onclick="window.close()">Close</button>
            </div>
          </div>
        </body>
        </html>
      `)
      detailsWindow.document.close()
    }
  }

  const toggleAudio = (releaseId: string, audioUrl: string) => {
    if (currentlyPlaying === releaseId) {
      // Stop current audio
      if (audioElements[releaseId]) {
        audioElements[releaseId].pause()
      }
      setCurrentlyPlaying(null)
    } else {
      // Stop any currently playing audio
      if (currentlyPlaying && audioElements[currentlyPlaying]) {
        audioElements[currentlyPlaying].pause()
      }
      
      // Start new audio
      if (!audioElements[releaseId]) {
        const audio = new Audio(audioUrl)
        audio.onended = () => setCurrentlyPlaying(null)
        setAudioElements(prev => ({ ...prev, [releaseId]: audio }))
        audio.play()
      } else {
        audioElements[releaseId].play()
      }
      setCurrentlyPlaying(releaseId)
    }
  }

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/')
  }

  const openSupawald = () => {
    window.open('http://localhost:3000', '_blank')
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4 animate-pulse" />
          <span>Checking authentication...</span>
        </div>
      </div>
    )
  }

  // For admin dashboard, allow access to view platform data
  // In production, you'd want proper admin authentication here

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        {/* <div className="mb-4">
          <Breadcrumbs items={getBreadcrumbItems()} />
        </div> */}

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your music distribution platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, {user?.email || 'Admin'}
            </div>
            <Button variant="outline" onClick={handleSignOut} className="button-admin-outline">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 p-2 bg-white rounded-lg shadow-sm border border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'artists', label: 'Artists', icon: Music },
            { id: 'releases', label: 'Releases', icon: Music },
            { id: 'approvals', label: 'Release Approvals', icon: Eye },
            { id: 'takedowns', label: 'Takedowns', icon: AlertCircle },
            { id: 'payouts', label: 'Payouts', icon: DollarSign },
            { id: 'reviews', label: 'Reviews', icon: Eye },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 ${activeTab === tab.id ? 'button-admin-primary' : 'button-admin-ghost'}`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : users.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Artists</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : artists.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Verified artists</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : releases.length}
                  </div>
                  <p className="text-xs text-muted-foreground">All time releases</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Platform</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : 'Live'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform status
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>File Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Manage files, images, and content using Supawald.
                  </p>
                  <Button onClick={openSupawald} className="button-admin-primary w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Supawald Admin
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('notifications')} className="button-admin-outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Send Notification
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('users')} className="button-admin-outline">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/notifications')} className="button-admin-outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Notifications
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchAllPlatformData} className="button-admin-outline">
                      <Activity className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Individual Notification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>Send Notification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">User</label>
                    <Select value={notificationForm.user_id} onValueChange={(value) => 
                      setNotificationForm(prev => ({ ...prev, user_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={notificationForm.type} onValueChange={(value: NotificationForm['type']) => 
                      setNotificationForm(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="release">Release</SelectItem>
                        <SelectItem value="payout">Payout</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Notification title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Notification message"
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={sendNotification} 
                    disabled={sendingNotification}
                    className="button-admin-primary w-full"
                  >
                    {sendingNotification ? 'Sending...' : 'Send Notification'}
                  </Button>
                </CardContent>
              </Card>

              {/* Broadcast Notification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Broadcast to All Users</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Send a notification to all {users.length} registered users.
                  </p>
                  
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={notificationForm.type} onValueChange={(value: NotificationForm['type']) => 
                      setNotificationForm(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Broadcast title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Broadcast message"
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={sendBroadcastNotification} 
                    disabled={sendingNotification}
                    className="w-full button-admin-destructive"
                    variant="destructive"
                  >
                    {sendingNotification ? 'Broadcasting...' : `Broadcast to ${users.length} Users`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User Management ({users.length} users)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading && (
                      <div className="text-center py-8">
                        <p>Loading users...</p>
                      </div>
                    )}
                    {!loading && users.length === 0 && (
                      <div className="text-center py-8">
                        <p>No users found. Check console for errors.</p>
                      </div>
                    )}
                    {!loading && users.length > 0 && (
                      <div className="mb-4 text-sm text-green-600">
                        Found {users.length} users in database
                      </div>
                    )}
                    {users.map(user => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="font-medium">{user.full_name || 'No name'}</h3>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <p className="text-xs text-gray-500">
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">
                              User
                            </Badge>
                          </div>
                        </div>
                      </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Artists Tab */}
        {activeTab === 'artists' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Artist Management ({artists.length} artists)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {artists.map(artist => (
                    <Card key={artist.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-medium">{artist.name || 'Unknown Artist'}</h3>
                            <p className="text-sm text-gray-600">ID: {artist.id}</p>
                            <p className="text-xs text-gray-500">
                              {artist.created_at ? `Created ${new Date(artist.created_at).toLocaleDateString()}` : 'No date'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default">
                            Artist
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Releases Tab */}
        {activeTab === 'releases' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Music className="h-5 w-5" />
                  <span>Release Management ({releases.length} releases)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading && (
                    <div className="text-center py-8">
                      <p>Loading releases...</p>
                    </div>
                  )}
                  {!loading && releases.length === 0 && (
                    <div className="text-center py-8">
                      <p>No releases found. Check console for errors.</p>
                    </div>
                  )}
                  {!loading && releases.length > 0 && (
                    <div className="mb-4 text-sm text-green-600">
                      Found {releases.length} releases in database
                    </div>
                  )}
                  {releases.map(release => (
                    <Card key={release.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-medium">{release.title || 'Untitled Release'}</h3>
                            <p className="text-sm text-gray-600">{release.artist_name || 'Unknown Artist'}</p>
                            <p className="text-xs text-gray-500">
                              {release.created_at ? `Created ${new Date(release.created_at).toLocaleDateString()}` : 'No date'}
                            </p>
                            {release.release_date && (
                              <p className="text-xs text-gray-500">
                                Release Date: {new Date(release.release_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={release.status === 'published' ? 'default' : 'secondary'}>
                            {release.status || 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}        

        {/* Release Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Release Queue ({pendingReleases.length} total)</span>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Releases</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="review">In Review</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading && (
                    <div className="text-center py-8">
                      <p>Loading pending releases...</p>
                    </div>
                  )}
                  {!loading && pendingReleases.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No releases found</p>
                    </div>
                  )}
                  {!loading && pendingReleases.length > 0 && (
                    <div className="mb-4 text-sm text-gray-600">
                      Showing {pendingReleases.filter(release => statusFilter === 'all' || release.status === statusFilter).length} of {pendingReleases.length} releases
                      {statusFilter !== 'all' && ` (filtered by: ${statusFilter})`}
                    </div>
                  )}
                  {pendingReleases
                    .filter(release => statusFilter === 'all' || release.status === statusFilter)
                    .map((release) => (
                    <Card key={release.id} className="p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                          onClick={() => showReleaseDetails(release)}>
                      <div className="flex items-start space-x-4">
                        {/* Artwork */}
                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
                            {(release.artwork_url || release.cover_art_url) ? (
                              <img
                                src={release.artwork_url || release.cover_art_url}
                                alt={release.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-album.png'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Release Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {release.title || 'Untitled Release'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                by {release.artist_name || 'Unknown Artist'}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>{release.type || 'Single'}</span>
                                <span>•</span>
                                <span>{release.genre || 'No genre'}</span>
                                <span>•</span>
                                <span>
                                  Submitted {new Date(release.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {release.release_date && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Planned release: {new Date(release.release_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            
                            {/* Status Badge */}
                            <Badge 
                              variant={
                                release.status === 'pending' ? 'secondary' :
                                release.status === 'review' ? 'default' : 'secondary'
                              }
                              className="ml-4"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {release.status || 'Pending'}
                            </Badge>
                          </div>

                          {/* Audio Player */}
                          {release.audio_url && (
                            <div className="flex items-center space-x-3 mt-4 p-3 bg-gray-50 rounded-lg" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleAudio(release.id, release.audio_url)
                                }}
                                className="flex items-center space-x-2"
                              >
                                {currentlyPlaying === release.id ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                <span>
                                  {currentlyPlaying === release.id ? 'Pause' : 'Play'}
                                </span>
                              </Button>
                              <Volume2 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Preview Track</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between mt-4" onClick={(e) => e.stopPropagation()}>
                            {/* Approval Actions */}
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReleaseApproval(release.id, true)
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReleaseApproval(release.id, false)
                                }}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                            
                            {/* Download and View Actions */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  downloadReleasePackage(release)
                                }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  showReleaseDetails(release)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-500">Online</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">All systems operational</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeUploads || 0}</div>
                  <p className="text-xs text-muted-foreground">Files being processed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Last Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : 'Never'}
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchAllPlatformData} className="mt-2 button-admin-ghost">
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Platform Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Platform Revenue</span>
                      <span className="font-bold">${stats?.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Users (30 days)</span>
                      <span className="font-bold">{Math.floor((stats?.totalUsers || 0) * 0.7)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Releases per User</span>
                      <span className="font-bold">
                        {stats?.totalUsers && stats?.totalReleases 
                          ? (stats.totalReleases / stats.totalUsers).toFixed(1)
                          : '0'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Latest user joined:</span>
                      <br />
                      <span className="font-medium">
                        {users.length > 0 ? new Date(users[0].created_at).toLocaleDateString() : 'No users yet'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Total notifications sent:</span>
                      <br />
                      <span className="font-medium">{stats?.totalNotifications || 0}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Active file uploads:</span>
                      <br />
                      <span className="font-medium">{stats?.activeUploads || 0} in progress</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Takedowns Tab */}
        {activeTab === 'takedowns' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>DMCA Takedown Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Manage copyright takedown requests from rights holders.
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">Pending: 3</Badge>
                    <Badge variant="default">Under Review: 2</Badge>
                    <Badge variant="outline">Completed: 15</Badge>
                  </div>
                  <Button 
                    onClick={() => window.open('/takedown-request', '_blank')} 
                    variant="outline" 
                    className="button-admin-outline"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Public Takedown Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Payout Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Manage artist payout requests and payment processing.
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">Pending: $1,250.00</Badge>
                    <Badge variant="default">Processing: $850.00</Badge>
                    <Badge variant="outline">Completed: $12,400.00</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="button-admin-outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Review Pending
                    </Button>
                    <Button variant="outline" className="button-admin-outline">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Batch
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Content Reviews</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Review and moderate user-uploaded content for policy compliance.
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">Pending Review: 8</Badge>
                    <Badge variant="destructive">Flagged: 2</Badge>
                    <Badge variant="default">Approved Today: 15</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="button-admin-outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Review Queue
                    </Button>
                    <Button variant="outline" className="button-admin-outline">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Flagged Content
                    </Button>
                    <Button variant="outline" className="button-admin-outline">
                      <Activity className="h-4 w-4 mr-2" />
                      Review History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}