"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Disc, Info } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"

interface MusoDataModalProps {
  trackId?: string
  trackName: string
  artistName: string
  artistId?: string
  children?: React.ReactNode
  trigger?: React.ReactNode
}

export function MusoDataModal({
  trackId,
  trackName,
  artistName,
  artistId,
  children,
  trigger
}: MusoDataModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'credits' | 'collaborators'>('credits')
  const [musoCreditData, setMusoCreditData] = useState<any[]>([])
  const [musoCollaboratorData, setMusoCollaboratorData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchMusoData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First we need to find the MUSO artist ID if not provided
      let targetArtistId = artistId;
      
      if (!targetArtistId) {
        const searchResponse = await fetch(`/api/muso/search?q=${encodeURIComponent(artistName)}`)
        if (!searchResponse.ok) {
          throw new Error(`Failed to search for artist: ${searchResponse.status}`)
        }
        
        const searchData = await searchResponse.json()
        if (searchData.success && searchData.results && searchData.results.length > 0) {
          const bestMatch = searchData.results.find((r: any) => 
            r.name.toLowerCase() === artistName.toLowerCase()
          ) || searchData.results[0]
          
          targetArtistId = bestMatch.id
        } else {
          throw new Error("Artist not found in MUSO database")
        }
      }
      
      if (targetArtistId) {
        // Fetch credits
        const creditsResponse = await fetch(`/api/muso/credits?artistId=${targetArtistId}`)
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          if (creditsData.success && creditsData.items) {
            setMusoCreditData(creditsData.items)
          }
        }
        
        // Fetch collaborators
        const collabsResponse = await fetch(`/api/muso/collaborators?artistId=${targetArtistId}`)
        if (collabsResponse.ok) {
          const collabsData = await collabsResponse.json()
          if (collabsData.success && collabsData.items) {
            setMusoCollaboratorData(collabsData.items)
          }
        }
      } else {
        throw new Error("Could not determine MUSO artist ID")
      }
    } catch (err: any) {
      console.error("Error fetching MUSO data:", err)
      setError(err.message || "Failed to load MUSO data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog onOpenChange={(open) => {
      if (open) fetchMusoData()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="bg-gray-800 border-purple-500/30 text-purple-400 hover:text-white hover:bg-gray-700">
            <Users className="w-4 h-4 mr-2" />
            MUSO Credits
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            MUSO Artist Data
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Credits and collaborator details for {artistName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 mt-2 mb-4">
          <Button
            variant={activeTab === 'credits' ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab('credits')}
            className={`flex-1 transition-all ${
              activeTab === 'credits' 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'border-gray-600 text-gray-300 hover:border-purple-400 hover:text-purple-300'
            }`}
          >
            <Disc className="w-4 h-4 mr-2" />
            Credits
          </Button>
          <Button
            variant={activeTab === 'collaborators' ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab('collaborators')}
            className={`flex-1 transition-all ${
              activeTab === 'collaborators' 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'border-gray-600 text-gray-300 hover:border-purple-400 hover:text-purple-300'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Collaborators
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <CustomLoader size="md" />
            <span className="ml-2 text-gray-400">Loading MUSO data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="text-red-400 mb-2">Error: {error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMusoData}
              className="border-gray-600 text-gray-300"
            >
              Try Again
            </Button>
          </div>
        ) : activeTab === 'credits' ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {musoCreditData.length > 0 ? (
              musoCreditData.map((credit, index) => (
                <div key={index} className="bg-gray-800/50 p-3 rounded-lg transition-all hover:bg-gray-700/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{credit.title || credit.name}</p>
                      {credit.album && (
                        <p className="text-gray-400 text-xs mt-1">Album: {credit.album.title}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {credit.role || 'Artist'}
                      </Badge>
                      {credit.releaseDate && (
                        <p className="text-gray-400 text-xs mt-1 flex items-center justify-end">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(credit.releaseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                <Info className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No credits data found for this artist</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {musoCollaboratorData.length > 0 ? (
              musoCollaboratorData.map((collab, index) => (
                <div key={index} className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{collab.name}</p>
                      {collab.commonCredits && collab.commonCredits.length > 0 && (
                        <p className="text-gray-400 text-xs">Role: {collab.commonCredits[0]}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        {collab.collaborationsCount || 0} collaborations
                      </Badge>
                      {collab.lastCollaborationDate && (
                        <p className="text-gray-400 text-xs mt-1 flex items-center justify-end">
                          <Clock className="w-3 h-3 mr-1" />
                          Last: {new Date(collab.lastCollaborationDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                <Info className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No collaborator data found for this artist</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
