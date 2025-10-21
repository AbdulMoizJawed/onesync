"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useOnboarding } from "@/lib/onboarding"
import { ArrowRight, Play, Compass, X } from "lucide-react"

export function OnboardingWelcome() {
  const router = useRouter()
  const { isNewUser, startOnboarding, skipOnboarding } = useOnboarding()
  const [showWelcome, setShowWelcome] = useState(false)
  
  useEffect(() => {
    // Check if the user is new and hasn't dismissed the welcome screen
    const isUserNew = isNewUser || localStorage.getItem("isNewUser") === "true"
    const hasCompletedOnboarding = localStorage.getItem("onboardingCompleted") === "true"
    const lastShownTime = parseInt(localStorage.getItem("welcomeLastShown") || "0")
    const currentTime = Date.now()
    
    // Only show welcome if:
    // 1. User is new AND
    // 2. Onboarding hasn't been completed AND
    // 3. Welcome hasn't been shown in the last 5 minutes (prevents multiple showings during navigation)
    const shouldShow = isUserNew && 
                      !hasCompletedOnboarding && 
                      (currentTime - lastShownTime > 5 * 60 * 1000)
    
    if (shouldShow) {
      localStorage.setItem("welcomeLastShown", currentTime.toString())
      setShowWelcome(true)
    }
  }, [isNewUser])
  
  if (!showWelcome) {
    return null
  }
  
  const handleStartTour = () => {
    startOnboarding()
    setShowWelcome(false)
  }
  
  const handleSkip = () => {
    skipOnboarding()
    setShowWelcome(false)
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-md w-full p-6 relative">
        <button 
          onClick={handleSkip} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
            <Compass className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to OneSync!</h2>
          <p className="text-gray-300 mb-6">
            We're excited to have you here! Would you like to take a quick tour to learn how to use the platform?
          </p>
          
          <div className="flex flex-col w-full gap-3">
            <Button 
              onClick={handleStartTour}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Play size={16} className="mr-2" />
              Start Tour
            </Button>
            
            <Button 
              onClick={handleSkip}
              variant="outline" 
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ArrowRight size={16} className="mr-2" />
              Skip for Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
