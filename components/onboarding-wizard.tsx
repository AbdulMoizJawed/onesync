"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth, supabase } from "@/lib/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Music, Upload, BarChart3, User, Camera, AlertCircle } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { generateTempUsername } from "@/lib/utils"

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || "",
    username: "",
    bio: "",
    avatar_url: ""
  })

  const steps = [
    {
      id: "welcome",
      title: "Welcome to OneSync!",
      description: "Let's set up your artist profile",
      icon: Music,
      content: "Welcome to your music distribution platform! Let's create your artist profile to get you started on your musical journey."
    },
    {
      id: "profile",
      title: "Your Artist Profile",
      description: "Tell us about yourself",
      icon: User,
      content: "profile_form"
    },
    {
      id: "photo",
      title: "Profile Photo",
      description: "Add your artist photo",
      icon: Camera,
      content: "photo_upload"
    },
    {
      id: "complete",
      title: "All Set!",
      description: "Your profile is ready",
      icon: CheckCircle,
      content: "You're all set! Start uploading your music and track your analytics."
    }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user || !supabase) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setError("Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  const validateStep = () => {
    const step = steps[currentStep]
    
    if (step.id === "profile") {
      if (!formData.full_name.trim()) {
        setError("Please enter your artist name")
        return false
      }
      if (!formData.username.trim()) {
        setError("Please enter a username")
        return false
      }
      if (formData.username.length < 3) {
        setError("Username must be at least 3 characters")
        return false
      }
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setError("Username can only contain letters, numbers, and underscores")
        return false
      }
    }
    
    setError("")
    return true
  }

  const saveProfile = async () => {
    if (!user || !supabase) return false

    try {
      setLoading(true)
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      const profileData = {
        id: user.id,
        email: user.email || "",
        full_name: formData.full_name.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim() || null,
        avatar_url: formData.avatar_url || null,
        updated_at: new Date().toISOString()
      }

      if (existingProfile) {
        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", user.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert([{ ...profileData, created_at: new Date().toISOString() }])
        
        if (error) throw error
      }

      // Update user metadata
      if (formData.avatar_url) {
        await supabase.auth.updateUser({
          data: { avatar_url: formData.avatar_url }
        })
      }

      return true
    } catch (error: any) {
      console.error("Error saving profile:", error)
      if (error.code === "23505" && error.message.includes("username")) {
        setError("Username is already taken. Please choose a different one.")
      } else {
        setError("Failed to save profile. Please try again.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const nextStep = async () => {
    if (!validateStep()) return

    const step = steps[currentStep]
    
    // Save profile data when moving past profile step
    if (step.id === "profile") {
      const success = await saveProfile()
      if (!success) return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Mark onboarding as complete
      localStorage.setItem("onboardingCompleted", "true")
      onClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError("")
    }
  }

  const step = steps[currentStep]
  const Icon = step.icon

  // Generate username suggestion ONLY ONCE when profile step loads
  useEffect(() => {
    if (step.id === "profile" && !formData.username && user) {
      const suggestion = generateTempUsername(user.id)
      setFormData(prev => ({ ...prev, username: suggestion }))
    }
  }, [step.id, user])

  const renderStepContent = () => {
    if (step.content === "profile_form") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name" className="text-sm font-medium text-gray-200">
              Artist Name *
            </Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="Enter your artist name"
              className="mt-1 bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="username" className="text-sm font-medium text-gray-200">
              Username *
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="Enter your username"
              className="mt-1 bg-gray-800 border-gray-700 text-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be your unique identifier on the platform
            </p>
          </div>
          
          <div>
            <Label htmlFor="bio" className="text-sm font-medium text-gray-200">
              Bio (Optional)
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about your music..."
              className="mt-1 bg-gray-800 border-gray-700 text-white resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/200 characters
            </p>
          </div>
        </div>
      )
    }
    
    if (step.content === "photo_upload") {
      return (
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback className="bg-purple-600 text-white text-xl">
                {(formData.full_name || formData.username || "A")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {uploading && (
              <div className="mb-4">
                <CustomLoader size="sm" />
                <p className="text-sm text-gray-400 mt-2">Uploading...</p>
              </div>
            )}
            
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border-gray-700 text-white hover:bg-gray-800 bg-transparent"
              >
                <Upload className="w-4 h-4 mr-2" />
                {formData.avatar_url ? "Change Photo" : "Upload Photo"}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Optional - You can add this later in settings
              </p>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <p className="text-sm text-gray-300 text-center py-4">
        {step.content}
      </p>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Icon className="w-5 h-5" />
            {step.title}
          </DialogTitle>
        </DialogHeader>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-300">
              {step.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-950/50 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}
            
            {renderStepContent()}
            
            <div className="flex justify-between items-center mt-6">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    className="border-gray-700 text-white hover:bg-gray-700"
                  >
                    Previous
                  </Button>
                )}
                <Button 
                  onClick={nextStep}
                  disabled={loading || uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <CustomLoader size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    'Complete'
                  ) : (
                    'Next'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
