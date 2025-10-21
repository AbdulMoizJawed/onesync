"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { toast } from "sonner"
import { Shield, Check, Clock, AlertTriangle } from "lucide-react"

interface ProfileUpdateFormProps {
  currentProfile?: any
  onUpdateSuccess?: () => void
}

export function SecureProfileUpdate({ 
  currentProfile, 
  onUpdateSuccess 
}: ProfileUpdateFormProps) {
  const [formData, setFormData] = useState({
    full_name: currentProfile?.full_name || '',
    username: currentProfile?.username || '',
    bio: currentProfile?.bio || '',
    avatar_url: currentProfile?.avatar_url || '',
    genre: currentProfile?.genre || '',
    location: currentProfile?.location || '',
    instagram_handle: currentProfile?.instagram_handle || '',
    twitter_handle: currentProfile?.twitter_handle || '',
  })
  
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determine which fields require approval
  const requiresApproval = (field: string, newValue: string) => {
    if (field === 'username' && currentProfile?.username !== newValue) {
      return true
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Filter out unchanged fields
      const updates = Object.entries(formData).reduce((acc: any, [key, value]) => {
        if (currentProfile?.[key] !== value && value.trim() !== '') {
          acc[key] = value.trim()
        }
        return acc
      }, {})

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save')
        return
      }

      // Check if username change requires reason
      if (updates.username && !reason.trim()) {
        toast.error('Username changes require a reason')
        return
      }

      const response = await fetch('/api/profile/update-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates,
          reason: reason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      if (data.requiresApproval) {
        toast.success('Profile update request submitted for review')
        toast.info('You will be notified when your request is processed')
      } else {
        toast.success('Profile updated successfully')
        onUpdateSuccess?.()
      }

      // Reset reason field after successful submission
      setReason('')
      
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasUsernameChange = formData.username !== currentProfile?.username

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Secure Profile Update
        </CardTitle>
        <CardDescription>
          Update your profile information. Some changes may require admin approval for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="username" className="flex items-center gap-1">
                Username 
                {hasUsernameChange && (
                  <span title="Requires approval">
                    <Clock className="h-3 w-3 text-amber-500" />
                  </span>
                )}
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="mt-1"
                placeholder="Choose a unique username"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="mt-1"
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                className="mt-1"
                placeholder="Hip-Hop, Pop, Rock, etc."
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1"
                placeholder="City, Country"
              />
            </div>

            <div>
              <Label htmlFor="instagram_handle">Instagram Handle</Label>
              <Input
                id="instagram_handle"
                value={formData.instagram_handle}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
                className="mt-1"
                placeholder="@username (without @)"
              />
            </div>

            <div>
              <Label htmlFor="twitter_handle">Twitter Handle</Label>
              <Input
                id="twitter_handle"
                value={formData.twitter_handle}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter_handle: e.target.value }))}
                className="mt-1"
                placeholder="@username (without @)"
              />
            </div>
          </div>

          {hasUsernameChange && (
            <div>
              <Label htmlFor="reason">Reason for username change *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
                placeholder="Please explain why you want to change your username..."
                required
              />
            </div>
          )}

          {hasUsernameChange && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700">
                  <strong>Username Change Notice:</strong> Username changes require admin approval 
                  for security reasons. Other profile updates will be applied immediately.
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  {hasUsernameChange ? 'Submitting Request...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {hasUsernameChange ? 'Submit for Review' : 'Update Profile'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
