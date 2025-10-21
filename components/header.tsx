"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconComponent } from "@/components/ui/icons"
import { useRouter } from "next/navigation"
import { EnhancedNotificationCenter } from "@/components/enhanced-notification-center"
import { IntercomButton } from "@/components/intercom-button"
import { Profile, getDisplayName } from "@/lib/utils"
import { useHapticFeedback } from "@/lib/haptics"
import { animations } from "@/lib/animations"
import CustomLoader from "@/components/ui/custom-loader"



export function Header({
  onToggleSidebar,
  onToggleMobileSidebar,
  mobileOpen = false
}: {
  onToggleSidebar?: () => void
  onToggleMobileSidebar?: () => void
  mobileOpen?: boolean
}) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const { success, light } = useHapticFeedback()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Use requestAnimationFrame to ensure we're in the browser
    // This helps prevent hydration errors by delaying the state change
    // until after hydration is complete
    const frame = requestAnimationFrame(() => {
      setIsMounted(true)
    })
    
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (isMounted && user) {
      fetchProfile()
    }
  }, [user, isMounted])

  const fetchProfile = async () => {
    if (!user || !supabase) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!error && data) {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    light()
    setLoading(true)
    try {
      console.log("Header: Initiating sign out...")
      await signOut()
      console.log("Header: Sign out completed")
    } catch (error) {
      console.error("Failed to sign out:", error)
      // Force redirect even if signOut fails
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything during server-side rendering or hydration
  if (!isMounted) return null

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gray-950/95 border-b border-gray-800/50 h-16 sm:h-18 flex-shrink-0 backdrop-blur-xl">
      {/* Mobile Logo - Large and Left-aligned */}
      <div className="flex md:hidden items-center flex-1 overflow-hidden">
        <img src="/logo.png" alt="ONE Logo" className="h-24 w-auto rounded shadow-lg object-cover" />
      </div>

      {/* Desktop Left side - Search */}
      <div className="hidden md:flex items-center gap-3 sm:gap-4 flex-1">
        {/* Search Bar - Desktop Only */}
        <div className="hidden lg:flex items-center flex-1 max-w-md">
          <div className="relative w-full group">
            <IconComponent name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-300" />
            <input
              type="text"
              placeholder="Search releases, artists..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm input-dark focus:ring-white/10 transition-all duration-300"
              onClick={() => light()}
            />
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Intercom Help Button - Hidden on Mobile */}
        <div className="hidden md:block">
          <IntercomButton variant="help" size="sm" />
        </div>
        
        {/* Notifications */}
        <EnhancedNotificationCenter />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full hover-scale press-effect animate-dissolve-in"
              onClick={success}
            >
              <Avatar className="h-9 w-9">
                {profile?.avatar_url && (
                  <AvatarImage 
                    src={profile.avatar_url} 
                    alt={user?.email}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-white font-semibold text-sm border border-gray-600">
                  {profile ? getDisplayName(profile)[0]?.toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={`w-52 sm:w-56 md:w-64 dropdown-content ${animations.slideInTop}`} align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  {profile?.avatar_url && (
                    <AvatarImage 
                      src={profile.avatar_url}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs sm:text-sm border border-gray-600">
                    {profile ? getDisplayName(profile)[0]?.toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-xs sm:text-sm font-medium leading-none text-white font-montserrat">
                    {profile?.full_name || getDisplayName(profile) || "User"}
                  </p>
                  <p className="text-xs leading-none text-gray-400 truncate max-w-[120px] sm:max-w-none">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Online</span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-gray-800/50" />

            <DropdownMenuItem
              className="text-gray-300 hover:bg-gray-800/50 hover:text-white cursor-pointer hover-scale press-effect mx-2 rounded-lg"
              onClick={() => {
                success()
                router.push("/settings")
              }}
            >
              <IconComponent name="user" className="mr-3 h-4 w-4" />
              <span className="font-montserrat">Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-gray-300 hover:bg-gray-800/50 hover:text-white cursor-pointer hover-scale press-effect mx-2 rounded-lg"
              onClick={() => {
                success()
                router.push("/settings")
              }}
            >
              <IconComponent name="settings" className="mr-3 h-4 w-4" />
              <span className="font-montserrat">Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-gray-800/50" />

            <DropdownMenuItem
              className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer hover-scale press-effect mx-2 rounded-lg"
              onClick={handleSignOut}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CustomLoader size="sm" className="mr-3" />
                  <span className="font-montserrat">Signing out...</span>
                </>
              ) : (
                <>
                  <IconComponent name="logout" className="mr-3 h-4 w-4" />
                  <span className="font-montserrat">Sign out</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
