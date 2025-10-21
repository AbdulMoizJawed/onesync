"use client"

import { useState, useEffect } from "react"
import { useAuth, supabase } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Users, Search, Plus, X } from "lucide-react"
import { Profile, getDisplayName } from "@/lib/utils"
import Link from "next/link"

type OnlineUser = {
  id: string
  profile: Profile
  lastSeen: Date
}

export function MessagingSidebar() {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(true) // Default to open
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchOnlineUsers()
      const interval = setInterval(fetchOnlineUsers, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchOnlineUsers = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const fifteenMinutesAgo = new Date()
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)

      // Try to get recent activity, but handle potential schema issues gracefully
      let activeUserIds = new Set<string>()

      try {
        const { data: recentPosts } = await supabase
          .from("forum_posts")
          .select("user_id")
          .gte("created_at", fifteenMinutesAgo.toISOString())
          .limit(20)

        if (recentPosts) {
          recentPosts.forEach(p => p.user_id && activeUserIds.add(p.user_id))
        }
      } catch (postsError) {
        console.warn("Could not fetch recent posts:", postsError)
      }

      try {
        const { data: recentComments } = await supabase
          .from("forum_comments")
          .select("author_id")
          .gte("created_at", fifteenMinutesAgo.toISOString())
          .limit(20)

        if (recentComments) {
          recentComments.forEach(c => c.author_id && activeUserIds.add(c.author_id))
        }
      } catch (commentsError) {
        console.warn("Could not fetch recent comments:", commentsError)
      }

      // Always show some users - get recent profiles if no activity
      if (activeUserIds.size < 3) {
        try {
          const { data: recentProfiles } = await supabase
            .from("profiles")
            .select("id")
            .not("username", "is", null)
            .order("created_at", { ascending: false })
            .limit(5)

          if (recentProfiles) {
            recentProfiles.forEach(p => activeUserIds.add(p.id))
          }
        } catch (profilesError) {
          console.warn("Could not fetch recent profiles:", profilesError)
        }
      }

      // Exclude current user from the list
      if (user?.id) {
        activeUserIds.delete(user.id)
      }

      if (activeUserIds.size === 0) {
        setOnlineUsers([])
        setLoading(false)
        return
      }

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, bio, created_at, updated_at")
        .in("id", Array.from(activeUserIds))
        .limit(10)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        setOnlineUsers([])
        return
      }

      const onlineUsersData: OnlineUser[] = (profiles || []).map((profile) => ({
        id: profile.id,
        profile: {
          ...profile,
          email: profile.email || '',
          bio: profile.bio || null,
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        },
        lastSeen: new Date(),
      }))

      setOnlineUsers(onlineUsersData)
    } catch (error) {
      console.error("Error fetching online users:", error)
      setOnlineUsers([]) // Set empty array on error to prevent crashes
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = onlineUsers.filter((user) =>
    getDisplayName(user.profile).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className={`bg-gray-900 border-l border-gray-800 transition-all duration-300 shadow-lg hidden md:block ${isExpanded ? "w-72 sm:w-80" : "w-14 sm:w-16"} ${isExpanded ? "fixed inset-y-0 right-0 z-50 md:relative md:inset-auto md:z-auto" : ""}`}>
      <div className="p-2 sm:p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-center text-gray-400 hover:text-white h-8 sm:h-auto bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800 transition-all"
        >
          {isExpanded ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Users className="w-4 h-4 sm:w-5 sm:h-5" />}
          {!isExpanded && <span className="sr-only">Active Members</span>}
        </Button>
      </div>

      {isExpanded && (
        <>
          {/* Mobile overlay backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsExpanded(false)} />
          
          <div className="px-3 sm:px-4 pb-4 space-y-3 sm:space-y-4 relative z-50">
            <Card className="card-dark border-gray-700/50 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Active Members</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {onlineUsers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 pt-0">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-9 h-8 bg-gray-800 border-gray-700 text-white text-xs sm:text-sm"
                  />
                </div>

                <ScrollArea className="h-48 sm:h-64">
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700 rounded-full animate-pulse"></div>
                          <div className="flex-1 h-3 sm:h-4 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-3 sm:py-4">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs">{searchTerm ? "No members found" : "No active members"}</p>
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((onlineUser) => (
                      <Link
                        key={onlineUser.id}
                        href={`/profile/${onlineUser.profile.username || onlineUser.id}`}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-800 cursor-pointer transition-colors block"
                      >
                        <div className="relative">
                          <Avatar className="w-8 h-8 border-2 border-gray-800">
                            <AvatarImage src={onlineUser.profile.avatar_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs">
                              {getDisplayName(onlineUser.profile)[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {getDisplayName(onlineUser.profile)}
                          </p>
                          <p className="text-gray-500 text-xs">Active now</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              <Link href="/forum/new">
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-400 hover:text-white h-8 text-xs sm:text-sm">
                  <Plus className="w-3 h-3 mr-2" />
                  Start Discussion
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start text-gray-400 hover:text-white h-8 text-xs sm:text-sm">
                <MessageSquare className="w-3 h-3 mr-2" />
                Browse Topics
              </Button>
            </CardContent>
          </Card>
          </div>
        </>
      )}
    </div>
  )
}
