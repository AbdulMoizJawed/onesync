'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, Eye, EyeOff, Shield, Users, Info, CheckCircle, XCircle } from 'lucide-react'
import { ForumProfileManager, type EnhancedProfile, DEFAULT_FORUM_PRIVACY } from '@/lib/forum-profile'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ForumPrivacySettingsProps {
  profile: EnhancedProfile | null
  onProfileUpdate?: (profile: EnhancedProfile) => void
}

export function ForumPrivacySettings({ profile, onProfileUpdate }: ForumPrivacySettingsProps) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [forumSettings, setForumSettings] = useState(DEFAULT_FORUM_PRIVACY)
  const [forumDisplayName, setForumDisplayName] = useState('')
  const [previewData, setPreviewData] = useState<{
    displayName: string
    avatarUrl: string | null
    bio: string | null
    initials: string
  } | null>(null)

  useEffect(() => {
    if (profile) {
      const privacy = profile.forum_privacy || DEFAULT_FORUM_PRIVACY
      setForumSettings({
        use_real_name: privacy.use_real_name,
        show_avatar: privacy.show_avatar,
        show_bio: privacy.show_bio,
        use_separate_forum_avatar: privacy.use_separate_forum_avatar,
        forum_avatar_url: privacy.forum_avatar_url ?? null,
        forum_display_name: privacy.forum_display_name ?? null
      })
      setForumDisplayName(privacy.forum_display_name || '')
      updatePreview(profile, {
        use_real_name: privacy.use_real_name,
        show_avatar: privacy.show_avatar,
        show_bio: privacy.show_bio,
        use_separate_forum_avatar: privacy.use_separate_forum_avatar,
        forum_avatar_url: privacy.forum_avatar_url ?? null,
        forum_display_name: privacy.forum_display_name ?? null
      })
    }
  }, [profile])

  const updatePreview = (currentProfile: EnhancedProfile, settings = forumSettings) => {
    const updatedProfile = {
      ...currentProfile,
      forum_privacy: {
        ...settings,
        forum_display_name: forumDisplayName || settings.forum_display_name
      }
    }
    const displayData = ForumProfileManager.getForumDisplayData(updatedProfile)
    setPreviewData({
      ...displayData,
      initials: ForumProfileManager.generateAvatarFallback(displayData.displayName)
    })
  }

  const handleSettingChange = (key: keyof typeof forumSettings, value: boolean) => {
    const newSettings = { ...forumSettings, [key]: value }
    setForumSettings(newSettings)
    if (profile) {
      updatePreview(profile, newSettings)
    }
  }

  const handleDisplayNameChange = (value: string) => {
    setForumDisplayName(value)
    if (profile) {
      updatePreview(profile)
    }
  }

  const handleForumAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `forum-avatar-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      const newSettings = {
        ...forumSettings,
        use_separate_forum_avatar: true,
        forum_avatar_url: publicUrl
      }
      setForumSettings(newSettings)
      
      if (profile) {
        updatePreview(profile, newSettings)
      }

      toast.success('Forum avatar uploaded successfully')
    } catch (error) {
      console.error('Error uploading forum avatar:', error)
      toast.error('Failed to upload forum avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const result = await ForumProfileManager.updateForumPrivacy(user.id, {
        ...forumSettings,
        forum_display_name: forumDisplayName.trim() || null
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Update the profile state
      if (profile && onProfileUpdate) {
        const updatedProfile = {
          ...profile,
          forum_privacy: {
            ...forumSettings,
            forum_display_name: forumDisplayName.trim() || null
          },
          updated_at: new Date().toISOString()
        }
        onProfileUpdate(updatedProfile)
      }

      toast.success('Forum privacy settings saved successfully')
    } catch (error) {
      console.error('Error saving forum privacy settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const isForumReady = profile ? ForumProfileManager.isForumReady({
    ...profile,
    forum_privacy: {
      ...forumSettings,
      forum_display_name: forumDisplayName.trim() || null
    }
  }) : false

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Loading profile settings...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Forum Readiness Status */}
      <Alert className={isForumReady ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"}>
        <div className="flex items-center gap-2">
          {isForumReady ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-yellow-600" />
          )}
          <AlertDescription className={isForumReady ? "text-green-800" : "text-yellow-800"}>
            {isForumReady 
              ? "Your forum profile is ready! You can participate in discussions." 
              : "Complete your forum profile setup to participate in discussions."
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Profile Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Forum Profile Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewData && (
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarImage src={previewData.avatarUrl || ''} />
                <AvatarFallback className="bg-purple-600 text-white">
                  {previewData.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{previewData.displayName}</div>
                {previewData.bio && (
                  <div className="text-sm text-gray-600 mt-1">{previewData.bio}</div>
                )}
                <Badge variant="secondary" className="mt-2 text-xs">
                  This is how you'll appear in forum posts
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Forum Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Name Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Use Real Name in Forum</Label>
                <p className="text-xs text-gray-500">Show your real name instead of username</p>
              </div>
              <Switch
                checked={forumSettings.use_real_name}
                onCheckedChange={(checked) => handleSettingChange('use_real_name', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forum-display-name" className="text-sm font-medium">
                Custom Forum Display Name (Optional)
              </Label>
              <Input
                id="forum-display-name"
                placeholder="Leave empty to use real name or username"
                value={forumDisplayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                className="max-w-sm"
              />
              <p className="text-xs text-gray-500">
                Override your default name with a custom display name for the forum
              </p>
            </div>
          </div>

          <Separator />

          {/* Avatar Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Show Avatar in Forum</Label>
                <p className="text-xs text-gray-500">Display your profile picture in forum posts</p>
              </div>
              <Switch
                checked={forumSettings.show_avatar}
                onCheckedChange={(checked) => handleSettingChange('show_avatar', checked)}
              />
            </div>

            {forumSettings.show_avatar && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Use Separate Forum Avatar</Label>
                    <p className="text-xs text-gray-500">Use a different avatar for forum posts</p>
                  </div>
                  <Switch
                    checked={forumSettings.use_separate_forum_avatar}
                    onCheckedChange={(checked) => handleSettingChange('use_separate_forum_avatar', checked)}
                  />
                </div>

                {forumSettings.use_separate_forum_avatar && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Upload Forum Avatar</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={forumSettings.forum_avatar_url || ''} />
                        <AvatarFallback className="bg-gray-200">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleForumAvatarUpload}
                          className="hidden"
                          id="forum-avatar-upload"
                          disabled={uploading}
                        />
                        <label htmlFor="forum-avatar-upload">
                          <Button asChild variant="outline" disabled={uploading}>
                            <span>
                              {uploading ? 'Uploading...' : 'Choose File'}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Bio Settings */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Bio in Forum</Label>
              <p className="text-xs text-gray-500">Display your bio in your forum profile</p>
            </div>
            <Switch
              checked={forumSettings.show_bio}
              onCheckedChange={(checked) => handleSettingChange('show_bio', checked)}
            />
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save Privacy Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>Privacy First:</strong> You control what information is shared in the forum. 
          You can always change these settings later. Your email address is never shown in the forum.
        </AlertDescription>
      </Alert>
    </div>
  )
}
