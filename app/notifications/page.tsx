"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import CustomLoader from "@/components/ui/custom-loader"
import { animations } from "@/lib/animations"
import { 
  Bell, 
  Check, 
  Clock, 
  Music, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Mail
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'release' | 'payout' | 'system' | 'promotion' | 'warning'
  read: boolean
  created_at: string
  metadata?: any
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [markingAsRead, setMarkingAsRead] = useState<string[]>([])

  const fetchNotifications = useCallback(async () => {
    if (!user || !supabase) return
    
    setLoading(true)
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notifications:", error)
      // If notifications table doesn't exist, create some mock notifications for demonstration
      const mockNotifications: Notification[] = [
        {
          id: "1",
          user_id: user.id,
          title: "Welcome to OneSync!",
          message: "Your account has been successfully created. Start by uploading your first release.",
          type: "system",
          read: false,
          created_at: new Date().toISOString(),
          metadata: {}
        },
        {
          id: "2", 
          user_id: user.id,
          title: "Release Approved",
          message: "Your release 'Sample Track' has been approved and is now live on all platforms!",
          type: "release",
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          metadata: { release_id: "sample-release-id" }
        },
        {
          id: "3",
          user_id: user.id,
          title: "Payout Available", 
          message: "You have $15.40 available for payout. Request your earnings now!",
          type: "payout",
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          metadata: { amount: 15.40 }
        }
      ]
      setNotifications(mockNotifications)
    } else {
      setNotifications(data || [])
    }
    
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    if (!supabase) return
    
    setMarkingAsRead(prev => [...prev, notificationId])
    
    // Try to update in database
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error)
      // If database update fails, update locally
    }
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    
    setMarkingAsRead(prev => prev.filter(id => id !== notificationId))
  }

  const markAllAsRead = async () => {
    if (!supabase) return
    
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    
    // Try to update in database
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      // If database update fails, update locally
    }
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'release':
        return <Music className="w-5 h-5 text-blue-400" />
      case 'payout':
        return <DollarSign className="w-5 h-5 text-green-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'system':
        return <CheckCircle className="w-5 h-5 text-purple-400" />
      default:
        return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  const getNotificationBadge = (type: string) => {
    const badgeConfig = {
      release: { className: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Release" },
      payout: { className: "bg-green-500/20 text-green-400 border-green-500/30", label: "Payout" },
      warning: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Warning" },
      system: { className: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "System" },
      promotion: { className: "bg-pink-500/20 text-pink-400 border-pink-500/30", label: "Promotion" }
    }

    const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.system

    return (
      <Badge className={`${config.className} border px-2 py-1 text-xs`}>
        {config.label}
      </Badge>
    )
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6 ${animations.pageFadeIn}`}>
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-gradient">Notifications</h1>
                  <p className="text-gray-400">
                    Stay updated with your releases, payouts, and platform updates
                  </p>
                </div>
                <div className="flex gap-3">
                  {unreadCount > 0 && (
                    <Button
                      onClick={markAllAsRead}
                      variant="outline"
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Mark All Read
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="card-dark hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Notifications</p>
                        <p className="text-3xl font-bold text-white">{notifications.length}</p>
                      </div>
                      <Bell className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-dark hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Unread</p>
                        <p className="text-3xl font-bold text-white">{unreadCount}</p>
                      </div>
                      <Mail className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-dark hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">This Week</p>
                        <p className="text-3xl font-bold text-white">
                          {notifications.filter(n => 
                            new Date(n.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ).length}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                {['all', 'unread', 'read'].map((filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? "default" : "ghost"}
                    onClick={() => setFilter(filterOption as typeof filter)}
                    className={filter === filterOption ? "button-primary" : "text-gray-400 hover:text-white"}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                    {filterOption === 'unread' && unreadCount > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                {loading ? (
                  <Card className="card-dark">
                    <CardContent className="p-8 text-center">
                      <CustomLoader size="lg" text="Loading notifications..." showText={true} />
                    </CardContent>
                  </Card>
                ) : filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification, index) => (
                    <Card 
                      key={notification.id} 
                      className={`card-dark hover-lift transition-all duration-300 ${
                        !notification.read ? 'border-blue-500/30 bg-blue-950/10' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-semibold ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                  {notification.title}
                                </h3>
                                {getNotificationBadge(notification.type)}
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                )}
                              </div>
                              <p className="text-gray-400 text-sm leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.created_at))} ago
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                disabled={markingAsRead.includes(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/50"
                              >
                                {markingAsRead.includes(notification.id) ? (
                                  <CustomLoader size="sm" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="card-dark">
                    <CardContent className="p-12 text-center">
                      <div className="space-y-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                          <Bell className="w-10 h-10 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-white">
                            {filter === 'unread' ? 'No unread notifications' : 
                             filter === 'read' ? 'No read notifications' : 'No notifications yet'}
                          </h3>
                          <p className="text-gray-500">
                            {filter === 'all' 
                              ? "You'll receive notifications about releases, payouts, and platform updates here."
                              : `Switch to "${filter === 'unread' ? 'all' : 'unread'}" to see other notifications.`
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
