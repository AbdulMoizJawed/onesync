"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/auth'
import { toast } from 'sonner'
import { Music, Upload, DollarSign, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface BeatUploadForm {
  title: string
  description: string
  genre: string
  bpm: string
  key: string
  mood: string
  tags: string
  price: string
  currency: string
  license_type: string
}

const GENRES = [
  'Hip Hop', 'Trap', 'R&B', 'Pop', 'Drill', 'Afrobeat', 
  'Latin', 'Electronic', 'Rock', 'Jazz', 'Country', 'Other'
]

const KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
]

const MOODS = [
  'Dark', 'Upbeat', 'Melodic', 'Aggressive', 'Chill', 'Emotional', 
  'Energetic', 'Atmospheric', 'Happy', 'Sad', 'Motivational'
]

interface AdminBeatUploadProps {
  onUploadComplete?: () => void
}

export default function AdminBeatUpload({ onUploadComplete }: AdminBeatUploadProps) {
  const [formData, setFormData] = useState<BeatUploadForm>({
    title: '',
    description: '',
    genre: '',
    bpm: '',
    key: '',
    mood: '',
    tags: '',
    price: '',
    currency: 'USD',
    license_type: 'basic'
  })

  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [artworkFile, setArtworkFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle form field changes
  const handleInputChange = (field: keyof BeatUploadForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle audio file selection
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - only WAV allowed
    if (!file.name.toLowerCase().endsWith('.wav')) {
      toast.error('Only WAV files are allowed for beats')
      return
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be less than 100MB')
      return
    }

    setAudioFile(file)
    toast.success('Audio file selected')
  }

  // Handle artwork file selection
  const handleArtworkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images are allowed')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setArtworkFile(file)
    toast.success('Artwork selected')
  }

  // Validate form before submission
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Beat title is required')
      return false
    }

    if (!formData.genre) {
      toast.error('Genre is required')
      return false
    }

    if (!formData.bpm || parseInt(formData.bpm) < 20 || parseInt(formData.bpm) > 300) {
      toast.error('BPM must be between 20 and 300')
      return false
    }

    if (!formData.key) {
      toast.error('Musical key is required')
      return false
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      toast.error('Price must be a positive number')
      return false
    }

    if (!audioFile) {
      toast.error('Audio file is required')
      return false
    }

    return true
  }

  // Upload beat to Supabase
  const handleUpload = async () => {
    if (!validateForm()) return

    setUploading(true)
    setUploadProgress(0)
    
    let uploadToastId: string | number | undefined = undefined

    try {
      // Show initial toast
      uploadToastId = toast.loading('🎵 Preparing upload...', {
        description: 'Validating files and data',
        duration: Infinity
      })

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Not authenticated. Please log in again.')
      }

      console.log('✅ User authenticated:', user.id)

      // Step 1: Upload audio file to Supabase Storage
      toast.loading('📤 Uploading audio file...', {
        id: uploadToastId,
        description: `Uploading ${audioFile!.name} (${(audioFile!.size / (1024 * 1024)).toFixed(2)} MB)`,
        duration: Infinity
      })
      setUploadProgress(20)
      
      const audioFileName = `${Date.now()}_${audioFile!.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const audioPath = `beats/${user.id}/${audioFileName}`

      console.log('📤 Uploading to path:', audioPath)

      const { data: audioData, error: audioError } = await supabase.storage
        .from('beats')
        .upload(audioPath, audioFile!, {
          cacheControl: '3600',
          upsert: false
        })

      if (audioError) {
        console.error('❌ Audio upload error:', audioError)
        throw new Error(`Audio upload failed: ${audioError.message}`)
      }

      console.log('✅ Audio uploaded:', audioData)

      // Get public URL for audio
      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('beats')
        .getPublicUrl(audioPath)

      console.log('✅ Audio URL:', audioUrl)

      setUploadProgress(50)

      // Step 2: Upload artwork (optional)
      let artworkUrl = null
      if (artworkFile) {
        toast.loading('🖼️ Uploading artwork...', {
          id: uploadToastId,
          description: 'Almost done!',
          duration: Infinity
        })
        
        const artworkFileName = `${Date.now()}_${artworkFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const artworkPath = `beats/artwork/${user.id}/${artworkFileName}`

        console.log('📤 Uploading artwork to path:', artworkPath)

        const { error: artworkError } = await supabase.storage
          .from('beats')
          .upload(artworkPath, artworkFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (!artworkError) {
          const { data: { publicUrl } } = supabase.storage
            .from('beats')
            .getPublicUrl(artworkPath)
          artworkUrl = publicUrl
          console.log('✅ Artwork uploaded:', artworkUrl)
        } else {
          console.warn('⚠️ Artwork upload failed (non-critical):', artworkError)
        }
      }

      setUploadProgress(70)

      // Step 3: Insert beat record into database
      toast.loading('💾 Saving beat details...', {
        id: uploadToastId,
        description: 'Creating database record',
        duration: Infinity
      })
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const beatData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        genre: formData.genre,
        bpm: parseInt(formData.bpm),
        key: formData.key,
        mood: formData.mood || null,
        tags: tagsArray,
        price: parseFloat(formData.price),
        license_type: formData.license_type,
        audio_url: audioUrl,
        waveform_url: artworkUrl,
        duration: null,
        approval_status: 'approved',
        is_featured: false,
        play_count: 0,
        purchase_count: 0
      }

      console.log('💾 Inserting beat data:', beatData)

      const { data: insertedBeat, error: insertError } = await supabase
        .from('beats')
        .insert(beatData)
        .select()

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        throw new Error(`Failed to save beat: ${insertError.message}`)
      }

      console.log('✅ Beat saved to database:', insertedBeat)

      setUploadProgress(100)

      // Success toast
      toast.success('🎉 Beat uploaded successfully!', {
        id: uploadToastId,
        description: `"${formData.title}" is now live in the marketplace`,
        duration: 5000
      })

      console.log('✅ Upload complete!')

      // Reset form
      resetForm()

      // Call the callback to switch tabs after a short delay
      setTimeout(() => {
        console.log('🔄 Switching to manage tab...')
        if (onUploadComplete) {
          onUploadComplete()
        }
      }, 1500)

    } catch (error: any) {
      console.error('❌ Upload error:', error)
      
      // Show error toast
      toast.error('❌ Upload failed', {
        id: uploadToastId,
        description: error.message || 'An unexpected error occurred. Please try again.',
        duration: 6000
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      genre: '',
      bpm: '',
      key: '',
      mood: '',
      tags: '',
      price: '',
      currency: 'USD',
      license_type: 'basic'
    })
    setAudioFile(null)
    setArtworkFile(null)
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Upload className="w-5 h-5 mr-2 text-cyan-400" />
          Upload New Beat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Beat Title */}
          <div>
            <Label htmlFor="title" className="text-gray-300">
              Beat Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter beat title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white mt-2"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your beat..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white mt-2"
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* Genre and Key */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="genre" className="text-gray-300">
                Genre *
              </Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => handleInputChange('genre', value)}
                disabled={uploading}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {GENRES.map(genre => (
                    <SelectItem key={genre} value={genre} className="text-white">
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="key" className="text-gray-300">
                Musical Key *
              </Label>
              <Select
                value={formData.key}
                onValueChange={(value) => handleInputChange('key', value)}
                disabled={uploading}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                  {KEYS.map(key => (
                    <SelectItem key={key} value={key} className="text-white">
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BPM and Mood */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bpm" className="text-gray-300">
                BPM (20-300) *
              </Label>
              <Input
                id="bpm"
                type="number"
                min="20"
                max="300"
                placeholder="e.g., 140"
                value={formData.bpm}
                onChange={(e) => handleInputChange('bpm', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white mt-2"
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="mood" className="text-gray-300">
                Mood
              </Label>
              <Select
                value={formData.mood}
                onValueChange={(value) => handleInputChange('mood', value)}
                disabled={uploading}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue placeholder="Select mood (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {MOODS.map(mood => (
                    <SelectItem key={mood} value={mood} className="text-white">
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-gray-300">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              placeholder="e.g., dark, hard, 808"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white mt-2"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate tags with commas (e.g., dark, hard, 808)
            </p>
          </div>

          {/* Pricing */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-400" />
              Pricing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price" className="text-gray-300">
                  Price *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="29.99"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                  disabled={uploading}
                />
              </div>

              <div>
                <Label htmlFor="currency" className="text-gray-300">
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                  disabled={uploading}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="USD" className="text-white">USD ($)</SelectItem>
                    <SelectItem value="EUR" className="text-white">EUR (€)</SelectItem>
                    <SelectItem value="GBP" className="text-white">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="license" className="text-gray-300">
                  License Type
                </Label>
                <Select
                  value={formData.license_type}
                  onValueChange={(value) => handleInputChange('license_type', value)}
                  disabled={uploading}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="basic" className="text-white">Basic</SelectItem>
                    <SelectItem value="premium" className="text-white">Premium</SelectItem>
                    <SelectItem value="exclusive" className="text-white">Exclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="border-t border-gray-700 pt-6 space-y-4">
            <h3 className="text-white font-medium mb-4 flex items-center">
              <Music className="w-4 h-4 mr-2 text-purple-400" />
              Files
            </h3>

            {/* Audio File */}
            <div>
              <Label htmlFor="audio" className="text-gray-300">
                Audio File (WAV only) *
              </Label>
              <div className="mt-2">
                <input
                  id="audio"
                  type="file"
                  accept=".wav,audio/wav"
                  onChange={handleAudioSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="audio"
                  className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    audioFile
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {audioFile ? (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{audioFile.name}</p>
                        <p className="text-gray-400 text-xs">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      {!uploading && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.preventDefault()
                            setAudioFile(null)
                          }}
                          className="ml-auto"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-white text-sm">Click to upload audio file</p>
                      <p className="text-gray-500 text-xs mt-1">WAV format only, max 100MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Artwork File */}
            <div>
              <Label htmlFor="artwork" className="text-gray-300">
                Artwork (Optional)
              </Label>
              <div className="mt-2">
                <input
                  id="artwork"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleArtworkSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="artwork"
                  className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    artworkFile
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {artworkFile ? (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{artworkFile.name}</p>
                        <p className="text-gray-400 text-xs">
                          {(artworkFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      {!uploading && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.preventDefault()
                            setArtworkFile(null)
                          }}
                          className="ml-auto"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-white text-sm">Click to upload artwork</p>
                      <p className="text-gray-500 text-xs mt-1">JPG, PNG, or WebP, max 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 text-sm font-medium">Uploading...</span>
                <span className="text-blue-400 text-sm">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <Button
              onClick={handleUpload}
              disabled={uploading || !audioFile}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Beat
                </>
              )}
            </Button>

            {!uploading && (audioFile || Object.values(formData).some(v => v !== '' && v !== 'USD' && v !== 'basic')) && (
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Form
              </Button>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Upload Guidelines:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Audio must be in WAV format (high quality)</li>
                  <li>Maximum file size: 100MB for audio, 5MB for artwork</li>
                  <li>Admin uploads are automatically approved</li>
                  <li>Users will be able to preview but not download without payment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}