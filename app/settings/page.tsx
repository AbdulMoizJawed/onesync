"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth, supabase } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CustomLoader from "@/components/ui/custom-loader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Save, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from "lucide-react"
import { Profile, generateTempUsername } from "@/lib/utils"

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [changingPassword, setChangingPassword] = useState(false)

  const createProfile = useCallback(async () => {
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
        setError("Failed to create profile")
        return
      }

      setProfile(data)
      setFormData({
        full_name: data.full_name || "",
        username: data.username || "",
        bio: data.bio || "",
      })
    } catch (error) {
      console.error("Error creating profile:", error)
      setError("Failed to create profile")
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchProfile = useCallback(async () => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create one
        await createProfile()
        return
      }

      if (error) {
        console.error("Error fetching profile:", error)
        setError("Failed to load profile")
        return
      }

      setProfile(data)
      setFormData({
        full_name: data.full_name || "",
        username: data.username || "",
        bio: data.bio || "",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }, [user, createProfile])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !supabase) return

    // Validation
    if (!passwordData.currentPassword) {
      setError("Current password is required")
      return
    }

    if (!passwordData.newPassword) {
      setError("New password is required")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError("New password must be different from current password")
      return
    }

    setChangingPassword(true)
    setError("")
    setSuccess("")

    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        console.error("Error updating password:", error)
        setError("Failed to update password. Please check your current password.")
        return
      }

      setSuccess("Password updated successfully!")
      
      // Clear password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error updating password:", error)
      setError("Failed to update password")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user || !profile || !supabase) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      // Delete old avatar if it exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop()
        if (oldPath) {
          await supabase.storage.from("avatars").remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        if (uploadError.message.includes("row-level security policy")) {
          setError("Permission denied. Please make sure the storage bucket is properly configured.")
        } else {
          setError(`Upload failed: ${uploadError.message}`)
        }
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating profile:", updateError)
        setError("Failed to update profile with new avatar")
        return
      }

      // Update user metadata so header avatar updates immediately
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl
        }
      })

      if (metadataError) {
        console.error("Error updating user metadata:", metadataError)
        // Don't return error here as profile was updated successfully
        // The avatar will still work, just might need a refresh
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null))
      setSuccess("Avatar updated successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setError("Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || !supabase) return

    // Validate username
    if (!formData.username.trim()) {
      setError("Username is required")
      return
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long")
      return
    }

    if (formData.username.length > 20) {
      setError("Username must be 20 characters or less")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores")
      return
    }

    if (formData.username.startsWith('_') || formData.username.endsWith('_')) {
      setError("Username cannot start or end with an underscore")
      return
    }

    if (/_{2,}/.test(formData.username)) {
      setError("Username cannot contain consecutive underscores")
      return
    }

    // Check for reserved usernames
    const reservedUsernames = ['admin', 'administrator', 'root', 'api', 'www', 'support', 'help', 'test', 'demo', 'null', 'undefined']
    if (reservedUsernames.includes(formData.username.toLowerCase())) {
      setError("This username is reserved and cannot be used")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim() || null,
          username: formData.username.trim(),
          bio: formData.bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error updating profile:", error)
        if (error.code === "23505" && error.message.includes("username")) {
          setError("Username is already taken. Please choose a different one.")
        } else {
          setError("Failed to update profile")
        }
        return
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: formData.full_name.trim() || null,
              username: formData.username.trim(),
              bio: formData.bio.trim() || null,
              updated_at: new Date().toISOString(),
            }
          : null,
      )

      setSuccess("Profile updated successfully! Redirecting to forum...")

      // Redirect to forum after 1.5 seconds
      setTimeout(() => {
        router.push("/forum")
      }, 1500)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
    } finally {
      setSaving(false)
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
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Profile Settings</h1>
                <p className="text-gray-400">Manage your account information and preferences</p>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-950/50 border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-200">{success}</AlertDescription>
                </Alert>
              )}

              <div className="max-w-2xl mx-auto">
                <Card className="card-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-purple-600 text-white text-xl">
                          {(formData.username || formData.full_name || "U")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <CustomLoader size="sm" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-2">Profile Picture</h3>
                      <p className="text-gray-400 text-sm mb-3">Upload a profile picture to personalize your account</p>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          id="avatar-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploading}
                          className="border-gray-700 text-white hover:bg-gray-800 bg-transparent"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? "Uploading..." : "Upload Image"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name" className="text-white mb-2 block">
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange("full_name", e.target.value)}
                          placeholder="Enter your full name"
                          className="input-dark"
                        />
                      </div>

                      <div>
                        <Label htmlFor="username" className="text-white mb-2 block">
                          Username *
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange("username", e.target.value)}
                          placeholder="Enter your username"
                          className="input-dark"
                          required
                          minLength={3}
                          pattern="[a-zA-Z0-9_]+"
                          title="Username can only contain letters, numbers, and underscores"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Username must be at least 3 characters and contain only letters, numbers, and underscores
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white mb-2 block">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="input-dark opacity-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-white mb-2 block">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleInputChange("bio", e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="input-dark min-h-[100px] resize-y"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={saving} className="button-primary">
                        {saving ? (
                          <>
                            <CustomLoader size="sm" className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                  </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="card-dark mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword" className="text-white mb-2 block">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                            placeholder="Enter your current password"
                            className="input-dark pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="newPassword" className="text-white mb-2 block">
                          New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                            placeholder="Enter your new password"
                            className="input-dark pr-10"
                            required
                            minLength={6}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Password must be at least 6 characters long
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword" className="text-white mb-2 block">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                            placeholder="Confirm your new password"
                            className="input-dark pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          disabled={changingPassword} 
                          className="button-primary"
                        >
                          {changingPassword ? (
                            <>
                              <CustomLoader size="sm" className="mr-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
