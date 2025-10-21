"use client"

import { useState, useEffect } from "react"
import { useParams, notFound } from "next/navigation"
import { useAuth, supabase } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Edit,
  Mail,
  Music,
  Award,
  TrendingUp,
  Heart,
  Share2
} from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { Profile, getDisplayName } from "@/lib/utils"
import { ForumProfileManager } from "@/lib/forum-profile"
import { useCallback } from "react"

type ForumPost = {
  id: string
  title: string
  content: string
  created_at: string
  category_id: string
  vote_count?: number
  comment_count?: number
  is_pinned?: boolean
  is_locked?: boolean
}

type ForumComment = {
  id: string
  post_id: string
  content: string
  created_at: string
  vote_count?: number
}

type UserStats = {
  totalPosts: number
  totalComments: number
  totalVotes: number
  joinedDate: string
  lastActive: string
}

export default function ProfilePage() {
  const params = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userPosts, setUserPosts] = useState<ForumPost[]>([])
  const [userComments, setUserComments] = useState<ForumComment[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("posts")
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const username = params.username as string

  const fetchUserPosts = useCallback(async (userId: string) => {
    if (!supabase) return

    try {
      const { data: postsData, error } = await supabase
        .from("forum_posts")
        .select(`
          id,
          title,
          content,
          created_at,
          category_id,
          vote_count,
          is_pinned,
          is_locked
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching user posts:", error)
        return
      }

      // Get comment counts for each post
      if (postsData && postsData.length > 0) {
        const postIds = postsData.map(post => post.id)
        const { data: commentsData } = await supabase
          .from("forum_comments")
          .select("post_id")
          .in("post_id", postIds)

        const commentCounts = new Map<string, number>()
        commentsData?.forEach(comment => {
          commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) || 0) + 1)
        })

        const postsWithCommentCounts = postsData.map(post => ({
          ...post,
          comment_count: commentCounts.get(post.id) || 0
        }))

        setUserPosts(postsWithCommentCounts)
      } else {
        setUserPosts([])
      }
    } catch (error) {
      console.error("Error fetching user posts:", error)
    }
  }, [])

  const fetchUserComments = useCallback(async (userId: string) => {
    if (!supabase) return

    try {
      const { data: commentsData, error } = await supabase
        .from("forum_comments")
        .select(`
          id,
          post_id,
          content,
          created_at,
          vote_count
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching user comments:", error)
        return
      }

      setUserComments(commentsData || [])
    } catch (error) {
      console.error("Error fetching user comments:", error)
    }
  }, [])

  const fetchUserStats = useCallback(async (userId: string, userProfile: Profile) => {
    if (!supabase) return

    try {
      // Get total posts count
      const { count: totalPosts } = await supabase
        .from("forum_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      // Get total comments count
      const { count: totalComments } = await supabase
        .from("forum_comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      // Get total votes (sum of votes on user's posts and comments)
      const { data: postVotes } = await supabase
        .from("forum_posts")
        .select("vote_count")
        .eq("user_id", userId)

      const { data: commentVotes } = await supabase
        .from("forum_comments")
        .select("vote_count")
        .eq("user_id", userId)

      const totalPostVotes = postVotes?.reduce((sum, post) => sum + (post.vote_count || 0), 0) || 0
      const totalCommentVotes = commentVotes?.reduce((sum, comment) => sum + (comment.vote_count || 0), 0) || 0

      // Get last activity (most recent post or comment)
      const { data: lastPost } = await supabase
        .from("forum_posts")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const { data: lastComment } = await supabase
        .from("forum_comments")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const lastActivity = lastPost?.created_at && lastComment?.created_at
        ? new Date(lastPost.created_at) > new Date(lastComment.created_at)
          ? lastPost.created_at
          : lastComment.created_at
        : lastPost?.created_at || lastComment?.created_at || userProfile?.created_at || new Date().toISOString()

      setStats({
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalVotes: totalPostVotes + totalCommentVotes,
        joinedDate: userProfile?.created_at || new Date().toISOString(),
        lastActive: lastActivity
      })

    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }, [])

  const fetchUserProfile = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Try to find user by username first, then by ID if username doesn't work
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single()

      // If not found by username, try by ID (for backward compatibility)
      if (profileError || !profileData) {
        const { data: profileByIdData, error: profileByIdError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", username)
          .single()

        if (profileByIdError || !profileByIdData) {
          notFound()
          return
        }

        profileData = profileByIdData
      }

      setProfile(profileData)
      setIsOwnProfile(user?.id === profileData.id)

      // Fetch user's forum activity
      await Promise.all([
        fetchUserPosts(profileData.id),
        fetchUserComments(profileData.id),
        fetchUserStats(profileData.id, profileData)
      ])

    } catch (error) {
      console.error("Error fetching user profile:", error)
      notFound()
    } finally {
      setLoading(false)
    }
  }, [username, user])

  useEffect(() => {
    if (username) {
      fetchUserProfile()
    }
  }, [username, user])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const formatPostContent = (content: string) => {
    if (!content) return ""
    const sanitized = content.replace(/<[^>]*>/g, '')
    return sanitized.length > 100 ? sanitized.substring(0, 100) + "..." : sanitized
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                  <CustomLoader size="lg" showText text="Loading profile..." />
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!profile) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
              <div className="max-w-4xl mx-auto">
                <Card className="card-dark">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">Profile not found</h3>
                    <p className="text-gray-400 mb-4">The user profile you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/forum">
                      <Button className="button-primary">Back to Forum</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
                <Link href="/forum" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Forum
                </Link>
                <span>/</span>
                <span className="text-white">
                  {profile.full_name || profile.username || "User Profile"}
                </span>
              </nav>
              
              {/* Profile Header */}
              <Card className="bg-gray-900/60 backdrop-blur-sm border-gray-800 overflow-hidden">
                <div className="relative">
                  {/* Cover Image Placeholder */}
                  <div className="h-48 bg-gradient-to-r from-gray-900/50 via-gray-800/30 to-gray-900/50"></div>
                  
                  {/* Profile Content */}
                  <div className="relative px-6 pb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                      {/* Avatar */}
                      <Avatar className="w-32 h-32 border-4 border-gray-900 shadow-xl">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-4xl font-bold">
                          {getDisplayName(profile)[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Profile Info */}
                      <div className="flex-1 mt-4 sm:mt-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                              {profile.full_name || profile.username || "Anonymous User"}
                            </h1>
                            <p className="text-xl text-purple-400 mb-2">@{profile.username || "no-username"}</p>
                            {profile.bio && (
                              <p className="text-gray-300 text-lg max-w-2xl">{profile.bio}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {isOwnProfile && (
                              <Link href="/settings">
                                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Profile
                                </Button>
                              </Link>
                            )}
                            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </div>

                        {/* Profile Stats */}
                        {stats && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-white">{stats.totalPosts}</div>
                              <div className="text-sm text-gray-400">Posts</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-white">{stats.totalComments}</div>
                              <div className="text-sm text-gray-400">Comments</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-white">{stats.totalVotes}</div>
                              <div className="text-sm text-gray-400">Votes</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-white">{formatTimeAgo(stats.joinedDate)}</div>
                              <div className="text-sm text-gray-400">Joined</div>
                            </div>
                          </div>
                        )}

                        {/* Profile Details */}
                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Joined {new Date(profile.created_at || "").toLocaleDateString()}
                          </div>
                          {stats && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Last active {formatTimeAgo(stats.lastActive)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Activity Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
                  <TabsTrigger 
                    value="posts" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-gray-400 font-medium"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Posts ({stats?.totalPosts || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-gray-400 font-medium"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comments ({stats?.totalComments || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4">
                  {userPosts.length === 0 ? (
                    <Card className="card-dark">
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                        <p className="text-gray-400">
                          {isOwnProfile ? "You haven't" : "This user hasn't"} created any forum posts yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    userPosts.map((post) => (
                      <Card key={post.id} className="bg-gray-900/60 backdrop-blur-sm border-gray-800 hover:border-purple-500/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{formatTimeAgo(post.created_at)}</span>
                              {post.is_pinned && (
                                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            
                            <Link href={`/forum/post/${post.id}`}>
                              <h3 className="text-xl font-bold text-white hover:text-purple-400 transition-colors cursor-pointer">
                                {post.title}
                              </h3>
                            </Link>
                            
                            <p className="text-gray-300 line-clamp-2">
                              {formatPostContent(post.content)}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {post.comment_count || 0} comments
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {post.vote_count || 0} votes
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="comments" className="space-y-4">
                  {userComments.length === 0 ? (
                    <Card className="card-dark">
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No comments yet</h3>
                        <p className="text-gray-400">
                          {isOwnProfile ? "You haven't" : "This user hasn't"} posted any comments yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    userComments.map((comment) => (
                      <Card key={comment.id} className="bg-gray-900/60 backdrop-blur-sm border-gray-800 hover:border-purple-500/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{formatTimeAgo(comment.created_at)}</span>
                              <span>•</span>
                              {comment.post_id ? (
                                <Link 
                                  href={`/forum/post/${comment.post_id}`}
                                  className="text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                                >
                                  View post
                                </Link>
                              ) : (
                                <span className="text-gray-600">Post unavailable</span>
                              )}
                            </div>
                            
                            <p className="text-gray-300">
                              {comment.content}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {comment.vote_count || 0} votes
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
