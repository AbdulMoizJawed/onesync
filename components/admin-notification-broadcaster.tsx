"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth"
import { supabase, hasValidSupabaseConfig } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Send, Users, MessageSquare, Headphones, Settings, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react"

interface NotificationBroadcast {
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "forum" | "marketplace" | "support" | "system"
  action_url?: string
  targetUsers: "all" | "specific" | "role"
  specificUserIds?: string[]
  roleFilter?: string
}

export function AdminNotificationBroadcaster() {
  const { user } = useAuth()
  const [broadcast, setBroadcast] = useState<NotificationBroadcast>({
    title: "",
    message: "",
    type: "info",
    action_url: "",
    targetUsers: "all"
  })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Check if user is admin
  const rawEmail = user?.email || ''
  const email = rawEmail.trim().toLowerCase()
  const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  const isAdmin = !!email && (email.endsWith('@onesync.music') || allowlist.includes(email))

  const handleSendBroadcast = async () => {
    if (!user || !isAdmin || !hasValidSupabaseConfig() || !supabase) {
      setError("Unauthorized: Admin access required")
      return
    }

    if (!broadcast.title.trim() || !broadcast.message.trim()) {
      setError("Please fill in both title and message")
      return
    }

    setSending(true)
    setError("")
    setSuccess(false)

    try {
      let targetUserIds: string[] = []

      if (broadcast.targetUsers === "all") {
        // Get all user IDs
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("id")

        if (usersError) throw usersError
        targetUserIds = users?.map(u => u.id) || []
      } else if (broadcast.targetUsers === "specific" && broadcast.specificUserIds) {
        targetUserIds = broadcast.specificUserIds
      }

      // Create notifications for all target users
      const notifications = targetUserIds.map(userId => ({
        user_id: userId,
        title: broadcast.title,
        message: broadcast.message,
        type: broadcast.type,
        action_url: broadcast.action_url || null,
        read: false,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications)

      if (insertError) throw insertError

      setSuccess(true)
      // Reset form
      setBroadcast({
        title: "",
        message: "",
        type: "info",
        action_url: "",
        targetUsers: "all"
      })

      // Auto-hide success message
      setTimeout(() => setSuccess(false), 5000)

    } catch (err: any) {
      setError(err.message || "Failed to send broadcast")
    } finally {
      setSending(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case "forum":
        return <MessageSquare className="w-4 h-4 text-blue-400" />
      case "marketplace":
        return <Headphones className="w-4 h-4 text-purple-400" />
      case "support":
        return <Settings className="w-4 h-4 text-orange-400" />
      case "system":
        return <Bell className="w-4 h-4 text-gray-400" />
      default:
        return <Info className="w-4 h-4 text-blue-400" />
    }
  }

  if (!isAdmin) {
    return (
      <Alert className="border-red-500/30 bg-red-900/20">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-300">
          Access denied. Admin privileges required to broadcast notifications.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="card-dark">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-400" />
          Notification Broadcaster
        </CardTitle>
        <CardDescription className="text-gray-400">
          Send notifications to users across the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <Alert className="border-green-500/30 bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              Broadcast sent successfully to all target users!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-500/30 bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-200">
                Notification Title
              </Label>
              <Input
                id="title"
                value={broadcast.title}
                onChange={(e) => setBroadcast(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notification title"
                className="bg-gray-800/50 border-gray-700 text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-200">
                Message
              </Label>
              <Textarea
                id="message"
                value={broadcast.message}
                onChange={(e) => setBroadcast(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter notification message"
                className="bg-gray-800/50 border-gray-700 text-gray-100 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-200">
                Notification Type
              </Label>
              <Select value={broadcast.type} onValueChange={(value: any) => setBroadcast(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Success
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      Error
                    </div>
                  </SelectItem>
                  <SelectItem value="forum">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      Forum
                    </div>
                  </SelectItem>
                  <SelectItem value="marketplace">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-purple-400" />
                      Marketplace
                    </div>
                  </SelectItem>
                  <SelectItem value="support">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-orange-400" />
                      Support
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-400" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action_url" className="text-gray-200">
                Action URL (Optional)
              </Label>
              <Input
                id="action_url"
                value={broadcast.action_url}
                onChange={(e) => setBroadcast(prev => ({ ...prev, action_url: e.target.value }))}
                placeholder="/path/to/page"
                className="bg-gray-800/50 border-gray-700 text-gray-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Target Audience</Label>
              <Select value={broadcast.targetUsers} onValueChange={(value: any) => setBroadcast(prev => ({ ...prev, targetUsers: value }))}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      All Users
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Specific Users
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-gray-200">Preview</Label>
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(broadcast.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white">
                      {broadcast.title || "Notification Title"}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {broadcast.message || "Notification message will appear here"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSendBroadcast}
          disabled={sending || !broadcast.title.trim() || !broadcast.message.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {sending ? (
            <>
              <Bell className="w-4 h-4 mr-2 animate-pulse" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Broadcast
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
