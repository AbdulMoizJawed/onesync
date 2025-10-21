"use client"

import { useEffect } from 'react'
import { useIntercom } from '@/lib/intercom'
import { useAuth } from '@/lib/auth'

/**
 * Example component showing how to use Intercom events and tracking
 * This can be used throughout your app to track user interactions
 */
export function IntercomTrackingExample() {
  const { trackEvent, updateUser } = useIntercom()
  const { user } = useAuth()

  // Example: Track when user views dashboard
  useEffect(() => {
    if (user) {
      trackEvent('viewed_dashboard', {
        userId: user.id,
        timestamp: new Date().toISOString(),
        page: 'dashboard'
      })
    }
  }, [user, trackEvent])

  // Example: Track when user uploads music
  const handleMusicUpload = () => {
    trackEvent('music_uploaded', {
      userId: user?.id,
      action: 'upload',
      category: 'music',
      timestamp: new Date().toISOString()
    })
    
    // You can also update user attributes when they perform actions
    updateUser({
      last_upload_date: new Date().toISOString(),
      upload_count: 1 // You would increment this based on your data
    })
  }

  // Example: Track subscription changes
  const handleSubscriptionChange = (plan: string) => {
    trackEvent('subscription_changed', {
      userId: user?.id,
      new_plan: plan,
      timestamp: new Date().toISOString()
    })
    
    updateUser({
      subscription_plan: plan,
      subscription_date: new Date().toISOString()
    })
  }

  // Example: Track analytics views
  const handleAnalyticsView = (section: string) => {
    trackEvent('analytics_viewed', {
      userId: user?.id,
      section: section,
      timestamp: new Date().toISOString()
    })
  }

  return null // This is a tracking component, no UI needed
}

// Example usage in your upload component:
export function ExampleUploadComponent() {
  const { trackEvent, showNewMessage } = useIntercom()
  const { user } = useAuth()

  const handleFileUpload = async (file: File) => {
    try {
      // Your upload logic here
      console.log('Uploading file:', file.name)
      
      // Track successful upload
      trackEvent('file_uploaded', {
        userId: user?.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      // Track upload errors and suggest user contact support
      trackEvent('upload_error', {
        userId: user?.id,
        fileName: file.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      
      // Offer to start a conversation about the error
      showNewMessage(`I'm having trouble uploading my file "${file.name}". Can you help me troubleshoot this issue?`)
    }
  }

  const handleGetSupport = () => {
    // Start a conversation with context
    showNewMessage("I need help with uploading my music. Can someone assist me with the upload process?")
  }

  return (
    <div className="p-4">
      <h3 className="text-white mb-4">Example Upload Component</h3>
      <button
        onClick={() => handleFileUpload(new File([''], 'example.mp3', { type: 'audio/mpeg' }))}
        className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
      >
        Simulate Upload
      </button>
      <button
        onClick={handleGetSupport}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Get Upload Help
      </button>
    </div>
  )
}

// Example of updating user attributes when profile changes
export function useUpdateIntercomUser() {
  const { updateUser } = useIntercom()
  const { user } = useAuth()

  const updateUserProfile = (profileData: any) => {
    if (user) {
      updateUser({
        user_id: user.id,
        name: profileData.full_name || user.email || 'User',
        email: user.email || '',
        custom_attributes: {
          plan: profileData.subscription_plan || 'free',
          artist_count: profileData.artist_count || 0,
          release_count: profileData.release_count || 0,
          total_streams: profileData.total_streams || 0,
          signup_date: user.created_at,
          last_login: new Date().toISOString(),
          platform: 'web'
        }
      })
    }
  }

  return { updateUserProfile }
}
