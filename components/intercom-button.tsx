"use client"

import { MessageCircle, HelpCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SupportButtonProps {
  variant?: "default" | "help" | "minimal"
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function SupportButton({ 
  variant = "default", 
  size = "md", 
  className,
  text
}: SupportButtonProps) {

  // Open email app to support@onesync.music
  const handleClick = () => {
    window.location.href = 'mailto:support@onesync.music?subject=Support Request from OneSync Platform'
  }

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }

  if (variant === "help") {
    return (
      <Button
        onClick={handleClick}
        variant="outline"
        size="sm"
        className={cn(
          "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700",
          sizeClasses[size],
          className
        )}
      >
        <HelpCircle className={cn("mr-2", iconSizes[size])} />
        {text || "Help & Support"}
      </Button>
    )
  }

  if (variant === "minimal") {
    return (
      <Button
        onClick={handleClick}
        variant="ghost"
        size="sm"
        className={cn(
          "text-gray-400 hover:text-white",
          sizeClasses[size],
          className
        )}
      >
        <MessageCircle className={iconSizes[size]} />
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "bg-blue-600 hover:bg-blue-700 text-white",
        sizeClasses[size],
        className
      )}
    >
      <MessageCircle className={cn("mr-2", iconSizes[size])} />
      {text || "Email Support"}
    </Button>
  )
}

// Floating action button for constant access to support
export function SupportFloatingButton() {
  const handleClick = () => {
    window.location.href = 'mailto:support@onesync.music?subject=Support Request from OneSync Platform'
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 left-6 md:bottom-6 md:left-auto md:right-6 z-40 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full p-4 shadow-lg shadow-indigo-900/50 transition-all duration-200 hover:scale-105"
      aria-label="Email support"
      title="Email support@onesync.music"
    >
      <Mail className="w-6 h-6" />
    </button>
  )
}

// Legacy export names for backward compatibility
export const IntercomButton = SupportButton
export const IntercomFloatingButton = SupportFloatingButton
