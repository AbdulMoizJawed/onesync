"use client"

import { useEffect, useState } from "react"

interface ClientTimeProps {
  timestamp: string
  className?: string
}

export function ClientTime({ timestamp, className }: ClientTimeProps) {
  const [timeAgo, setTimeAgo] = useState("Just now")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateTime = () => {
      const now = new Date()
      const time = new Date(timestamp)
      const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) setTimeAgo("Just now")
      else if (diffInMinutes < 60) setTimeAgo(`${diffInMinutes} minutes ago`)
      else if (diffInMinutes < 1440) setTimeAgo(`${Math.floor(diffInMinutes / 60)} hours ago`)
      else setTimeAgo(`${Math.floor(diffInMinutes / 1440)} days ago`)
    }

    updateTime()
    
    // Update every minute
    const interval = setInterval(updateTime, 60000)
    
    return () => clearInterval(interval)
  }, [timestamp])

  if (!mounted) {
    return <span className={className}>Just now</span>
  }

  return <span className={className} suppressHydrationWarning>{timeAgo}</span>
}