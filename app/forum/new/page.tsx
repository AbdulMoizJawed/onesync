"use client"
// @ts-nocheck

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useSupabase } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { ArrowLeft, Send, AlertCircle, User, Info, Image as ImageIcon, Video, Music, Paperclip, X } from "lucide-react"
import { Profile } from "@/lib/utils"
import { ForumProfileManager, type EnhancedProfile, isForumProfileComplete } from "@/lib/forum-profile"
import { toast } from "sonner"

type ForumCategory = {
  id: string
  name: string
  description?: string
  color?: string
}

export default function NewPostPage(): React.ReactElement {
  const { user } = useAuth()
  const supabase = useSupabase()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [formData, setFormData] = useState({ title: "", content: "", category_id: "" })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user || !supabase) return
    
    try {
      setLoading(true)
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (profileError) {
        console.error("Error fetching profile:", profileError)
        setError("Could not load user profile")
        return
      }
      
      if (profileData) {
        setProfile({ ...profileData, email: user.email || "" } as any)
        
        // Check if profile is complete for forum
        if (!isForumProfileComplete(profileData as EnhancedProfile)) {
          setShowProfileModal(true)
        }
      }
      
      // Fetch forum categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("forum_categories")
        .select("id, name, description, color")
        .order("name", { ascending: true })
      
      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError)
        setError("Failed to load categories. Please run SETUP-FORUM-COMPLETE.sql in Supabase SQL Editor.")
        setCategories([])
      } else if (!categoriesData || categoriesData.length === 0) {
        console.warn("No categories found in database")
        setError("No categories found. Please run SETUP-FORUM-COMPLETE.sql in Supabase SQL Editor.")
        setCategories([])
      } else {
        console.log("Categories loaded:", categoriesData)
        setCategories(categoriesData)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load page data")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { 
    if (user) {
      fetchData() 
    }
  }, [user, fetchData])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError("") // Clear error when user starts typing
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isAudio = file.type.startsWith('audio/')
      const isUnder50MB = file.size <= 50 * 1024 * 1024

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

      const response = await fetch('/api/upload-forum-media', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      uploadedFiles.push(result.file)
      toast.success(`Uploaded ${file.name}`)
      

    } catch (err: any) {
      console.error('Error uploading file:', file.name, err)
      toast.error(`Failed to upload ${file.name}: ${err.message}`)
    }
  }

  return uploadedFiles
}

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    console.log('[Forum Create] Submit started', { user: !!user, supabase: !!supabase, profile: !!profile })
    
    if (!user) {
      console.error('[Forum Create] Missing user')
      setError("You must be logged in to create a post")
      toast.error("You must be logged in to create a post")
      return
    }

    if (!supabase) {
      console.error('[Forum Create] Missing supabase')
      setError("Database connection error. Please refresh the page.")
      toast.error("Database connection error. Please refresh the page.")
      return
    }
    
    console.log('[Forum Create] Profile check:', { profile, hasUsername: profile?.username })
    if (profile && !profile.username) { 
      console.log('[Forum Create] No username, showing modal')
      setShowProfileModal(true)
      return 
    }
    
    // Validation
    if (!formData.title.trim()) { 
      console.error('[Forum Create] Missing title')
      setError("Post title is required")
      toast.error("Post title is required")
      return 
    }
    
    if (!formData.content.trim()) {
      console.error('[Forum Create] Missing content')
      setError("Post content is required")
      toast.error("Post content is required")
      return
    }
    
    if (!formData.category_id) {
      console.error('[Forum Create] Missing category')
      setError("Please select a category")
      toast.error("Please select a category")
      return
    }

    // Validate category ID is a proper UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(formData.category_id)) {
      console.error('[Forum Create] Invalid category ID:', formData.category_id)
      setError("Invalid category selected. Please refresh the page and try again.")
      toast.error("Invalid category. Please refresh and select a valid category.")
      return
    }

    console.log('[Forum Create] Starting post creation:', formData)
    setSubmitting(true)
    setError("")
    
    try {
      // Upload attachments first
      let uploadedAttachments: any[] = []
      if (attachments.length > 0) {
        setUploading(true)
        uploadedAttachments = await uploadAttachments()
        setUploading(false)
      }

      const postData = {
        title: formData.title.trim(), 
        content: formData.content.trim(), 
        category_id: formData.category_id, 
        user_id: user.id,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null,
      }
      console.log('[Forum Create] Inserting post with data:', postData)
      
      const { data, error: postError } = await supabase
        .from("forum_posts")
        .insert(postData)
        .select()
        .single()
      
      if (postError) {
        console.error("[Forum Create] Database error:", postError)
        const errorMsg = postError.message || 'Unknown database error'
        setError(`Failed to create post: ${errorMsg}`)
        toast.error(`Failed to create post: ${errorMsg}`)
        return
      }

      if (!data) {
        console.error("[Forum Create] No data returned after insert")
        setError("Post creation failed - no data returned")
        toast.error("Post creation failed - no data returned")
        return
      }
      
      console.log('[Forum Create] Post created successfully with ID:', data.id)
      toast.success("Post created successfully!")
      router.push(`/forum/post/${data.id}`)
    } catch (err: any) {
      console.error("[Forum Create] Unexpected error:", err)
      const errorMsg = err?.message || err?.toString() || 'Unknown error'
      setError(`Failed to create post: ${errorMsg}`)
      toast.error(`Failed to create post: ${errorMsg}`)
    } finally { 
      setSubmitting(false) 
    }
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

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Profile completion modal */}
              {showProfileModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="card-dark max-w-md w-full mx-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-xl">Complete Your Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-gray-400 mb-4">
                          To create forum posts, you need to complete your profile with a username.
                        </p>
                        <div className="space-y-2">
                          {profile && !isForumProfileComplete(profile as EnhancedProfile) && (
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                              <AlertCircle className="w-4 h-4" />
                              Complete profile required (username)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Link href="/settings" className="flex-1">
                          <Button className="w-full button-primary">Complete Profile</Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => setShowProfileModal(false)}
                          className="border-gray-700 text-white hover:bg-gray-800"
                        >
                          Later
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-4">
                <Link href="/forum">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Forum
                  </Button>
                </Link>
              </div>

              {/* Main form */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Create New Post</CardTitle>
                  <p className="text-gray-400">Share your thoughts with the music community</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="bg-red-950/50 border-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-200">{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category selection */}
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white font-medium">
                        Category <span className="text-red-400">*</span>
                      </Label>
                      <select
                        id="category"
                        value={formData.category_id}
                        onChange={(e) => handleChange('category_id', e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                            {category.description && ` - ${category.description}`}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <p className="text-sm text-yellow-400 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          No categories found. Please check your database setup.
                        </p>
                      )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white font-medium">
                        Post Title <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Enter an engaging title for your post..."
                        className="input-dark text-lg h-12"
                        maxLength={200}
                        required
                      />
                      <p className="text-xs text-gray-500">{formData.title.length}/200 characters</p>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <Label htmlFor="content" className="text-white font-medium">
                        Content <span className="text-red-400">*</span>
                      </Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => handleChange('content', e.target.value)}
                        placeholder="Write your post content here... Share your thoughts, ask questions, or start a discussion!"
                        className="input-dark min-h-[200px] resize-y"
                        maxLength={5000}
                        required
                      />
                      <p className="text-xs text-gray-500">{formData.content.length}/5000 characters</p>
                    </div>

                    {/* Media Attachments */}
                    <div className="space-y-2">
                      <Label className="text-white font-medium">Media Attachments (Optional)</Label>
                      
                      {/* Attachment Previews */}
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
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

                      <input
                        type="file"
                        id="post-media"
                        accept="image/*,video/*,audio/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label htmlFor="post-media">
                        <Button type="button" variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 cursor-pointer" asChild>
                          <span>
                            <Paperclip className="w-4 h-4 mr-2" />
                            Add Photos, Videos, or Audio
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500">
                        Upload images, videos, or audio files (max 50MB each)
                      </p>
                    </div>

                    {/* Submit buttons */}
                    <div className="flex items-center gap-3 pt-4">
                      <Button 
                        type="submit" 
                        disabled={submitting || uploading || !formData.title.trim() || !formData.content.trim() || !formData.category_id}
                        className="button-primary px-8 py-3"
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Uploading Media...
                          </>
                        ) : submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Creating Post...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Create Post
                          </>
                        )}
                      </Button>
                      
                      <Link href="/forum">
                        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 px-6 py-3">
                          Cancel
                        </Button>
                      </Link>
                    </div>
                  </form>

                  {/* Guidelines */}
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-white font-medium mb-3">Community Guidelines</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Be respectful and constructive in your discussions</li>
                      <li>• Stay on topic and choose the appropriate category</li>
                      <li>• Search existing posts before creating duplicate content</li>
                      <li>• Use clear, descriptive titles for better discoverability</li>
                      <li>• Follow our community standards and terms of service</li>
                    </ul>
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
