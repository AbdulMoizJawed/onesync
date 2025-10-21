"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { Profile, getDisplayName } from "@/lib/utils"

type ActiveMember = {
  id: string
  profile: Profile
  lastSeen: Date
}

export function ActiveMembersCard({ className = "" }: { className?: string }) {
  const { user } = useAuth()
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchActiveMembers()
      const interval = setInterval(fetchActiveMembers, 60000) // Update every minute
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchActiveMembers = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    try {
      // Get users with active sessions (last 5 minutes)
      const fiveMinutesAgo = new Date()
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

      // Check for users who have been active in the last 5 minutes
      const { data: activeSessions } = await supabase
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, bio, created_at, updated_at")
        .gte("updated_at", fiveMinutesAgo.toISOString())
        .neq("id", user?.id || "") // Exclude current user
        .limit(10)

      // If we don't have enough active users, look for recent forum activity (last 15 minutes)
      let additionalActiveUsers: any[] = []
      if (!activeSessions || activeSessions.length < 3) {
        const fifteenMinutesAgo = new Date()
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)

        const { data: recentActivity } = await supabase
          .from("forum_posts")
          .select(`
            user_id,
            profiles:user_id (id, email, full_name, username, avatar_url, bio, created_at, updated_at)
          `)
          .gte("created_at", fifteenMinutesAgo.toISOString())
          .neq("user_id", user?.id || "")
          .limit(5)

        additionalActiveUsers = recentActivity?.map(item => item.profiles).filter(Boolean) || []
      }

      // Combine active sessions and recent activity users, remove duplicates
      const allActiveUsers = [...(activeSessions || []), ...additionalActiveUsers]
      const uniqueUsers = allActiveUsers.reduce((acc: any[], current: any) => {
        const exists = acc.find((item: any) => item.id === current.id)
        if (!exists) {
          acc.push(current)
        }
        return acc
      }, [] as any[])

      // Create active members array with only truly active users
      const activeMembers: ActiveMember[] = uniqueUsers.slice(0, 8).map((profile: any) => ({
        id: profile.id,
        profile: {
          ...profile,
          email: profile.email || '',
          bio: profile.bio || null,
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        },
        lastSeen: new Date(profile.updated_at || new Date()),
      }))

      setActiveMembers(activeMembers)
    } catch (error) {
      console.error("Error fetching active members:", error)
    } finally {
      setLoading(false)
    }
  }

  if (activeMembers.length === 0 && !loading) {
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
