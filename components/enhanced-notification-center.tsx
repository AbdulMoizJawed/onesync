"use client"

import React, { useState, useEffect } from "react"
import { useAuth, supabase } from "@/lib/auth"
import { hasValidSupabaseConfig } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, X, Info, CheckCircle, AlertTriangle, AlertCircle, MessageSquare, Headphones, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "forum" | "marketplace" | "support" | "system"
  read: boolean
  action_url: string | null
  created_at: string
  category?: string
  metadata?: Record<string, any>
}

export function EnhancedNotificationCenter() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Helper function to validate UUID
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  useEffect(() => {
    if (user && user.id && isValidUUID(user.id) && hasValidSupabaseConfig() && supabase) {
      fetchNotifications()
      // Set up real-time subscription
      const subscription = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications()
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user || !user.id || !isValidUUID(user.id) || !hasValidSupabaseConfig() || !supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter((n) => !n.read).length || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user || !user.id || !isValidUUID(user.id) || !hasValidSupabaseConfig() || !supabase) return

    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user || !user.id || !isValidUUID(user.id) || !hasValidSupabaseConfig() || !supabase) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!hasValidSupabaseConfig() || !supabase) return

    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === notificationId)
        return notification && !notification.read ? prev - 1 : prev
      })
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Handle routing based on notification type and action_url
    if (notification.action_url) {
      router.push(notification.action_url)
    } else {
      // Default routing based on type
      switch (notification.type) {
        case "forum":
          router.push("/forum")
          break
        case "marketplace":
          router.push("/beats")
          break
        case "support":
          router.push("/support")
          break
        default:
          // No default action
          break
      }
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case "forum":
        return <MessageSquare className="w-5 h-5 text-blue-400" />
      case "marketplace":
        return <Headphones className="w-5 h-5 text-purple-400" />
      case "support":
        return <Settings className="w-5 h-5 text-orange-400" />
      case "system":
        return <Bell className="w-5 h-5 text-gray-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white h-10 w-10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-96 dropdown-content" align="end">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white font-montserrat">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[60vh] sm:h-96">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1 text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-indigo-500/5 border-l-2 border-indigo-500" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium leading-snug ${!notification.read ? "text-white" : "text-gray-300"}`}>
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="h-7 w-7 p-0 text-gray-500 hover:text-red-400 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            className="h-6 px-2 text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
