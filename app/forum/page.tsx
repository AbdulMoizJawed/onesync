"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth, supabase } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessagingSidebar } from "@/components/forum/messaging-sidebar"
import { ActiveMembersCard } from "@/components/forum/active-members-card"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Users, TrendingUp, Plus, Search, Pin, Lock, User, AlertCircle } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { Profile, generateTempUsername, getDisplayName } from "@/lib/utils"
import { ForumProfileManager, type EnhancedProfile, isForumProfileComplete } from "@/lib/forum-profile"

type ForumCategory = {
  id: string
  name: string
  description: string | null
  color?: string
  icon?: string | null
  post_count?: number
  sort_order?: number
}

type ForumPost = {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string // Updated from author_id to match database schema
  category_id: string
  vote_count?: number
  comment_count?: number
  is_pinned?: boolean
  is_locked?: boolean
}

type ForumPostWithDetails = ForumPost & {
  author: Profile | null
  category: ForumCategory | null
  _count: { forum_comments: number }
  forum_author?: {
    displayName: string
    avatarUrl: string | null
    bio: string | null
    initials: string
  } | null
}

type ForumStats = {
  totalPosts: number
  postsThisWeek: number
  totalUsers: number
  activeUsers: number
}

export default function ForumPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<ForumPostWithDetails[]>([])
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [stats, setStats] = useState<ForumStats>({
    totalPosts: 0,
    postsThisWeek: 0,
    totalUsers: 0,
    activeUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("recent")

  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [showProfilePrompt, setShowProfilePrompt] = useState(false)

  const createUserProfile = useCallback(async () => {
    if (!user || !supabase) return

    try {
      const tempUsername = generateTempUsername(user.id)
      const profileData = {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || null,
        username: tempUsername,
        avatar_url: null,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("profiles").insert([profileData]).select().single()

      if (error) {
        console.error("Error creating profile:", error)
        setUserProfile(null)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error("Error creating profile:", error)
      setUserProfile(null)
    }
  }, [user])

  const fetchCategories = useCallback(async () => {
    if (!supabase) return
    
    try {
      let { data, error } = await supabase
        .from("forum_categories")
        .select("id, name, description, color, icon, post_count, sort_order")
        .order("sort_order", { ascending: true })

      if (error && error.message?.includes("does not exist")) {
        console.log("Some columns don't exist, fetching basic data...")
        const { data: basicData, error: basicError } = await supabase
          .from("forum_categories")
          .select("id, name, description")
          .order("name", { ascending: true })

        if (basicError) {
          console.error("Error fetching basic categories:", basicError)
          setCategories([]) // Set empty array instead of leaving undefined
          return
        }

        data =
          basicData?.map((cat, index) => ({
            ...cat,
            color: "#6366f1",
            icon: null,
            post_count: 0,
            sort_order: index + 1,
          })) || []
      } else if (error) {
        console.error("Error fetching categories:", error)
        // Fallback to default categories
        setCategories([
          { id: 'artist-center', name: 'Artist Center', description: 'Artist tips and resources' },
          { id: 'music-business', name: 'Music Business', description: 'Industry and business' },
          { id: 'tutorials', name: 'Tutorials', description: 'Guides and how-tos' },
        ] as any)
        return
      }

      setCategories((data && data.length > 0) ? data : ([
        { id: 'artist-center', name: 'Artist Center', description: 'Artist tips and resources' },
        { id: 'music-business', name: 'Music Business', description: 'Industry and business' },
        { id: 'tutorials', name: 'Tutorials', description: 'Guides and how-tos' },
      ] as any))
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([
        { id: 'artist-center', name: 'Artist Center', description: 'Artist tips and resources' },
        { id: 'music-business', name: 'Music Business', description: 'Industry and business' },
        { id: 'tutorials', name: 'Tutorials', description: 'Guides and how-tos' },
      ] as any)
    }
  }, [])

  const fetchPosts = useCallback(async () => {
    if (!user || !supabase) return

    try {
      let { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsError && postsError.message?.includes("does not exist")) {
        console.log("Some post columns don't exist, fetching basic data...")
        const { data: basicPostsData, error: basicPostsError } = await supabase
          .from("forum_posts")
          .select("id, title, content, created_at, user_id, category_id")
          .order("created_at", { ascending: false })
          .limit(20)

        if (basicPostsError) {
          console.error("Error fetching basic posts:", basicPostsError)
          setPosts([]) // Set empty array on error
          return
        }

        postsData =
          basicPostsData?.map((post) => ({
            ...post,
            vote_count: 0,
            comment_count: 0,
            is_pinned: false,
            is_locked: false,
          })) || []
      } else if (postsError) {
        console.error("Error fetching posts:", postsError)
        setPosts([]) // Set empty array on error
        return
      }

      if (!postsData || postsData.length === 0) {
        setPosts([])
        return
      }

      // Fetch user profiles for forum display
      const userIds = [...new Set(postsData.map((p: any) => p.user_id || p.author_id).filter((id: any) => id))] // Support both column names
      const categoryIds = [...new Set(postsData.map((p: any) => p.category_id).filter((id: any) => id))]

      // Get enhanced forum profile data
      let forumAuthorsMap = new Map()
      try {
        forumAuthorsMap = await ForumProfileManager.getForumAuthorData(userIds as string[])
        console.log('✅ Forum authors data fetched successfully:', forumAuthorsMap.size, 'authors')
      } catch (error) {
        console.error('❌ Error fetching forum author data:', error)
        // forumAuthorsMap remains as empty map
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("forum_categories")
        .select("*")
        .in("id", categoryIds)

      if (categoriesError) {
        console.error("Error fetching post categories:", categoriesError)
      }

      const { data: commentsData, error: commentsError } = await supabase
        .from("forum_comments")
        .select("post_id")
        .in(
          "post_id",
          postsData.map((p) => p.id),
        )

      if (commentsError) {
        console.error("Error fetching comments:", commentsError)
      }

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || [])
      const categoriesMap = new Map(categoriesData?.map((c) => [c.id, c]) || [])
      const commentCounts = new Map<string, number>()

      commentsData?.forEach((comment) => {
        commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) || 0) + 1)
      })

      const postsWithDetails: ForumPostWithDetails[] = postsData.map((post: any) => ({
        ...post,
        author: profilesMap.get(post.user_id || post.author_id) || null, // Support both column names
        category: categoriesMap.get(post.category_id) || null,
        _count: {
          forum_comments: commentCounts.get(post.id) || 0,
        },
        // Add enhanced forum display data
        forum_author: forumAuthorsMap.get(post.user_id || post.author_id) || null
      }))

      postsWithDetails.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setPosts(postsWithDetails)
    } catch (error) {
      console.error("Error fetching posts:", error)
    }
  }, [user])

  const fetchStats = useCallback(async () => {
    if (!supabase) return
    
    try {
      const { count: totalPosts } = await supabase.from("forum_posts").select("*", { count: "exact", head: true })

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { count: postsThisWeek } = await supabase
        .from("forum_posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString())

      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)

      const { data: activeUsersData } = await supabase
        .from("forum_posts")
        .select("user_id")
        .gte("created_at", monthAgo.toISOString())

      const activeUsers = new Set(activeUsersData?.map((post) => post.user_id) || []).size

      setStats({
        totalPosts: totalPosts || 0,
        postsThisWeek: postsThisWeek || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [])

  const fetchForumData = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      await Promise.all([fetchCategories(), fetchPosts(), fetchStats()])
    } catch (error) {
      console.error("Error fetching forum data:", error)
      // Set empty states on error to prevent infinite loading
      setPosts([])
      setCategories([])
      setStats({
        totalPosts: 0,
        postsThisWeek: 0,
        totalUsers: 0,
        activeUsers: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [fetchCategories, fetchPosts, fetchStats])

  useEffect(() => {
    if (user) {
      fetchForumData()
    }
  }, [user, fetchForumData])

  useEffect(() => {
    if (user) {
      const checkUserProfile = async () => {
        if (!user || !supabase) return

        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (error) {
            console.error("Error checking user profile:", error)
            // Don't recursively call createUserProfile to prevent infinite loops
            setUserProfile(null)
          }
        } catch (error) {
          console.error("Error checking user profile:", error)
          setUserProfile(null)
        }
      }

      checkUserProfile()
    }
  }, [user, createUserProfile])


  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchTerm ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.forum_author?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || post.category_id === selectedCategory

    return matchesSearch && matchesCategory
  })

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const formatPostContent = (content: string) => {
    if (!content) return ""
    // Strip HTML tags to prevent XSS
    const sanitized = content.replace(/<[^>]*>/g, '')
    return sanitized.length > 150 ? sanitized.substring(0, 150) + "..." : sanitized
  }



  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                  <CustomLoader size="lg" showText text="Loading forum..." />
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950 overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950">
            <div className="flex h-full overflow-x-hidden w-full">
              <div className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1400px] mx-auto w-full overflow-x-hidden min-w-0">
                {showProfilePrompt && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
                    <Card className="card-dark max-w-md w-full mx-3 border border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-lg sm:text-xl">Complete Your Profile</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-gray-300 text-sm sm:text-base mb-4">
                            Join the community! Complete your profile with a username to participate in discussions.
                          </p>
                          <div className="space-y-2">
                            {userProfile && !userProfile.username && (
                              <div className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm text-orange-400 bg-orange-950/30 px-3 py-1.5 rounded-full">
                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Set username in settings to post
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link href="/settings" className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-10">
                              Complete Profile
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            onClick={() => setShowProfilePrompt(false)}
                            className="border-gray-700 text-white hover:bg-gray-800 h-10"
                          >
                            Later
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="max-w-6xl mx-auto w-full overflow-x-hidden">
                  {/* Enhanced Header Section */}
                  <div className="relative bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-indigo-900/30 rounded-xl mb-6 sm:mb-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>
                    <div className="relative p-4 sm:p-6 lg:p-8">
                      <div className="text-center">
                        <div>
                          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">
                            Music <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Community</span>
                          </h1>
                          <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
                            Connect with artists, producers, and music industry professionals worldwide
                          </p>
                        </div>
                        <div className="flex justify-center">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-4xl px-2">
                            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10">
                              <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xl sm:text-2xl font-bold text-white">{stats.totalPosts.toLocaleString()}</span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-300">Total Posts</div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10">
                              <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xl sm:text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-300">Members</div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10 col-span-2 sm:col-span-1">
                              <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xl sm:text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-300">Active</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex justify-center">
                          <Link href="/forum/new">
                            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200">
                              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                              Create Post
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Layout for Forum */}
                  <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full overflow-x-hidden">
                    {/* Main Content - Left Column */}
                    <div className="flex-1 order-2 md:order-1 min-w-0 overflow-x-hidden">
                      {/* Enhanced Search and Filter Bar */}
                      <div className="mb-8 w-full overflow-x-hidden">
                        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 w-full">
                          <CardContent className="p-3 sm:p-6">
                            <div className="flex flex-col lg:flex-row gap-4 w-full">
                              <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                  placeholder="Search posts, discussions, or community members..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-12 h-12 bg-gray-800/50 border-gray-700 text-white text-lg placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg"
                                />
                              </div>
                              <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-3 h-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-w-[180px]"
                              >
                                <option value="all">All Categories</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Mobile Active Members - Only visible on mobile */}
                      <div className="mb-4 md:hidden">
                        <ActiveMembersCard className="mb-4" />
                      </div>

                      {/* Enhanced Category Pills */}
                      <div className="overflow-x-auto pb-4 mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
                        <div className="flex gap-3 min-w-max">
                          <Button 
                            variant={selectedCategory === "all" ? "default" : "outline"}
                            onClick={() => setSelectedCategory("all")}
                            className={`rounded-full px-6 py-2 h-10 font-medium transition-all duration-200 ${
                              selectedCategory === "all" 
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg" 
                                : "bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                            }`}
                          >
                            All Discussions
                          </Button>
                          {categories.map((category) => (
                            <Button 
                              key={category.id}
                              variant={selectedCategory === category.id ? "default" : "outline"}
                              onClick={() => setSelectedCategory(category.id)}
                              className={`rounded-full px-6 py-2 h-10 font-medium transition-all duration-200 ${
                                selectedCategory === category.id 
                                  ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg" 
                                  : "bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                              }`}
                            >
                              {category.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-hidden">
                        <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-1">
                          <TabsTrigger 
                            value="recent" 
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-400 font-medium rounded-lg transition-all duration-200"
                          >
                            Recent Posts
                          </TabsTrigger>
                          <TabsTrigger 
                            value="popular" 
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-400 font-medium rounded-lg transition-all duration-200"
                          >
                            Popular
                          </TabsTrigger>
                          <TabsTrigger 
                            value="trending" 
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-400 font-medium rounded-lg transition-all duration-200"
                          >
                            Trending
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="recent" className="space-y-4">
                          {filteredPosts.length === 0 ? (
                            <div className="text-center py-16">
                              <Card className="max-w-md mx-auto bg-gray-900/60 backdrop-blur-sm border-gray-800">
                                <CardContent className="p-8">
                                  <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 flex items-center justify-center border border-purple-500/30">
                                      <MessageSquare className="w-10 h-10 text-purple-400" />
                                    </div>
                                  </div>
                                  <h3 className="text-xl font-semibold text-white mb-3">
                                    {searchTerm || selectedCategory !== "all" ? "No posts found" : "No posts yet"}
                                  </h3>
                                  <p className="text-gray-400 mb-6 leading-relaxed">
                                    {searchTerm || selectedCategory !== "all"
                                      ? "Try adjusting your search or filters"
                                      : "Be the first to start a discussion!"}
                                  </p>
                                  <Link href="/forum/new">
                                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3">
                                      <Plus className="w-4 h-4 mr-2" />
                                      Create First Post
                                    </Button>
                                  </Link>
                                </CardContent>
                              </Card>
                            </div>
                          ) : (
                            filteredPosts.map((post) => (
                              <Card key={post.id} className="bg-gray-900/60 backdrop-blur-sm border-gray-800 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <CardContent className="relative p-4 sm:p-6">
                                  <div className="flex items-start gap-3 sm:gap-4">
                                    <Link href={`/profile/${post.author?.username || post.user_id}`} className="flex-shrink-0">
                                      <Avatar className="w-10 h-10 sm:w-14 sm:h-14 border-2 border-gray-700 group-hover:border-purple-500/50 transition-colors">
                                        <AvatarImage src={post.forum_author?.avatarUrl || post.author?.avatar_url || ""} />
                                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-lg font-semibold">
                                          {post.forum_author?.initials || getDisplayName(post.author)[0]?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </Link>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 sm:gap-3 mb-3">
                                        <Link href={`/profile/${post.author?.username || post.user_id}`} className="font-semibold text-white hover:text-purple-400 transition-colors text-base sm:text-lg">
                                          {post.forum_author?.displayName || getDisplayName(post.author)}
                                        </Link>
                                        <span className="text-xs sm:text-sm text-gray-500 order-last sm:order-none">
                                          {formatTimeAgo(post.created_at)}
                                        </span>
                                        
                                        <div className="flex items-center flex-wrap gap-2">
                                          {post.is_pinned && (
                                            <div className="flex items-center gap-1.5 bg-yellow-600/20 text-yellow-400 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border border-yellow-600/30">
                                              <Pin className="w-3 h-3 sm:w-4 sm:h-4" />
                                              <span className="hidden sm:inline">Pinned</span>
                                            </div>
                                          )}
                                          
                                          {post.is_locked && (
                                            <div className="flex items-center gap-1.5 bg-red-600/20 text-red-400 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border border-red-600/30">
                                              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                                              <span className="hidden sm:inline">Locked</span>
                                            </div>
                                          )}
                                          
                                          <Badge
                                            className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border font-medium"
                                            style={{
                                              backgroundColor: `${post.category?.color || "#6366f1"}15`,
                                              color: post.category?.color || "#6366f1",
                                              borderColor: `${post.category?.color || "#6366f1"}40`,
                                            }}
                                          >
                                            {post.category?.name || "General"}
                                          </Badge>
                                        </div>
                                      </div>

                                      <Link href={`/forum/post/${post.id}`}>
                                        <h3 className="text-base sm:text-xl font-bold text-white mb-3 hover:text-purple-400 transition-colors cursor-pointer group-hover:text-purple-300 break-words">
                                          {post.title}
                                        </h3>
                                      </Link>

                                      <div className="mb-6">
                                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-3 break-words">
                                          {formatPostContent(post.content)}
                                        </p>
                                      </div>

                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-4 sm:gap-6">
                                          <Link href={`/forum/post/${post.id}#comments`} className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-purple-400 transition-colors">
                                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="font-medium text-sm sm:text-base">{post._count.forum_comments || 0}</span>
                                            <span className="text-xs sm:text-sm hidden sm:inline">replies</span>
                                          </Link>
                                          <Link href={`/forum/post/${post.id}`} className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="font-medium text-sm sm:text-base">{post.vote_count || 0}</span>
                                            <span className="text-xs sm:text-sm hidden sm:inline">votes</span>
                                          </Link>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                          <Link href={`/forum/post/${post.id}`} className="flex-1 sm:flex-none">
                                            <Button 
                                              variant="ghost" 
                                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 px-3 sm:px-4 py-2 text-xs sm:text-sm w-full sm:w-auto"
                                            >
                                              Read More
                                            </Button>
                                          </Link>
                                          {post.is_locked ? (
                                            <Button
                                              disabled
                                              className="bg-gray-800 text-gray-400 border-0 px-3 sm:px-4 py-2 text-xs sm:text-sm w-full sm:w-auto cursor-not-allowed"
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                              }}
                                            >
                                              Locked
                                            </Button>
                                          ) : (
                                            <Link href={`/forum/post/${post.id}#add-comment`} className="flex-1 sm:flex-none">
                                              <Button
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-0 px-3 sm:px-4 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm w-full sm:w-auto"
                                              >
                                                Reply
                                              </Button>
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </TabsContent>

                        <TabsContent value="popular" className="space-y-4">
                          <Card className="card-dark">
                            <CardContent className="p-8 text-center">
                              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">Popular Posts</h3>
                              <p className="text-gray-400">Popular posts will appear here based on engagement.</p>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="trending" className="space-y-4">
                          <Card className="card-dark">
                            <CardContent className="p-8 text-center">
                              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">Trending Posts</h3>
                              <p className="text-gray-400">Trending posts will appear here based on recent activity.</p>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Sidebar - Desktop Only */}
                    <div className="hidden md:block md:w-80 lg:w-96 order-1 md:order-2">
                      <MessagingSidebar />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
