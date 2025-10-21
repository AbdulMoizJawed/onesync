"use client"
// @ts-nocheck

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useAuth, useSupabase } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Pin, Lock, Send, AlertCircle, User, RotateCcw, Image as ImageIcon, Video, Music, Paperclip, X } from "lucide-react"
import { Profile, generateTempUsername, getDisplayName } from "@/lib/utils"
import { ForumProfileManager, type EnhancedProfile, isForumProfileComplete } from "@/lib/forum-profile"
import { toast } from "sonner"

type ForumCategory = {
  id: string
  name: string
  description: string | null
  color?: string
  icon?: string | null
}

type ForumPost = {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string  // Changed from author_id to match database schema
  category_id: string
  vote_count?: number
  comment_count?: number
  is_pinned?: boolean
  is_locked?: boolean
  attachments?: Array<{
    type: 'image' | 'video' | 'audio'
    url: string
    name: string
    size: number
  }> | null
}

type ForumPostWithDetails = ForumPost & {
  author: Profile | null
  category: ForumCategory | null
}

type ForumComment = {
  id: string
  post_id: string
  parent_comment_id: string | null
  content: string
  user_id: string  // Changed from author_id to match database schema
  created_at: string
  updated_at: string
  vote_count?: number
  is_deleted?: boolean
  author: Profile | null
  replies?: ForumComment[]
  attachments?: Array<{
    type: 'image' | 'video' | 'audio'
    url: string
    name: string
    size: number
  }> | null
}

export default function PostPage() {
  const params = useParams()
  const { user } = useAuth()
  const supabase = useSupabase()
  const [post, setPost] = useState<ForumPostWithDetails | null>(null)
  const [comments, setComments] = useState<ForumComment[]>([])
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showAddComment, setShowAddComment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [postLiked, setPostLiked] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  const postId = params.id as string

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.postId === postId) setShowAddComment(true)
    }
    window.addEventListener('openAddComment', handler as EventListener)
    return () => window.removeEventListener('openAddComment', handler as EventListener)
  }, [postId])

  const submitInlineComment = async () => {
    if (!newComment.trim()) return
    await handleSubmitComment({ preventDefault: () => {} } as React.FormEvent)
    setShowAddComment(false)
  }
  
  // const fetchPost = useCallback(async () => {
  //   if (!postId || !supabase) return

  //   try {
  //     console.log('[Forum Post] Fetching post:', postId)
      
  //     // First get the post
  //     const { data: postData, error: postError } = await supabase
  //       .from("forum_posts")
  //       .select("*")
  //       .eq("id", postId)
  //       .single()

  //     if (postError) {
  //       console.error("[Forum Post] Error fetching post:", postError)
  //       setError(postError.message)
  //       return
  //     }

  //     console.log('[Forum Post] Post fetched:', postData)

  //     // Then get the author profile
  //     let author = null
  //     if (postData.user_id) {
  //       const { data: authorData, error: authorError } = await supabase
  //         .from("profiles")
  //         .select("username, avatar_url, full_name")
  //         .eq("id", postData.user_id)
  //         .single()

  //       if (authorError) {
  //         console.error("[Forum Post] Error fetching author:", authorError)
  //       } else {
  //         author = authorData
  //         console.log('[Forum Post] Author fetched:', author)
  //       }
  //     }

  //     // Get the category
  //     let category = null
  //     if (postData.category_id) {
  //       const { data: categoryData, error: categoryError } = await supabase
  //         .from("forum_categories")
  //         .select("id, name, description, color")
  //         .eq("id", postData.category_id)
  //         .single()

  //       if (categoryError) {
  //         console.error("[Forum Post] Error fetching category:", categoryError)
  //       } else {
  //         category = categoryData
  //         console.log('[Forum Post] Category fetched:', category)
  //       }
  //     }

  //     // Combine the data
  //     const combinedData = {
  //       ...postData,
  //       author,
  //       category
  //     }

  //     console.log('[Forum Post] Combined data:', combinedData)
  //     setPost(combinedData as any)
  //   } catch (error) {
  //     console.error("[Forum Post] Error fetching post:", error)
  //     setError("Failed to fetch post")
  //   }
  // }, [postId])
  const fetchPost = useCallback(async () => {
  if (!postId || !supabase) return

  try {
    console.log('[Forum Post] Fetching post:', postId)
    
    // First get the post
    const { data: postData, error: postError } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("id", postId)
      .single()

    if (postError) {
      console.error("[Forum Post] Error fetching post:", postError)
      setError(postError.message)
      return
    }

    console.log('[Forum Post] Post fetched:', postData)

    // Check if user has liked this post
    if (user) {
      const { data: likeData } = await supabase
        .from("forum_post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single()
      
      setPostLiked(!!likeData)
      console.log('[Forum Post] User like status:', !!likeData)
    }

    // Get the like count
    const { count: likeCount } = await supabase
      .from("forum_post_likes")
      .select("*", { count: 'exact', head: true })
      .eq("post_id", postId)

    console.log('[Forum Post] Like count:', likeCount)

    // Then get the author profile
    let author = null
    if (postData.user_id) {
      const { data: authorData, error: authorError } = await supabase
        .from("profiles")
        .select("username, avatar_url, full_name")
        .eq("id", postData.user_id)
        .single()

      if (authorError) {
        console.error("[Forum Post] Error fetching author:", authorError)
      } else {
        author = authorData
        console.log('[Forum Post] Author fetched:', author)
      }
    }

    // Get the category
    let category = null
    if (postData.category_id) {
      const { data: categoryData, error: categoryError } = await supabase
        .from("forum_categories")
        .select("id, name, description, color")
        .eq("id", postData.category_id)
        .single()

      if (categoryError) {
        console.error("[Forum Post] Error fetching category:", categoryError)
      } else {
        category = categoryData
        console.log('[Forum Post] Category fetched:', category)
      }
    }

    // Combine the data with actual like count
    const combinedData = {
      ...postData,
      author,
      category,
      vote_count: likeCount || 0
    }

    console.log('[Forum Post] Combined data:', combinedData)
    setPost(combinedData as any)
  } catch (error) {
    console.error("[Forum Post] Error fetching post:", error)
    setError("Failed to fetch post")
  }
}, [postId, user])

  // const fetchComments = useCallback(async () => {
  //   if (!postId || !supabase) return

  //   try {
  //     console.log('[Forum Post] Fetching comments for post:', postId)
      
  //     // First get the comments
  //     const { data: commentsData, error: commentsError } = await supabase
  //       .from("forum_comments")
  //       .select("*")
  //       .eq("post_id", postId)
  //       .order("created_at", { ascending: true })

  //     if (commentsError) {
  //       console.error("[Forum Post] Error fetching comments:", commentsError)
  //       return
  //     }

  //     console.log('[Forum Post] Comments fetched:', commentsData?.length || 0)

  //     // Then get author profiles for each comment
  //     const commentsWithAuthors = await Promise.all(
  //       (commentsData || []).map(async (comment) => {
  //         if (comment.user_id && supabase) {
  //           const { data: authorData, error: authorError } = await supabase
  //             .from("profiles")
  //             .select("username, avatar_url, full_name")
  //             .eq("id", comment.user_id)
  //             .single()

  //           if (authorError) {
  //             console.error("[Forum Post] Error fetching comment author:", authorError)
  //             return { ...comment, author: null }
  //           }

  //           return { ...comment, author: authorData }
  //         }
  //         return { ...comment, author: null }
  //       })
  //     )

  //     console.log('[Forum Post] Comments with authors:', commentsWithAuthors)
  //     setComments(commentsWithAuthors || [])
  //   } catch (error) {
  //     console.error("[Forum Post] Error fetching comments:", error)
  //   }
  // }, [postId])

  const fetchComments = useCallback(async () => {
  if (!postId || !supabase) return

  try {
    console.log('[Forum Post] Fetching comments for post:', postId)
    
    // First get the comments
    const { data: commentsData, error: commentsError } = await supabase
      .from("forum_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (commentsError) {
      console.error("[Forum Post] Error fetching comments:", commentsError)
      return
    }

    console.log('[Forum Post] Comments fetched:', commentsData?.length || 0)

    if (!commentsData || commentsData.length === 0) {
      setComments([])
      return
    }

    // Get comment IDs
    const commentIds = commentsData.map(c => c.id)

    // Get like counts for all comments
    const { data: likesData } = await supabase
      .from('forum_comment_likes')
      .select('comment_id')
      .in('comment_id', commentIds)

    const likeCounts = new Map<string, number>()
    likesData?.forEach(like => {
      likeCounts.set(like.comment_id, (likeCounts.get(like.comment_id) || 0) + 1)
    })

    // Check which comments the current user has liked
    if (user) {
      const { data: userLikesData } = await supabase
        .from('forum_comment_likes')
        .select('comment_id')
        .in('comment_id', commentIds)
        .eq('user_id', user.id)

      const userLikedSet = new Set(userLikesData?.map(l => l.comment_id) || [])
      setLikedComments(userLikedSet)
      console.log('[Forum Post] User liked comments:', userLikedSet.size)
    }

    // Then get author profiles for each comment
    const commentsWithAuthors = await Promise.all(
      commentsData.map(async (comment) => {
        if (comment.user_id && supabase) {
          const { data: authorData, error: authorError } = await supabase
            .from("profiles")
            .select("username, avatar_url, full_name")
            .eq("id", comment.user_id)
            .single()

          if (authorError) {
            console.error("[Forum Post] Error fetching comment author:", authorError)
            return { 
              ...comment, 
              author: null,
              vote_count: likeCounts.get(comment.id) || 0
            }
          }

          return { 
            ...comment, 
            author: authorData,
            vote_count: likeCounts.get(comment.id) || 0
          }
        }
        return { 
          ...comment, 
          author: null,
          vote_count: likeCounts.get(comment.id) || 0
        }
      })
    )

    console.log('[Forum Post] Comments with authors and likes:', commentsWithAuthors)
    setComments(commentsWithAuthors || [])
  } catch (error) {
    console.error("[Forum Post] Error fetching comments:", error)
  }
}, [postId, user])

const checkUserProfile = useCallback(async () => {
  if (!user || !supabase) return

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error checking user profile:", error)
      setUserProfile(null)
      return
    }

    // ✅ SET THE PROFILE ON SUCCESS
    if (data) {
      console.log('[Forum Post] User profile loaded:', data)
      setUserProfile(data)
    }
  } catch (error) {
    console.error("Error checking user profile:", error)
    setUserProfile(null)
  }
}, [user])

  useEffect(() => {
    const loadData = async () => {
      if (postId && user) {
        setLoading(true)
        await Promise.all([
          fetchPost(),
          fetchComments(),
          checkUserProfile()
        ])
        setLoading(false)
      }
    }
    loadData()
  }, [postId, user, checkUserProfile, fetchComments, fetchPost])

  // Handle URL hash to auto-focus comment form
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#add-comment') {
      // Wait for the page to load, then scroll to comment form
      setTimeout(() => {
        const commentForm = document.getElementById('add-comment')
        if (commentForm) {
          commentForm.scrollIntoView({ behavior: 'smooth' })
          // Focus the textarea if profile is complete
          const textarea = commentForm.querySelector('textarea')
          if (textarea) {
            textarea.focus()
          }
        }
      }, 500)
    }
  }, [post, userProfile])



  const createUserProfile = async () => {
    if (!user || !supabase) return

    try {
      const { data: existingProfiles } = await supabase.from("profiles").select("id").eq("id", user.id).limit(1)

      if (existingProfiles && existingProfiles.length > 0) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        if (profile) {
          setUserProfile(profile)
          // Username is auto-generated on signup, no need to prompt
        }
        return
      }

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
        console.error("Error creating user profile:", error)
        if (error.code === "23505" || error.message?.includes("duplicate key")) {
          const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
          if (existingProfile) {
            setUserProfile(existingProfile)
            // Username is auto-generated, no need to prompt
          }
        }
        return
      }

      setUserProfile(data)
      // Profile created with auto-generated username, ready to use
    } catch (error) {
      console.error("Error creating user profile:", error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isAudio = file.type.startsWith('audio/')
      const isUnder50MB = file.size <= 50 * 1024 * 1024 // 50MB limit

      if (!isUnder50MB) {
        toast.error(`${file.name} is too large. Max size is 50MB.`)
        return false
      }

      return isImage || isVideo || isAudio
    })

    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // const uploadAttachments = async (): Promise<any[]> => {
  //   if (attachments.length === 0) return []

  //   const uploadedFiles: any[] = []

  //   for (const file of attachments) {
  //     try {
  //       const fileExt = file.name.split('.').pop()
  //       const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  //       const filePath = `forum-media/${fileName}`

  //       const { data, error } = await supabase!.storage
  //         .from('forum-attachments')
  //         .upload(filePath, file, {
  //           cacheControl: '3600',
  //           upsert: false
  //         })

  //       if (error) throw error

  //       const { data: { publicUrl } } = supabase!.storage
  //         .from('forum-attachments')
  //         .getPublicUrl(filePath)

  //       uploadedFiles.push({
  //         type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
  //         url: publicUrl,
  //         name: file.name,
  //         size: file.size
  //       })
  //     } catch (err) {
  //       console.error('Error uploading file:', file.name, err)
  //       toast.error(`Failed to upload ${file.name}`)
  //     }
  //   }

  //   return uploadedFiles
  // }

  const uploadAttachments = async (): Promise<any[]> => {
  if (attachments.length === 0) return []
  if (!user) {
    toast.error("Cannot upload: user not authenticated")
    return []
  }

  const uploadedFiles: any[] = []

  for (const file of attachments) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)

      console.log('[Forum Comment] Uploading file via API:', file.name)

      const response = await fetch('/api/upload-forum-media', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      console.log('[Forum Comment] File uploaded successfully:', result.file)
      uploadedFiles.push(result.file)
      toast.success(`Uploaded ${file.name}`)

    } catch (err: any) {
      console.error('Error uploading file:', file.name, err)
      toast.error(`Failed to upload ${file.name}: ${err.message}`)
    }
  }

  return uploadedFiles
}

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('[Forum Comment] Submit attempt:', { 
      hasUser: !!user, 
      hasProfile: !!userProfile, 
      hasComment: !!newComment.trim(), 
      hasSupabase: !!supabase 
    })

    if (!user) {
      toast.error("You must be logged in to comment")
      return
    }

    if (!userProfile) {
      toast.error("Profile not loaded. Please refresh the page.")
      return
    }

    if (!newComment.trim()) {
      toast.error("Please write a comment")
      return
    }

    if (!supabase) {
      toast.error("Database connection error. Please refresh the page.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      console.log('[Forum Comment] Starting comment submission...')
      
      // Upload attachments first
      let uploadedAttachments: any[] = []
      if (attachments.length > 0) {
        console.log('[Forum Comment] Uploading attachments:', attachments.length)
        setUploading(true)
        uploadedAttachments = await uploadAttachments()
        setUploading(false)
        console.log('[Forum Comment] Attachments uploaded:', uploadedAttachments.length)
      }

      console.log('[Forum Comment] Inserting comment to database...')
      const { data, error } = await supabase
        .from("forum_comments")
        .insert([
          {
            post_id: postId,
            content: newComment.trim(),
            user_id: user.id,
            parent_comment_id: null,
            attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("[Forum Comment] Database error:", error)
        setError(`Failed to post comment: ${error.message}`)
        toast.error(`Failed to post comment: ${error.message}`)
        return
      }

      console.log('[Forum Comment] Comment posted successfully:', data)
      setNewComment("")
      setAttachments([])
      fetchComments()
      toast.success("Comment posted successfully!")
    } catch (error: any) {
      console.error("[Forum Comment] Exception:", error)
      setError(`Failed to post comment: ${error.message || 'Unknown error'}`)
      toast.error(`Failed to post comment: ${error.message || 'Unknown error'}`)
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  // const togglePostLike = async () => {
  //   if (!user || !supabase || !post) return

  //   try {
  //     if (postLiked) {
  //       // Unlike
  //       await supabase
  //         .from('forum_post_likes')
  //         .delete()
  //         .eq('post_id', post.id)
  //         .eq('user_id', user.id)
        
  //       setPostLiked(false)
  //       setPost(prev => prev ? { ...prev, vote_count: (prev.vote_count || 0) - 1 } : null)
  //     } else {
  //       // Like
  //       await supabase
  //         .from('forum_post_likes')
  //         .insert({ post_id: post.id, user_id: user.id })
        
  //       setPostLiked(true)
  //       setPost(prev => prev ? { ...prev, vote_count: (prev.vote_count || 0) + 1 } : null)
  //     }
  //   } catch (error) {
  //     console.error('Error toggling like:', error)
  //   }
  // }

  const togglePostLike = async () => {
  if (!user) {
    toast.error("You must be logged in to like posts")
    return
  }
  
  if (!supabase || !post) return

  try {
    if (postLiked) {
      // Unlike
      console.log('[Forum Post] Unliking post:', post.id)
      
      const { error } = await supabase
        .from('forum_post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)
      
      if (error) {
        console.error('[Forum Post] Error unliking:', error)
        toast.error("Failed to unlike post")
        return
      }
      
      setPostLiked(false)
      setPost(prev => prev ? { ...prev, vote_count: Math.max(0, (prev.vote_count || 0) - 1) } : null)
      toast.success("Post unliked")
    } else {
      // Like
      console.log('[Forum Post] Liking post:', post.id)
      
      const { error } = await supabase
        .from('forum_post_likes')
        .insert({ 
          post_id: post.id, 
          user_id: user.id 
        })
      
      if (error) {
        console.error('[Forum Post] Error liking:', error)
        
        // Check if already liked (race condition)
        if (error.code === '23505') {
          toast.info("You've already liked this post")
          setPostLiked(true)
          return
        }
        
        toast.error("Failed to like post")
        return
      }
      
      setPostLiked(true)
      setPost(prev => prev ? { ...prev, vote_count: (prev.vote_count || 0) + 1 } : null)
      toast.success("Post liked!")
    }
  } catch (error: any) {
    console.error('[Forum Post] Error toggling like:', error)
    toast.error(error.message || "Failed to toggle like")
  }
}

  // const toggleCommentLike = async (commentId: string) => {
  //   if (!user || !supabase) return

  //   try {
  //     const isLiked = likedComments.has(commentId)
      
  //     if (isLiked) {
  //       await supabase
  //         .from('forum_comment_likes')
  //         .delete()
  //         .eq('comment_id', commentId)
  //         .eq('user_id', user.id)
        
  //       setLikedComments(prev => {
  //         const newSet = new Set(prev)
  //         newSet.delete(commentId)
  //         return newSet
  //       })
        
  //       setComments(prev => prev.map(c => 
  //         c.id === commentId ? { ...c, vote_count: (c.vote_count || 0) - 1 } : c
  //       ))
  //     } else {
  //       await supabase
  //         .from('forum_comment_likes')
  //         .insert({ comment_id: commentId, user_id: user.id })
        
  //       setLikedComments(prev => new Set([...prev, commentId]))
        
  //       setComments(prev => prev.map(c => 
  //         c.id === commentId ? { ...c, vote_count: (c.vote_count || 0) + 1 } : c
  //       ))
  //     }
  //   } catch (error) {
  //     console.error('Error toggling comment like:', error)
  //   }
  // }


  const toggleCommentLike = async (commentId: string) => {
  if (!user) {
    toast.error("You must be logged in to like comments")
    return
  }
  
  if (!supabase) return

  try {
    const isLiked = likedComments.has(commentId)
    
    if (isLiked) {
      // Unlike
      console.log('[Forum Comment] Unliking comment:', commentId)
      
      const { error } = await supabase
        .from('forum_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
      
      if (error) {
        console.error('[Forum Comment] Error unliking:', error)
        toast.error("Failed to unlike comment")
        return
      }
      
      setLikedComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
      
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, vote_count: Math.max(0, (c.vote_count || 0) - 1) } : c
      ))
      
      toast.success("Comment unliked")
    } else {
      // Like
      console.log('[Forum Comment] Liking comment:', commentId)
      
      const { error } = await supabase
        .from('forum_comment_likes')
        .insert({ 
          comment_id: commentId, 
          user_id: user.id 
        })
      
      if (error) {
        console.error('[Forum Comment] Error liking:', error)
        
        // Check if already liked (race condition)
        if (error.code === '23505') {
          toast.info("You've already liked this comment")
          setLikedComments(prev => new Set([...prev, commentId]))
          return
        }
        
        toast.error("Failed to like comment")
        return
      }
      
      setLikedComments(prev => new Set([...prev, commentId]))
      
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, vote_count: (c.vote_count || 0) + 1 } : c
      ))
      
      toast.success("Comment liked!")
    }
  } catch (error: any) {
    console.error('[Forum Comment] Error toggling like:', error)
    toast.error(error.message || "Failed to toggle like")
  }
}

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
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
                <div className="animate-pulse space-y-6">
                  <div className="h-8 bg-gray-800 rounded w-1/3"></div>
                  <div className="h-64 bg-gray-800 rounded"></div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || (!loading && !post)) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-4 lg:p-6">
              <div className="max-w-4xl mx-auto">
                <Card className="card-dark">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      {error ? 'Error Loading Post' : 'Post Not Found'}
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-4">
                      {error || "The post you're looking for doesn't exist or has been removed."}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => {
                          setError(null)
                          setLoading(true)
                          fetchPost()
                        }}
                        variant="outline" 
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                      <Link href="/forum">
                        <Button className="button-primary h-10 sm:h-auto">Back to Forum</Button>
                      </Link>
                    </div>
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
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-4 lg:p-6">

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-4">
                <Link href="/forum">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Forum
                  </Button>
                </Link>
              </div>

              <Card className="card-dark">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarImage src={post?.author?.avatar_url || ""} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {getDisplayName(post?.author || null)[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post?.is_pinned && <Pin className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />}
                          {post?.is_locked && <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />}
                          <Badge
                            className="text-xs sm:text-sm px-2 py-1"
                            style={{
                              backgroundColor: `${post?.category?.color || "#6366f1"}20`,
                              color: post?.category?.color || "#6366f1",
                              borderColor: `${post?.category?.color || "#6366f1"}30`,
                            }}
                          >
                            {post?.category?.name || "General"}
                          </Badge>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500">{formatTimeAgo(post?.created_at || '')}</span>
                      </div>

                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 break-words">{post?.title}</h1>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                        <span className="text-xs sm:text-sm text-gray-400">
                          by <Link href={`/profile/${post?.author?.username || post?.user_id}`} className="text-purple-400 hover:text-purple-300 transition-colors font-medium">@{getDisplayName(post?.author || null)}</Link>
                        </span>
                        {post?.user_id && post.user_id !== user?.id && (
                          <Link href={`/messages?user=${post.user_id}`}>
                            <Button size="sm" variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600/10 h-7 text-xs sm:text-sm">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Send Message</span>
                              <span className="sm:hidden">DM</span>
                            </Button>
                          </Link>
                        )}
                      </div>

                      <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">{post?.content}</p>
                      </div>

                      {/* Post Attachments */}
                      {post?.attachments && post.attachments.length > 0 && (
                        <div className="mt-6 space-y-3">
                          {post.attachments.map((attachment: any, idx: number) => (
                            <div key={idx}>
                              {attachment.type === 'image' && (
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name}
                                  className="max-w-full rounded-lg border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer"
                                  onClick={() => window.open(attachment.url, '_blank')}
                                />
                              )}
                              {attachment.type === 'video' && (
                                <video 
                                  controls 
                                  className="max-w-full rounded-lg border border-gray-700"
                                  preload="metadata"
                                >
                                  <source src={attachment.url} type={`video/${attachment.name.split('.').pop()}`} />
                                  Your browser does not support video playback.
                                </video>
                              )}
                              {attachment.type === 'audio' && (
                                <audio 
                                  controls 
                                  className="w-full"
                                  preload="metadata"
                                >
                                  <source src={attachment.url} type={`audio/${attachment.name.split('.').pop()}`} />
                                  Your browser does not support audio playback.
                                </audio>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-700">
                        <div className="flex items-center gap-4 sm:gap-6">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={togglePostLike}
                            className={`${postLiked ? 'text-green-400' : 'text-gray-400 hover:text-green-400'} px-2 sm:px-3`}
                          >
                            <ThumbsUp className={`w-4 h-4 mr-1 sm:mr-2 ${postLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm sm:text-base font-medium">{post?.vote_count || 0}</span>
                          </Button>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm sm:text-base font-medium">{comments.length}</span>
                            <span className="text-xs sm:text-sm hidden sm:inline">comments</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            document.getElementById('add-comment')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            const textarea = document.querySelector('#add-comment textarea') as HTMLTextAreaElement
                            textarea?.focus()
                          }}
                          className="border-purple-600 text-purple-400 hover:bg-purple-600/10 w-full sm:w-auto text-sm sm:text-base"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Reply to Post</span>
                          <span className="sm:hidden">Reply</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <Card className="card-dark" id="add-comment">
                <CardHeader>
                  <CardTitle className="text-white">Add Comment</CardTitle>
                </CardHeader>
                <CardContent>
                  <form 
                    onSubmit={(e) => {
                      console.log('[Forum Comment] ========== FORM SUBMIT ==========')
                      console.log('[Forum Comment] Event:', e)
                      console.log('[Forum Comment] User:', user ? user.email : 'NO USER')
                      console.log('[Forum Comment] Profile:', userProfile ? userProfile.username : 'NO PROFILE')
                      console.log('[Forum Comment] Supabase:', supabase ? 'Connected' : 'NOT CONNECTED')
                      console.log('[Forum Comment] Comment text:', newComment)
                      console.log('[Forum Comment] =================================')
                      handleSubmitComment(e)
                    }} 
                    className="space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={userProfile?.avatar_url || ""} />
                        <AvatarFallback className="bg-purple-600 text-white">
                          {userProfile ? getDisplayName(userProfile)[0]?.toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write your comment..."
                          className="input-dark min-h-[100px] resize-y"
                          maxLength={2000}
                        />
                        <p className="text-xs text-gray-500">{newComment.length}/2000 characters</p>
                        
                        {/* Attachment Previews */}
                        {attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {attachments.map((file, index) => (
                              <div key={index} className="relative group bg-gray-800 rounded-lg p-2 pr-8 flex items-center gap-2">
                                {file.type.startsWith('image/') && <ImageIcon className="w-4 h-4 text-blue-400" />}
                                {file.type.startsWith('video/') && <Video className="w-4 h-4 text-purple-400" />}
                                {file.type.startsWith('audio/') && <Music className="w-4 h-4 text-green-400" />}
                                <span className="text-xs text-gray-300 max-w-[150px] truncate">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(index)}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="comment-media"
                          accept="image/*,video/*,audio/*"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label htmlFor="comment-media">
                          <Button type="button" variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 cursor-pointer" asChild>
                            <span>
                              <Paperclip className="w-4 h-4 mr-2" />
                              Add Media
                            </span>
                          </Button>
                        </label>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <Button 
                          type="submit" 
                          disabled={submitting || uploading || !newComment.trim()} 
                          className="button-primary"
                        >
                          {uploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Uploading Media...
                            </>
                          ) : submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Post Comment
                            </>
                          )}
                        </Button>
                        
                        {/* DEBUG: Direct call button */}
                        <Button 
                          type="button"
                          onClick={async () => {
                            console.log('[DEBUG] Direct button clicked')
                            try {
                              await handleSubmitComment({ preventDefault: () => {} } as any)
                            } catch (err) {
                              console.error('[DEBUG] Error:', err)
                            }
                          }}
                          disabled={submitting || uploading || !newComment.trim()}
                          variant="outline"
                          size="sm"
                          className="border-yellow-600 text-yellow-400"
                        >
                          Test Direct
                        </Button>
                      </div>
                      {!newComment.trim() && (
                        <p className="text-xs text-yellow-400">Write a comment to enable button</p>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-white">Comments ({comments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No comments yet</h3>
                      <p className="text-gray-400">Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.author?.avatar_url || ""} />
                            <AvatarFallback className="bg-purple-600 text-white">
                              {getDisplayName(comment.author)[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Link href={`/profile/${comment.author?.username || comment.user_id}`} className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                                @{getDisplayName(comment.author)}
                              </Link>
                              <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                              {comment.user_id !== user?.id && (
                                <Link href={`/messages?user=${comment.user_id}`}>
                                  <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 h-5 px-2 text-xs">
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    DM
                                  </Button>
                                </Link>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                            
                            {/* Render Attachments */}
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {comment.attachments.map((attachment: any, idx: number) => (
                                  <div key={idx}>
                                    {attachment.type === 'image' && (
                                      <img 
                                        src={attachment.url} 
                                        alt={attachment.name}
                                        className="max-w-full sm:max-w-md rounded-lg border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer"
                                        onClick={() => window.open(attachment.url, '_blank')}
                                      />
                                    )}
                                    {attachment.type === 'video' && (
                                      <video 
                                        controls 
                                        className="max-w-full sm:max-w-md rounded-lg border border-gray-700"
                                        preload="metadata"
                                      >
                                        <source src={attachment.url} type={`video/${attachment.name.split('.').pop()}`} />
                                        Your browser does not support video playback.
                                      </video>
                                    )}
                                    {attachment.type === 'audio' && (
                                      <audio 
                                        controls 
                                        className="w-full max-w-md"
                                        preload="metadata"
                                      >
                                        <source src={attachment.url} type={`audio/${attachment.name.split('.').pop()}`} />
                                        Your browser does not support audio playback.
                                      </audio>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleCommentLike(comment.id)}
                                className={likedComments.has(comment.id) ? 'text-green-400' : 'text-gray-400 hover:text-green-400 h-6 px-2'}
                              >
                                <ThumbsUp className={`w-3 h-3 mr-1 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                                {comment.vote_count || 0}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={showAddComment} onOpenChange={setShowAddComment}>
        <DialogContent className="card-dark border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
              rows={4}
              placeholder="Write your comment..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-gray-700 text-gray-300" onClick={() => setShowAddComment(false)}>Cancel</Button>
              <Button className="button-primary" onClick={submitInlineComment}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
