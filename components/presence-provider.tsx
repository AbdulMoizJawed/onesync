"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !supabase) return

    // Update presence immediately
    const updatePresence = async () => {
      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", user.id)
    }

    // Initial update
    updatePresence()

    // Update every 5 seconds
    const interval = setInterval(updatePresence, 10000)

    // Update when user becomes active (clicks, moves mouse, etc)
    const handleActivity = () => {
      updatePresence()
    }

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('scroll', handleActivity)

    // Update when page visibility changes (user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePresence()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  return <>{children}</>
}