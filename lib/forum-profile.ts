/**
 * Enhanced Profile Privacy and Forum Integration
 * Manages user profile data with privacy controls for forum participation
 */

import { supabase } from "@/lib/supabase"

// Enhanced Profile type with privacy controls
export interface EnhancedProfile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
  
  // Privacy settings for forum
  forum_privacy: {
    use_real_name: boolean          // Use real name vs username in forum
    show_avatar: boolean            // Show avatar in forum posts
    show_bio: boolean               // Show bio in forum profile
    use_separate_forum_avatar: boolean // Use different avatar for forum
    forum_avatar_url?: string | null // Separate forum avatar
    forum_display_name?: string | null // Custom forum display name
  }
  
  // Forum-specific settings
  forum_settings: {
    email_notifications: boolean
    mention_notifications: boolean
    auto_subscribe_posts: boolean
    show_online_status: boolean
  }
}

// Default privacy settings (privacy-first approach, but lenient for existing users)
export const DEFAULT_FORUM_PRIVACY = {
  use_real_name: true,
  show_avatar: false, // Changed to false to allow users without avatars to post
  show_bio: true,
  use_separate_forum_avatar: false,
  forum_avatar_url: null as string | null,
  forum_display_name: null as string | null
}

export const DEFAULT_FORUM_SETTINGS = {
  email_notifications: true,
  mention_notifications: true,
  auto_subscribe_posts: false,
  show_online_status: false
}

export class ForumProfileManager {
  /**
   * Get the display data for forum posts, respecting privacy settings
   */
  static getForumDisplayData(profile: EnhancedProfile): {
    displayName: string
    avatarUrl: string | null
    bio: string | null
    showFullProfile: boolean
  } {
    const privacy = profile.forum_privacy || DEFAULT_FORUM_PRIVACY
    
    // Determine display name
    let displayName: string
    if (privacy.forum_display_name) {
      displayName = privacy.forum_display_name
    } else if (privacy.use_real_name && profile.full_name) {
      displayName = profile.full_name
    } else if (profile.username) {
      displayName = profile.username
    } else {
      displayName = `User ${profile.id.substring(0, 8)}`
    }
    
    // Determine avatar
    let avatarUrl: string | null = null
    if (privacy.show_avatar) {
      if (privacy.use_separate_forum_avatar && privacy.forum_avatar_url) {
        avatarUrl = privacy.forum_avatar_url
      } else {
        avatarUrl = profile.avatar_url
      }
    }
    
    // Determine bio visibility
    const bio = privacy.show_bio ? profile.bio : null
    
    return {
      displayName,
      avatarUrl,
      bio,
      showFullProfile: privacy.show_bio || privacy.use_real_name
    }
  }

  /**
   * Check if profile is complete for forum participation
   * Lenient approach to allow existing users to post
   */
  static isForumReady(profile: EnhancedProfile): boolean {
    const privacy = profile.forum_privacy || DEFAULT_FORUM_PRIVACY
    
    // Must have some form of display name - be very lenient
    const hasDisplayName = !!(
      privacy.forum_display_name ||
      (privacy.use_real_name && profile.full_name) ||
      profile.username ||
      profile.id // Fallback to user ID if nothing else
    )
    
    // Avatar is optional - only required if they explicitly want to show one AND don't have one
    // This allows users without avatars to post by default
    const avatarRequirement = !privacy.show_avatar || !!(
      (privacy.use_separate_forum_avatar && privacy.forum_avatar_url) ||
      profile.avatar_url
    )
    
    // For existing users without forum_privacy, be extra lenient
    if (!profile.forum_privacy) {
      // Just need some form of identifier (username or fallback)
      return !!(profile.username || profile.full_name || profile.id)
    }
    
    return hasDisplayName && avatarRequirement
  }

  /**
   * Create or update forum privacy settings
   */
  static async updateForumPrivacy(
    userId: string, 
    privacySettings: Partial<EnhancedProfile['forum_privacy']>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not available' }
      }

      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('forum_privacy')
        .eq('id', userId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Merge with existing settings
      const currentPrivacy = profile?.forum_privacy || DEFAULT_FORUM_PRIVACY
      const updatedPrivacy = { ...currentPrivacy, ...privacySettings }

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          forum_privacy: updatedPrivacy,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Migrate existing profile to enhanced profile with privacy controls
   */
  static async migrateToEnhancedProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not available' }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          forum_privacy: DEFAULT_FORUM_PRIVACY,
          forum_settings: DEFAULT_FORUM_SETTINGS,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Generate avatar fallback based on display name
   */
  static generateAvatarFallback(displayName: string): string {
    const initials = displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
    
    return initials || 'U'
  }

  /**
   * Get forum post author data for display
   */
  static async getForumAuthorData(userIds: string[]): Promise<Map<string, {
    displayName: string
    avatarUrl: string | null
    bio: string | null
    initials: string
  }>> {
    if (userIds.length === 0) return new Map()

    try {
      if (!supabase) {
        console.warn('Supabase client not available for forum author data')
        return new Map()
      }

      console.log('🔍 Fetching forum author data for', userIds.length, 'users')

      // First try with forum_privacy column, fallback to basic columns if it doesn't exist
      let { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio, forum_privacy')
        .in('id', userIds)

      if (error) {
        console.warn('Forum author data query error:', error.message)
        
        if (error.message?.includes('column "forum_privacy" does not exist') || error.message?.includes('column profiles.forum_privacy does not exist')) {
          console.log('🔄 forum_privacy column does not exist, using basic profile data')
          // Fallback to basic profile data
          const { data: basicProfiles, error: basicError } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, bio')
            .in('id', userIds)

          if (basicError) {
            console.error('Error fetching basic forum author data:', basicError)
            return new Map()
          }

          profiles = basicProfiles?.map(profile => ({
            ...profile,
            forum_privacy: DEFAULT_FORUM_PRIVACY
          }))
        } else {
          console.error('Error fetching forum author data:', error)
          return new Map()
        }
      }

      if (!profiles || profiles.length === 0) {
        console.warn('No profile data returned for forum authors')
        return new Map()
      }

      const authorMap = new Map()

      profiles.forEach((profile: any) => {
        try {
          const forumData = this.getForumDisplayData(profile as EnhancedProfile)
          authorMap.set(profile.id, {
            ...forumData,
            initials: this.generateAvatarFallback(forumData.displayName)
          })
        } catch (profileError) {
          console.warn('Error processing profile data for user', profile.id, ':', profileError)
          // Add fallback data for this user
          authorMap.set(profile.id, {
            displayName: profile.full_name || profile.username || `User ${profile.id.substring(0, 8)}`,
            avatarUrl: profile.avatar_url || null,
            bio: profile.bio || null,
            initials: this.generateAvatarFallback(profile.full_name || profile.username || 'User')
          })
        }
      })

      console.log('✅ Successfully processed', authorMap.size, 'forum author profiles')
      return authorMap
    } catch (error) {
      console.error('Error in getForumAuthorData:', error)
      return new Map()
    }
  }
}

// Export utility functions for backward compatibility
export function getForumDisplayName(profile: EnhancedProfile): string {
  return ForumProfileManager.getForumDisplayData(profile).displayName
}

export function isForumProfileComplete(profile: EnhancedProfile): boolean {
  return ForumProfileManager.isForumReady(profile)
}

export function getForumAvatarUrl(profile: EnhancedProfile): string | null {
  return ForumProfileManager.getForumDisplayData(profile).avatarUrl
}
