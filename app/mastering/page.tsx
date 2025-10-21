'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Settings, 
  Volume2, 
  Music,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  RotateCcw,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

interface AudioFile {
  id: number
  name: string
  status: string
  sample_rate: number
  channels: number
  frames: number
  rms?: number
  peak?: number
  loudness?: number
  dynamics?: number
}

interface MasteringJob {
  id: number
  status: 'waiting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  input_audio_id: number
  output_audio_id?: number
  progression?: number
  failure_reason?: string
  preset: string
  target_loudness: number
  created_at: string
  waiting_order?: number
}

const presetOptions = [
  { value: 'general', label: 'General', description: 'Balanced mastering for most genres' },
  { value: 'pop', label: 'Pop', description: 'Bright and punchy for pop music' },
  { value: 'jazz', label: 'Jazz', description: 'Warm and dynamic for jazz' },
  { value: 'classical', label: 'Classical', description: 'Natural and spacious for classical' },
]

export default function MasteringPage() {
  const [uploadedFile, setUploadedFile] = useState<AudioFile | null>(null)
  const [currentJob, setCurrentJob] = useState<MasteringJob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  
  // Mastering settings
  const [preset, setPreset] = useState('general')
  const [targetLoudness, setTargetLoudness] = useState([-14])
  const [outputFormat, setOutputFormat] = useState('wav')
  const [bitDepth, setBitDepth] = useState('24')
  const [bassPreservation, setBassPreservation] = useState(true)
  const [masteringAlgorithm, setMasteringAlgorithm] = useState('v2')
  const [targetLoudnessMode, setTargetLoudnessMode] = useState('loudness')
  const [masteringReverb, setMasteringReverb] = useState(false)
  const [masteringReverbGain, setMasteringReverbGain] = useState([-36])
  const [lowCutFreq, setLowCutFreq] = useState([20])
  const [highCutFreq, setHighCutFreq] = useState([20000])
  const [noiseReduction, setNoiseReduction] = useState(false)
  const [ceiling, setCeiling] = useState([-0.5])
  const [ceilingMode, setCeilingMode] = useState('lowpass_true_peak')
  const [oversample, setOversample] = useState('1')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    console.log('Starting file upload:', file.name, 'Type:', file.type, 'Size:', file.size)
    
    // Validate file type - only MP3 and WAV allowed
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    if (!allowedTypes.includes(file.type) && fileExtension !== 'mp3' && fileExtension !== 'wav') {
      console.error('Invalid file type:', file.type, 'Extension:', fileExtension)
      toast.error('Invalid file format. Please upload MP3 or WAV files only.')
      return
    }
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)

      console.log('Sending upload request to /api/mastering/upload')
      const response = await fetch('/api/mastering/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Upload API error:', error)
        throw new Error(error.error || 'Upload failed')
      }

      const audioFile = await response.json()
      console.log('Upload successful:', audioFile)
      setUploadedFile(audioFile)
      toast.success('Audio file uploaded successfully!')
      
      // Auto-navigate to settings tab after successful upload
      setTimeout(() => {
        setActiveTab('settings')
        toast.success('Configure your mastering settings below!')
      }, 1000)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const startMastering = async () => {
    if (!uploadedFile) {
      console.error('No uploaded file found')
      return
    }

    console.log('Starting mastering for file:', uploadedFile.id)
    setIsProcessing(true)
    
    try {
      const payload = {
        input_audio_id: uploadedFile.id,
        mode: 'custom',
        preset,
        target_loudness: targetLoudness[0],
        target_loudness_mode: targetLoudnessMode,
        mastering: true,
        output_format: outputFormat,
        bit_depth: parseInt(bitDepth),
        sample_rate: 44100,
        bass_preservation: bassPreservation,
        mastering_algorithm: masteringAlgorithm,
        mastering_reverb: masteringReverb,
        mastering_reverb_gain: masteringReverbGain[0],
        low_cut_freq: lowCutFreq[0],
        high_cut_freq: highCutFreq[0],
        noise_reduction: noiseReduction,
        ceiling: ceiling[0],
        ceiling_mode: ceilingMode,
        oversample: parseInt(oversample),
      }
      
      console.log('Mastering payload:', payload)
      
      const response = await fetch('/api/mastering/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('Mastering response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Mastering API error:', error)
        throw new Error(error.error || 'Failed to start mastering')
      }

      const job = await response.json()
      console.log('Mastering job created:', job)
      setCurrentJob(job)
      toast.success('Mastering job started!')
      
      // Show queue warning if job is waiting
      if (job.status === 'waiting') {
        toast.info('Job queued for processing. Please don\'t close this page - processing can take up to 5 minutes.', {
          duration: 8000
        })
      }
      
      // Start polling for status updates
      startStatusPolling(job.id)
    } catch (error) {
      console.error('Mastering error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start mastering')
      setIsProcessing(false)
    }
  }

  const startStatusPolling = (jobId: number) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/mastering/${jobId}`)
        if (response.ok) {
          const job = await response.json()
          setCurrentJob(job)
          
          if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'canceled') {
            clearInterval(pollIntervalRef.current!)
            setIsProcessing(false)
            
            if (job.status === 'succeeded') {
              toast.success('Mastering completed!')
            } else if (job.status === 'failed') {
              toast.error(`Mastering failed: ${job.failure_reason || 'Unknown error'}`)
            }
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 2000)
  }

  const downloadMasteredFile = async () => {
    if (!currentJob?.output_audio_id) return

    try {
      const response = await fetch(`/api/mastering/download/${currentJob.output_audio_id}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mastered_${uploadedFile?.name || 'audio'}.${outputFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Download started!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  const cancelMastering = async () => {
    if (!currentJob) return

    try {
      const response = await fetch(`/api/mastering/${currentJob.id}/cancel`, {
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error('Cancel failed')
      }

      setIsProcessing(false)
      clearInterval(pollIntervalRef.current!)
      toast.success('Mastering canceled')
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error('Failed to cancel mastering')
    }
  }

  const resetMastering = () => {
    setUploadedFile(null)
    setCurrentJob(null)
    setIsProcessing(false)
    clearInterval(pollIntervalRef.current!)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Settings className="h-4 w-4 text-blue-500 animate-spin" />
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'canceled':
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'succeeded':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'canceled':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-950 mobile-safe-area">
          <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="font-montserrat text-4xl font-bold mb-2 text-white">
                AI Mastering Studio
              </h1>
              <p className="font-inter text-muted-foreground max-w-2xl mx-auto">
                Professional AI-powered audio mastering with real-time processing and industry-standard presets
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className={`flex items-center space-x-2 ${activeTab === 'upload' ? 'text-primary font-semibold' : uploadedFile ? 'text-green-400' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${activeTab === 'upload' ? 'border-primary bg-primary/20' : uploadedFile ? 'border-green-400 bg-green-400/20' : 'border-muted'}`}>
                    {uploadedFile ? <CheckCircle className="h-5 w-5" /> : <span>1</span>}
                  </div>
                  <span>Upload Audio</span>
                </div>
                
                <div className={`w-8 h-0.5 ${uploadedFile ? 'bg-green-400' : 'bg-muted'}`} />
                
                <div className={`flex items-center space-x-2 ${activeTab === 'settings' ? 'text-primary font-semibold' : !uploadedFile ? 'text-muted-foreground/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${activeTab === 'settings' ? 'border-primary bg-primary/20' : !uploadedFile ? 'border-muted/30' : 'border-muted'}`}>
                    <span>2</span>
                  </div>
                  <span>Configure Settings</span>
                </div>
                
                <div className={`w-8 h-0.5 ${uploadedFile ? 'bg-muted' : 'bg-muted/30'}`} />
                
                <div className={`flex items-center space-x-2 ${activeTab === 'process' ? 'text-primary font-semibold' : !uploadedFile ? 'text-muted-foreground/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${activeTab === 'process' ? 'border-primary bg-primary/20' : !uploadedFile ? 'border-muted/30' : currentJob?.status === 'succeeded' ? 'border-green-400 bg-green-400/20' : 'border-muted'}`}>
                    {currentJob?.status === 'succeeded' ? <CheckCircle className="h-5 w-5" /> : <span>3</span>}
                  </div>
                  <span>Process & Download</span>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger 
                  value="upload" 
                  className="relative"
                  disabled={false}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                  {uploadedFile && (
                    <CheckCircle className="h-3 w-3 ml-2 text-green-400" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="relative"
                  disabled={!uploadedFile}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                  {uploadedFile && activeTab !== 'settings' && (
                    <CheckCircle className="h-3 w-3 ml-2 text-green-400" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="process" 
                  className="relative"
                  disabled={!uploadedFile}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Process
                  {currentJob?.status === 'succeeded' && (
                    <CheckCircle className="h-3 w-3 ml-2 text-green-400" />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-montserrat flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Audio File
                    </CardTitle>
                    <CardDescription className="font-inter">
                      Upload your audio file for AI mastering. Supports MP3 and WAV files only.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                        ${dragActive 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground hover:bg-accent/50'
                        }
                      `}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".mp3,.wav,audio/mpeg,audio/wav,audio/wave,audio/x-wav"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                      
                      {isUploading ? (
                        <div className="space-y-4">
                          <Settings className="h-12 w-12 text-primary mx-auto animate-spin" />
                          <p className="text-foreground">Uploading file...</p>
                        </div>
                      ) : uploadedFile ? (
                        <div className="space-y-4">
                          <Music className="h-12 w-12 text-green-400 mx-auto" />
                          <div className="text-foreground">
                            <p className="font-medium">{uploadedFile.name}</p>
                            <p className="text-sm text-muted-foreground font-inter">
                              {uploadedFile.sample_rate}Hz • {uploadedFile.channels} channels
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              resetMastering()
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Upload Different File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div className="text-foreground">
                            <p className="text-lg font-medium">
                              Drop your audio file here or click to browse
                            </p>
                            <p className="text-sm text-muted-foreground font-inter">
                              MP3 and WAV files only • Maximum file size: 100MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-montserrat flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Mastering Settings
                    </CardTitle>
                    <CardDescription className="font-inter">
                      Customize your mastering parameters for optimal results.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Preset</Label>
                        <Select value={preset} onValueChange={setPreset}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {presetOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {option.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Target Loudness Mode</Label>
                        <Select value={targetLoudnessMode} onValueChange={setTargetLoudnessMode}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="loudness">LUFS Loudness</SelectItem>
                            <SelectItem value="rms">RMS Level</SelectItem>
                            <SelectItem value="peak">Peak Level</SelectItem>
                            <SelectItem value="youtube_loudness">YouTube Loudness</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Output Format</Label>
                        <Select value={outputFormat} onValueChange={setOutputFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wav">WAV (Uncompressed)</SelectItem>
                            <SelectItem value="mp3">MP3 (Compressed)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Bit Depth</Label>
                        <Select value={bitDepth} onValueChange={setBitDepth}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16">16-bit</SelectItem>
                            <SelectItem value="24">24-bit</SelectItem>
                            <SelectItem value="32">32-bit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Algorithm</Label>
                        <Select value={masteringAlgorithm} onValueChange={setMasteringAlgorithm}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="v1">Version 1 (Legacy)</SelectItem>
                            <SelectItem value="v2">Version 2 (Latest)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Ceiling Mode</Label>
                        <Select value={ceilingMode} onValueChange={setCeilingMode}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lowpass_true_peak">Lowpass True Peak</SelectItem>
                            <SelectItem value="hard_clip">Hard Clip</SelectItem>
                            <SelectItem value="analog_clip">Analog Clip</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Oversample</Label>
                        <Select value={oversample} onValueChange={setOversample}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1x (No Oversampling)</SelectItem>
                            <SelectItem value="2">2x Oversampling</SelectItem>
                            <SelectItem value="4">4x Oversampling</SelectItem>
                            <SelectItem value="8">8x Oversampling</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Target Loudness</Label>
                          <Badge variant="outline">
                            {targetLoudness[0]} {targetLoudnessMode === 'loudness' ? 'LUFS' : 'dB'}
                          </Badge>
                        </div>
                        <Slider
                          value={targetLoudness}
                          onValueChange={setTargetLoudness}
                          min={-30}
                          max={0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>-30 {targetLoudnessMode === 'loudness' ? 'LUFS' : 'dB'} (Quiet)</span>
                          <span>0 {targetLoudnessMode === 'loudness' ? 'LUFS' : 'dB'} (Loud)</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Ceiling</Label>
                          <Badge variant="outline">
                            {ceiling[0]} dB
                          </Badge>
                        </div>
                        <Slider
                          value={ceiling}
                          onValueChange={setCeiling}
                          min={-3}
                          max={0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>-3 dB (Conservative)</span>
                          <span>0 dB (Maximum)</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Low Cut Frequency</Label>
                          <Badge variant="outline">
                            {lowCutFreq[0]} Hz
                          </Badge>
                        </div>
                        <Slider
                          value={lowCutFreq}
                          onValueChange={setLowCutFreq}
                          min={10}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>10 Hz (No Cut)</span>
                          <span>100 Hz (High Cut)</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>High Cut Frequency</Label>
                          <Badge variant="outline">
                            {highCutFreq[0]} Hz
                          </Badge>
                        </div>
                        <Slider
                          value={highCutFreq}
                          onValueChange={setHighCutFreq}
                          min={10000}
                          max={22000}
                          step={100}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>10 kHz (Low Cut)</span>
                          <span>22 kHz (No Cut)</span>
                        </div>
                      </div>

                      {masteringReverb && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Reverb Gain</Label>
                            <Badge variant="outline">
                              {masteringReverbGain[0]} dB
                            </Badge>
                          </div>
                          <Slider
                            value={masteringReverbGain}
                            onValueChange={setMasteringReverbGain}
                            min={-60}
                            max={0}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>-60 dB (Subtle)</span>
                            <span>0 dB (Strong)</span>
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Bass Preservation</Label>
                            <p className="text-sm text-muted-foreground">
                              Maintain low-end frequencies during mastering
                            </p>
                          </div>
                          <Switch
                            checked={bassPreservation}
                            onCheckedChange={setBassPreservation}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Mastering Reverb</Label>
                            <p className="text-sm text-muted-foreground">
                              Add subtle reverb for spatial enhancement
                            </p>
                          </div>
                          <Switch
                            checked={masteringReverb}
                            onCheckedChange={setMasteringReverb}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Noise Reduction</Label>
                            <p className="text-sm text-muted-foreground">
                              Reduce background noise and artifacts
                            </p>
                          </div>
                          <Switch
                            checked={noiseReduction}
                            onCheckedChange={setNoiseReduction}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Next Button */}
                  {uploadedFile && (
                    <CardContent className="pt-0">
                      <div className="flex justify-end">
                        <Button
                          onClick={() => {
                            setActiveTab('process')
                            toast.success('Ready to start mastering!')
                          }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
                        >
                          Next: Start Processing
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="process" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-montserrat flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Process & Download
                    </CardTitle>
                    <CardDescription className="font-inter">
                      Start mastering and download your processed audio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!uploadedFile ? (
                      <div className="text-center py-8">
                        <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Please upload an audio file first</p>
                        <Button
                          onClick={() => setActiveTab('upload')}
                          variant="outline"
                          className="mt-4"
                        >
                          Go to Upload
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Back to Settings Button */}
                        <div className="flex justify-start">
                          <Button
                            onClick={() => setActiveTab('settings')}
                            variant="outline"
                          >
                            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                            Back to Settings
                          </Button>
                        </div>

                        <div className="text-center">
                          <Button
                            onClick={startMastering}
                            disabled={isProcessing || !uploadedFile}
                            size="lg"
                            className="bg-white hover:bg-gray-100 text-gray-950 px-8"
                          >
                            {isProcessing ? (
                              <>
                                <Settings className="h-5 w-5 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Play className="h-5 w-5 mr-2" />
                                Start Mastering
                              </>
                            )}
                          </Button>
                        </div>

                        {currentJob && (
                          <Card>
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {getStatusIcon(currentJob.status)}
                                    <div>
                                      <p className="font-medium">
                                        Mastering Job #{currentJob.id}
                                      </p>
                                      <p className="text-sm text-muted-foreground font-inter">
                                        {currentJob.preset} preset • {currentJob.target_loudness} LUFS
                                      </p>
                                      {currentJob.status === 'waiting' && currentJob.waiting_order && (
                                        <p className="text-xs text-yellow-600 font-inter">
                                          Position in queue: #{currentJob.waiting_order}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Badge className={getStatusColor(currentJob.status)}>
                                    {currentJob.status === 'waiting' ? 'In Queue' : currentJob.status}
                                  </Badge>
                                </div>

                                {/* Queue Warning for waiting jobs */}
                                {currentJob.status === 'waiting' && (
                                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-yellow-600" />
                                      <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium font-inter">
                                        Job queued for processing
                                      </p>
                                    </div>
                                    <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1 font-inter">
                                      Please don&apos;t close this page. Processing can take up to 5 minutes.
                                      {currentJob.waiting_order && ` You are #${currentJob.waiting_order} in the queue.`}
                                    </p>
                                  </div>
                                )}

                                {currentJob.status === 'processing' && typeof currentJob.progression === 'number' && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Processing...</span>
                                      <span>{Math.round(currentJob.progression)}%</span>
                                    </div>
                                    <Progress value={currentJob.progression} className="h-2" />
                                    <p className="text-xs text-muted-foreground font-inter">
                                      Please keep this page open while processing completes.
                                    </p>
                                  </div>
                                )}

                                {currentJob.status === 'failed' && currentJob.failure_reason && (
                                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                                    <p className="text-red-800 dark:text-red-200 text-sm">
                                      Error: {currentJob.failure_reason}
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-3">
                                  {currentJob.status === 'succeeded' && currentJob.output_audio_id && (
                                    <Button
                                      onClick={downloadMasteredFile}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Mastered File
                                    </Button>
                                  )}

                                  {(currentJob.status === 'waiting' || currentJob.status === 'processing') && (
                                    <Button
                                      onClick={cancelMastering}
                                      variant="outline"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </Button>
                                  )}

                                  <Button
                                    onClick={resetMastering}
                                    variant="outline"
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Start Over
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
