"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { Profile, getDisplayName } from "@/lib/utils"
import type { RealtimeChannel } from '@supabase/supabase-js'

type ActiveMember = {
  id: string
  profile: Profile
  lastSeen: Date
}

export function ActiveMembersCard({ className = "" }: { className?: string }) {
  const { user } = useAuth()
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActiveMembers = useCallback(async () => {
    console.log("🔍 [ActiveMembersCard] Fetching active members...")
    
    if (!supabase || !user) {
      console.log("⚠️ [ActiveMembersCard] No supabase or user")
      setLoading(false)
      return
    }
    
    try {
      // Consider users active if they've been seen in the last 15 seconds
      const fifteenSecondsAgo = new Date()
      fifteenSecondsAgo.setSeconds(fifteenSecondsAgo.getSeconds() - 15)

      console.log("⏰ [ActiveMembersCard] Query parameters:", {
        currentTime: new Date().toISOString(),
        cutoffTime: fifteenSecondsAgo.toISOString(),
        excludeUserId: user.id
      })

      const { data: activeUsers, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, bio, created_at, updated_at, last_seen")
        .gte("last_seen", fifteenSecondsAgo.toISOString())
        .neq("id", user.id)
        .order("last_seen", { ascending: false })
        .limit(10)

      if (error) {
        console.error("❌ [ActiveMembersCard] Query error:", error)
        throw error
      }

      console.log("📊 [ActiveMembersCard] Query results:", {
        foundUsers: activeUsers?.length || 0,
        users: activeUsers
      })

      const activeMembers: ActiveMember[] = (activeUsers || []).map((profile: any) => ({
        id: profile.id,
        profile: {
          ...profile,
          email: profile.email || '',
          bio: profile.bio || null,
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        },
        lastSeen: new Date(profile.last_seen || new Date()),
      }))

      console.log("✅ [ActiveMembersCard] Setting active members:", activeMembers.length)
      setActiveMembers(activeMembers)
    } catch (error) {
      console.error("💥 [ActiveMembersCard] Error fetching active members:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    console.log("🎯 [ActiveMembersCard] Component mounted, user:", user?.id)
    
    if (!user || !supabase) {
      console.log("⚠️ [ActiveMembersCard] No user or supabase")
      return
    }

    // Initial fetch
    fetchActiveMembers()
    
    // Fetch active members every 5 seconds
    console.log("⏰ [ActiveMembersCard] Starting fetch interval (5s)")
    const fetchInterval = setInterval(() => {
      console.log("🔄 [ActiveMembersCard] Auto-fetching active members...")
      fetchActiveMembers()
    }, 10000)

    // Subscribe to realtime changes
    console.log("🔌 [ActiveMembersCard] Setting up realtime subscription...")
    const channel: RealtimeChannel = supabase
      .channel('active-members')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log("📡 [ActiveMembersCard] Realtime update received:", payload)
          fetchActiveMembers()
        }
      )
      .subscribe((status) => {
        console.log("🔌 [ActiveMembersCard] Subscription status:", status)
      })

    // Cleanup
    return () => {
      console.log("🧹 [ActiveMembersCard] Cleaning up...")
      clearInterval(fetchInterval)
      supabase.removeChannel(channel)
    }
  }, [user, fetchActiveMembers])

  if (activeMembers.length === 0 && !loading) {
    console.log("🚫 [ActiveMembersCard] No active members, hiding component")
    return null
  }

  return (
    <Card className={`card-dark border-gray-700/50 shadow-lg ${className}`}>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-sm">Active Members</span>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {activeMembers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {activeMembers.map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-1" title={getDisplayName(member.profile)}>
                <Avatar className="w-10 h-10 border-2 border-gray-800 hover:border-purple-500 transition-all duration-200">
                  <AvatarImage src={member.profile.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                    {getDisplayName(member.profile)[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-400 truncate max-w-[60px]">
                  {getDisplayName(member.profile).split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}