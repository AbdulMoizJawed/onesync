"use client"

import React, { useState } from "react"
import { OptimizedImage } from "./optimized-image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  Link, 
  Plus, 
  X, 
  Eye, 
  Copy, 
  ExternalLink,
  Instagram,
  Twitter,
  Youtube,
  Music,
  Globe,
  Mail,
  Phone,
  MapPin
} from "lucide-react"

interface ArtistLinkPageBuilderProps {
  isOpen: boolean
  onClose: () => void
}

interface SocialLink {
  platform: string
  url: string
  icon: React.ReactNode
  enabled: boolean
}

interface MusicLink {
  platform: string
  url: string
  icon: React.ReactNode
  enabled: boolean
}

export function ArtistLinkPageBuilder({ isOpen, onClose }: ArtistLinkPageBuilderProps) {
  const [artistName, setArtistName] = useState("")
  const [bio, setBio] = useState("")
  const [profileImage, setProfileImage] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { platform: "Instagram", url: "", icon: <Instagram className="w-4 h-4" />, enabled: false },
    { platform: "Twitter", url: "", icon: <Twitter className="w-4 h-4" />, enabled: false },
    { platform: "TikTok", url: "", icon: <Music className="w-4 h-4" />, enabled: false },
    { platform: "YouTube", url: "", icon: <Youtube className="w-4 h-4" />, enabled: false },
  ])

  const [musicLinks, setMusicLinks] = useState<MusicLink[]>([
    { platform: "Spotify", url: "", icon: <Music className="w-4 h-4" />, enabled: false },
    { platform: "Apple Music", url: "", icon: <Music className="w-4 h-4" />, enabled: false },
    { platform: "SoundCloud", url: "", icon: <Music className="w-4 h-4" />, enabled: false },
    { platform: "Bandcamp", url: "", icon: <Music className="w-4 h-4" />, enabled: false },
  ])

  const [theme, setTheme] = useState("dark")

  const updateSocialLink = (index: number, field: "url" | "enabled", value: string | boolean) => {
    setSocialLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ))
  }

  const updateMusicLink = (index: number, field: "url" | "enabled", value: string | boolean) => {
    setMusicLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ))
  }

  const generateUrl = () => {
    if (artistName) {
      const cleanName = artistName.toLowerCase().replace(/[^a-z0-9]/g, '')
      setCustomUrl(`onesync.music/${cleanName}`)
    }
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${customUrl}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[95vh] overflow-y-auto bg-gray-900 border-gray-700 mx-2 sm:mx-4 px-2 sm:px-6 py-4 sm:py-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white text-xl sm:text-2xl font-bold">Artist Link Page Builder</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm sm:text-base">
            Create a professional landing page with all your important links
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 py-2 sm:py-4">
          {/* Configuration Panel */}
          <div className="space-y-4 sm:space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800 text-xs sm:text-sm">
                <TabsTrigger value="basic" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">Basic Info</TabsTrigger>
                <TabsTrigger value="social" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">Social</TabsTrigger>
                <TabsTrigger value="music" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">Music</TabsTrigger>
              </TabsList>              <TabsContent value="basic" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="artistName" className="text-gray-200 text-sm">Artist Name</Label>
                    <Input
                      id="artistName"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Your artist name"
                      className="bg-gray-800 border-gray-700 text-gray-100 text-sm sm:text-base mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-gray-200 text-sm">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell your story..."
                      className="bg-gray-800 border-gray-700 text-gray-100 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="profileImage" className="text-gray-200 text-sm">Profile Image URL</Label>
                    <Input
                      id="profileImage"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      placeholder="https://..."
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-gray-200">Email</Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@..."
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-200">Phone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-gray-200">Location</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, State"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="links" className="space-y-4 mt-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-3">Music Platforms</h4>
                    <div className="space-y-3">
                      {musicLinks.map((link, index) => (
                        <div key={link.platform} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                          <Switch
                            checked={link.enabled}
                            onCheckedChange={(checked) => updateMusicLink(index, "enabled", checked)}
                          />
                          <div className="flex items-center gap-2 flex-shrink-0 w-24">
                            {link.icon}
                            <span className="text-gray-300 text-sm">{link.platform}</span>
                          </div>
                          <Input
                            value={link.url}
                            onChange={(e) => updateMusicLink(index, "url", e.target.value)}
                            placeholder={`Your ${link.platform} URL`}
                            className="bg-gray-700 border-gray-600 text-gray-100 text-sm"
                            disabled={!link.enabled}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">Social Media</h4>
                    <div className="space-y-3">
                      {socialLinks.map((link, index) => (
                        <div key={link.platform} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                          <Switch
                            checked={link.enabled}
                            onCheckedChange={(checked) => updateSocialLink(index, "enabled", checked)}
                          />
                          <div className="flex items-center gap-2 flex-shrink-0 w-24">
                            {link.icon}
                            <span className="text-gray-300 text-sm">{link.platform}</span>
                          </div>
                          <Input
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                            placeholder={`Your ${link.platform} URL`}
                            className="bg-gray-700 border-gray-600 text-gray-100 text-sm"
                            disabled={!link.enabled}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customUrl" className="text-gray-200">Custom URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="customUrl"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="onesync.music/your-name"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                      <Button onClick={generateUrl} variant="outline" className="border-gray-600">
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-200">Theme</Label>
                    <div className="flex gap-4 mt-2">
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        onClick={() => setTheme("dark")}
                        className="flex-1"
                      >
                        Dark
                      </Button>
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        onClick={() => setTheme("light")}
                        className="flex-1"
                      >
                        Light
                      </Button>
                      <Button
                        variant={theme === "gradient" ? "default" : "outline"}
                        onClick={() => setTheme("gradient")}
                        className="flex-1"
                      >
                        Gradient
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">Live Preview</h4>
              <div className="flex gap-2">
                {customUrl && (
                  <Button onClick={copyUrl} size="sm" variant="outline" className="border-gray-600">
                    <Copy className="w-4 h-4 mr-1" />
                    Copy URL
                  </Button>
                )}
                <Button size="sm" variant="outline" className="border-gray-600">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              </div>
            </div>

            {/* Mock Preview */}
            <Card className={`${theme === "dark" ? "bg-gray-900" : theme === "light" ? "bg-white" : "bg-gradient-to-br from-purple-900 to-blue-900"} border-gray-700 min-h-[500px]`}>
              <CardContent className="p-6 text-center">
                {profileImage && (
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    <OptimizedImage src={profileImage} alt="Profile" width={96} height={96} className="w-full h-full object-cover" fallback="user" />
                  </div>
                )}
                
                <h2 className={`text-2xl font-bold mb-2 ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                  {artistName || "Your Artist Name"}
                </h2>
                
                {bio && (
                  <p className={`mb-6 text-sm ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                    {bio}
                  </p>
                )}

                <div className="space-y-3">
                  {musicLinks.filter(link => link.enabled && link.url).map((link, index) => (
                    <Button key={index} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      {link.icon}
                      <span className="ml-2">Listen on {link.platform}</span>
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </Button>
                  ))}
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  {socialLinks.filter(link => link.enabled && link.url).map((link, index) => (
                    <Button key={index} size="sm" variant="outline" className="border-gray-500">
                      {link.icon}
                    </Button>
                  ))}
                </div>

                <div className={`mt-6 pt-6 border-t ${theme === "light" ? "border-gray-300 text-gray-600" : "border-gray-600 text-gray-400"} text-xs`}>
                  <div className="flex justify-center gap-4">
                    {email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {email}
                      </div>
                    )}
                    {location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {location}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Globe className="w-4 h-4 mr-2" />
            Publish Link Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
