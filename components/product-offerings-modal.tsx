"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Star, Zap, Radio, Music } from "lucide-react"

interface ProductOfferingsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedServices: string[]
  onServiceChange: (services: string[]) => void
}

interface ServiceOffering {
  id: string
  title: string
  description: string
  price: string
  features: string[]
  icon: React.ReactNode
  popular?: boolean
}

const serviceOfferings: ServiceOffering[] = [
  {
    id: "playlist-pitching",
    title: "Playlist Pitching",
    description: "Get your music pitched to curated playlists",
    price: "$99",
    features: [
      "Pitch to 50+ playlists",
      "Genre-specific targeting",
      "Campaign report included",
      "30-day campaign duration"
    ],
    icon: <Music className="w-6 h-6 text-purple-400" />
  },
  {
    id: "playlist-influencer",
    title: "Playlist + Influencer",
    description: "Playlist pitching plus influencer marketing",
    price: "$149",
    features: [
      "Everything in Playlist Pitching",
      "Influencer outreach campaign",
      "Social media promotion",
      "Performance analytics"
    ],
    icon: <Star className="w-6 h-6 text-blue-400" />,
    popular: true
  },
  {
    id: "label-services",
    title: "Label Services",
    description: "Full-service label support package",
    price: "$499",
    features: [
      "Professional PR campaign",
      "Radio promotion",
      "Industry connections",
      "Marketing consultation",
      "Release strategy planning"
    ],
    icon: <Zap className="w-6 h-6 text-green-400" />
  },
  {
    id: "radio-campaign",
    title: "Radio Campaign",
    description: "Professional radio promotion campaign",
    price: "$299",
    features: [
      "Radio station outreach",
      "Commercial & college radio",
      "Airplay tracking",
      "Campaign performance report"
    ],
    icon: <Radio className="w-6 h-6 text-orange-400" />
  }
]

export function ProductOfferingsModal({ 
  isOpen, 
  onClose, 
  selectedServices, 
  onServiceChange 
}: ProductOfferingsModalProps) {
  const [tempSelectedServices, setTempSelectedServices] = useState<string[]>(selectedServices)

  const handleServiceToggle = (serviceId: string) => {
    setTempSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleConfirm = () => {
    onServiceChange(tempSelectedServices)
    onClose()
  }

  const handleNoThanks = () => {
    setTempSelectedServices([])
    onServiceChange([])
    onClose()
  }

  const calculateTotal = () => {
    return tempSelectedServices.reduce((total, serviceId) => {
      const service = serviceOfferings.find(s => s.id === serviceId)
      return total + (service ? parseInt(service.price.replace('$', '')) : 0)
    }, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full max-h-[95vh] overflow-y-auto bg-gray-900 border-gray-700 mx-2 sm:mx-4">
        <DialogHeader className="px-2 sm:px-6">
          <DialogTitle className="text-white text-lg sm:text-xl flex items-center gap-2">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            Boost Your Release
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm sm:text-base">
            Supercharge your music distribution with our professional services. Select the packages that fit your goals.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 py-2 sm:py-4 px-2 sm:px-6">
          {serviceOfferings.map((service) => (
            <Card 
              key={service.id}
              className={`relative card-dark border transition-all duration-200 cursor-pointer hover:border-purple-500/50 ${
                tempSelectedServices.includes(service.id) 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => handleServiceToggle(service.id)}
            >
              {service.popular && (
                <div className="absolute -top-2 left-2 sm:left-4">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <div className="p-1.5 sm:p-2 bg-gray-700/50 rounded-lg">
                      <div className="w-4 h-4 sm:w-6 sm:h-6">
                        {service.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-base sm:text-lg leading-tight">{service.title}</CardTitle>
                      <div className="text-lg sm:text-2xl font-bold text-purple-400 mt-1">{service.price}</div>
                    </div>
                  </div>
                  <Checkbox 
                    checked={tempSelectedServices.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="border-gray-600 mt-1"
                  />
                </div>
                <CardDescription className="text-gray-400 text-sm mt-2">{service.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                <ul className="space-y-1.5 sm:space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-300">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {tempSelectedServices.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Selected Services</h4>
                <p className="text-gray-400 text-sm">
                  {tempSelectedServices.length} service{tempSelectedServices.length > 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${calculateTotal()}</div>
                <p className="text-gray-400 text-sm">Total cost</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleNoThanks}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white order-2 sm:order-1"
          >
            No Thanks
          </Button>
          <div className="flex gap-3 order-1 sm:order-2">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              disabled={tempSelectedServices.length === 0}
            >
              {tempSelectedServices.length > 0 
                ? `Add Services - $${calculateTotal()}` 
                : 'Continue Without Services'
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
