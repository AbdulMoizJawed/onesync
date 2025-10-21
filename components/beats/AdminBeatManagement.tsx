"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/auth'
import { toast } from 'sonner'
import { 
  Music, RefreshCw, Search, Download, Trash2, Edit, 
  Eye, DollarSign, Play, Pause, TrendingUp, AlertCircle
} from 'lucide-react'

interface Beat {
  id: string
  user_id: string
  title: string
  description?: string
  genre: string
  bpm: number
  key: string
  mood?: string
  tags: string[]
  price: any
  audio_url: string
  waveform_url?: string
  duration?: number
  approval_status: string
  is_featured: boolean
  play_count: number
  purchase_count: number
  created_at: string
  profiles?: {
    full_name?: string
    email: string
  }
}

export default function AdminBeatManagement() {
  const [beats, setBeats] = useState<Beat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [genreFilter, setGenreFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)

  // Fetch beats on component mount and when switching to this tab
  useEffect(() => {
    fetchBeats()
  }, [])

  // Fetch all beats from database
  const fetchBeats = async () => {
    setLoading(true)
    try {
      // First, try with the join
      let { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          profiles!beats_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // If join fails, fetch beats without profiles
      if (error && error.code === 'PGRST200') {
        console.warn('Foreign key relationship not found, fetching beats without profiles')
        const result = await supabase
          .from('beats')
          .select('*')
          .order('created_at', { ascending: false })
        
        data = result.data
        error = result.error
      }

      if (error) {
        console.error('Fetch beats error:', error)
        throw error
      }

      setBeats(data || [])
      
      // Show success toast with count
      if (data && data.length > 0) {
        toast.success('✅ Beats loaded successfully', {
          description: `Found ${data.length} beat${data.length === 1 ? '' : 's'} in marketplace`,
          duration: 3000
        })
      } else {
        toast.info('No beats found', {
          description: 'Upload your first beat to get started',
          duration: 3000
        })
      }
    } catch (error: any) {
      console.error('Error fetching beats:', error)
      toast.error('❌ Failed to load beats', {
        description: error.message || 'Please try refreshing the page',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle audio playback
  const handlePlayPause = (beatId: string, audioUrl: string) => {
    if (currentlyPlaying === beatId) {
      audioRef?.pause()
      setCurrentlyPlaying(null)
    } else {
      if (audioRef) {
        audioRef.pause()
      }

      const audio = new Audio(audioUrl)
      audio.onended = () => {
        setCurrentlyPlaying(null)
      }
      audio.onerror = () => {
        toast.error('Failed to play audio')
        setCurrentlyPlaying(null)
      }
      
      audio.play()
        .then(() => {
          setCurrentlyPlaying(beatId)
          setAudioRef(audio)
        })
        .catch((error) => {
          console.error('Playback error:', error)
          toast.error('Failed to play audio')
        })
    }
  }

  // Delete beat
  const handleDelete = async (beatId: string, beatTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${beatTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('beats')
        .delete()
        .eq('id', beatId)

      if (error) throw error

      toast.success('Beat deleted successfully')
      fetchBeats()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Failed to delete beat')
    }
  }

  // Toggle featured status
  const handleToggleFeatured = async (beatId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('beats')
        .update({ is_featured: !currentStatus })
        .eq('id', beatId)

      if (error) throw error

      toast.success(currentStatus ? 'Removed from featured' : 'Added to featured')
      fetchBeats()
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error('Failed to update beat')
    }
  }

  // Filter beats
  const filteredBeats = beats.filter(beat => {
    const matchesSearch = searchTerm === '' || 
      beat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beat.genre.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGenre = genreFilter === 'all' || beat.genre === genreFilter
    const matchesStatus = statusFilter === 'all' || beat.approval_status === statusFilter

    return matchesSearch && matchesGenre && matchesStatus
  })

  // Get unique genres from beats
  const genres = Array.from(new Set(beats.map(beat => beat.genre))).sort()

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Music className="w-5 h-5 mr-2 text-cyan-400" />
              Beat Management ({filteredBeats.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchBeats}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search beats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white pl-10"
              />
            </div>

            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by genre" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white">All Genres</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre} className="text-white">
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white">All Status</SelectItem>
                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                <SelectItem value="approved" className="text-white">Approved</SelectItem>
                <SelectItem value="rejected" className="text-white">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Beats List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading beats...</p>
            </CardContent>
          </Card>
        ) : filteredBeats.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No beats found</p>
            </CardContent>
          </Card>
        ) : (
          filteredBeats.map(beat => (
            <Card key={beat.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Beat Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-white font-medium text-lg">{beat.title}</h3>
                      <Badge
                        className={
                          beat.approval_status === 'approved' ? 'bg-green-600' :
                          beat.approval_status === 'pending' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }
                      >
                        {beat.approval_status}
                      </Badge>
                      {beat.is_featured && (
                        <Badge variant="outline" className="text-purple-400 border-purple-400">
                          Featured
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-3">
                      <div>
                        <span className="text-gray-500">Genre:</span>
                        <span className="text-white ml-2">{beat.genre}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">BPM:</span>
                        <span className="text-white ml-2">{beat.bpm}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Key:</span>
                        <span className="text-white ml-2">{beat.key}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="text-white ml-2">
                          ${typeof beat.price === 'object' ? beat.price.amount : beat.price}
                        </span>
                      </div>
                    </div>

                    {beat.description && (
                      <p className="text-gray-400 text-sm mb-3">{beat.description}</p>
                    )}

                    {beat.tags && beat.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {beat.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Play className="w-3 h-3 mr-1" />
                        {beat.play_count} plays
                      </span>
                      <span className="flex items-center">
                        <Download className="w-3 h-3 mr-1" />
                        {beat.purchase_count} purchases
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Revenue: ${(beat.purchase_count * (typeof beat.price === 'object' ? beat.price.amount : beat.price)).toFixed(2)}
                      </span>
                      <span>
                        Created: {new Date(beat.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePlayPause(beat.id, beat.audio_url)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full"
                    >
                      {currentlyPlaying === beat.id ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedBeat(selectedBeat?.id === beat.id ? null : beat)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {selectedBeat?.id === beat.id ? 'Hide' : 'Details'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleFeatured(beat.id, beat.is_featured)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {beat.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(beat.id, beat.title)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedBeat?.id === beat.id && (
                  <div className="border-t border-gray-700 mt-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-medium mb-3">Technical Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-400">Beat ID:</span> <span className="text-white font-mono text-xs">{beat.id}</span></p>
                          <p><span className="text-gray-400">User ID:</span> <span className="text-white font-mono text-xs">{beat.user_id}</span></p>
                          {beat.profiles && (
                            <>
                              <p><span className="text-gray-400">Uploaded by:</span> <span className="text-white">{beat.profiles.full_name || beat.profiles.email}</span></p>
                              <p><span className="text-gray-400">Email:</span> <span className="text-white">{beat.profiles.email}</span></p>
                            </>
                          )}
                          {beat.mood && (
                            <p><span className="text-gray-400">Mood:</span> <span className="text-white">{beat.mood}</span></p>
                          )}
                          {beat.duration && (
                            <p><span className="text-gray-400">Duration:</span> <span className="text-white">{Math.floor(beat.duration / 60)}:{(beat.duration % 60).toString().padStart(2, '0')}</span></p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-3">Pricing & Files</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-400">Price:</span>
                            <span className="text-white ml-2">
                              ${typeof beat.price === 'object' ? beat.price.amount : beat.price}
                              {typeof beat.price === 'object' && ` ${beat.price.currency}`}
                            </span>
                          </p>
                          {typeof beat.price === 'object' && beat.price.license_type && (
                            <p><span className="text-gray-400">License:</span> <span className="text-white">{beat.price.license_type}</span></p>
                          )}
                          <p>
                            <span className="text-gray-400">Audio URL:</span>
                            <a
                              href={beat.audio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 ml-2 text-xs break-all"
                            >
                              View File
                            </a>
                          </p>
                          {beat.waveform_url && (
                            <p>
                              <span className="text-gray-400">Waveform:</span>
                              <a
                                href={beat.waveform_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 ml-2 text-xs"
                              >
                                View
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Summary */}
      {!loading && beats.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Beats</p>
                <p className="text-white text-2xl font-bold">{beats.length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Plays</p>
                <p className="text-white text-2xl font-bold">
                  {beats.reduce((sum, beat) => sum + beat.play_count, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Sales</p>
                <p className="text-white text-2xl font-bold">
                  {beats.reduce((sum, beat) => sum + beat.purchase_count, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-white text-2xl font-bold">
                  ${beats.reduce((sum, beat) => {
                    const price = typeof beat.price === 'object' ? beat.price.amount : beat.price
                    return sum + (beat.purchase_count * price)
                  }, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}