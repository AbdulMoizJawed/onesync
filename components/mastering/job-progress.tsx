"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  RefreshCw, 
  XCircle, 
  Download, 
  Play, 
  Pause,
  Clock,
  Sparkles,
  AlertTriangle,
  FileAudio,
  AudioWaveformIcon as Waveform
} from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { cn } from "@/lib/utils"

// Utility function for formatting file sizes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Temporary type until database is updated
type MasteringJob = {
  id: string
  user_id: string
  title: string
  artist_name: string | null
  original_file_name: string
  original_file_url: string | null
  original_file_size: number | null
  roex_task_id: string | null
  musical_style: string
  loudness_preset: string | null
  sample_rate: number | null
  status: string
  progress: number | null
  preview_url: string | null
  preview_start_time: number | null
  mastered_file_url: string | null
  mastered_file_size: number | null
  analysis_completed: boolean | null
  analysis_results: any | null
  error_message: string | null
  retry_count: number | null
  credits_used: number | null
  estimated_credits: number | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

interface JobProgressProps {
  job: MasteringJob
  onRefresh: () => Promise<void>
  onDownload?: (url: string, filename: string) => void
  onPreview?: (url: string) => void
  className?: string
}

export function JobProgress({ job, onRefresh, onDownload, onPreview, className = "" }: JobProgressProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ""
      }
    }
  }, [audio])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "uploading":
      case "processing_preview":
      case "processing_final":
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
      case "preview_ready":
        return <Sparkles className="w-5 h-5 text-purple-500" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-900/20"
      case "uploading":
      case "processing_preview":
      case "processing_final":
        return "text-yellow-400 bg-yellow-900/20"
      case "preview_ready":
        return "text-purple-400 bg-purple-900/20"
      case "failed":
        return "text-red-400 bg-red-900/20"
      default:
        return "text-gray-400 bg-gray-800/20"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "uploading":
        return "Uploading to cloud storage..."
      case "processing":
        return "Processing with RoEx Python SDK..."
      case "processing_preview":
        return "Creating AI mastered preview..."
      case "preview_ready":
        return "Preview Ready - Listen & Approve"
      case "processing_final":
        return "Generating final master..."
      case "completed":
        return "Mastering Complete!"
      case "failed":
        return "Processing Failed"
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const handlePreviewPlay = async (url: string) => {
    if (!url) return

    if (audio && !audio.paused) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    try {
      const newAudio = new Audio(url)
      newAudio.onended = () => setIsPlaying(false)
      newAudio.onpause = () => setIsPlaying(false)
      newAudio.onplay = () => setIsPlaying(true)
      
      setAudio(newAudio)
      await newAudio.play()
      onPreview?.(url)
    } catch (error) {
      console.error('Error playing preview:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const shouldShowRefresh = ['uploading', 'processing_preview', 'processing_final'].includes(job.status)

  return (
    <Card className={cn("card-dark border-gray-700/50 hover:border-gray-600/50 transition-all animate-fade-in-up", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-gray-700/50 rounded-lg">
              {getStatusIcon(job.status)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-white text-lg mb-1 truncate">
                {job.title || job.original_file_name}
              </CardTitle>
              {job.artist_name && (
                <p className="text-gray-400 text-sm mb-2">by {job.artist_name}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={cn("text-xs", getStatusColor(job.status))}>
                  {getStatusText(job.status)}
                </Badge>
                <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                  {job.musical_style?.replace(/_/g, ' ')}
                </Badge>
                {job.loudness_preset && (
                  <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                    {job.loudness_preset}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {shouldShowRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-gray-400 hover:text-white shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {job.progress !== null && job.progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-gray-300">{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>
        )}

        {/* File Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <FileAudio className="w-4 h-4" />
            <span>{job.original_file_name}</span>
          </div>
          {job.original_file_size && (
            <div className="flex items-center gap-2 text-gray-400">
              <span>Size: {formatBytes(job.original_file_size)}</span>
            </div>
          )}
          {job.sample_rate && (
            <div className="flex items-center gap-2 text-gray-400">
              <Waveform className="w-4 h-4" />
              <span>{job.sample_rate / 1000}kHz</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {job.status === 'failed' && job.error_message && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-400 font-medium text-sm">Processing Failed</p>
                <p className="text-red-300 text-xs mt-1">{job.error_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {job.preview_url && job.status !== 'failed' && (
          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-white font-medium">Preview Available</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreviewPlay(job.preview_url!)}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            </div>
            {job.preview_start_time !== null && job.preview_start_time >= 0 && (
              <p className="text-xs text-gray-400">
                Preview starts at {job.preview_start_time.toFixed(1)}s
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {job.status === 'preview_ready' && (
            <Button
              onClick={() => {
                // Trigger final mastering by making another API call
                // This would be handled by parent component
                console.log('Request final master for job:', job.id)
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Process Final Master
            </Button>
          )}
          
          {job.status === 'completed' && job.mastered_file_url && (
            <Button
              onClick={() => onDownload?.(job.mastered_file_url!, `${job.title || job.original_file_name}_mastered.wav`)}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Master
            </Button>
          )}

          {job.status === 'failed' && (
            <Button
              onClick={() => {
                // Trigger retry
                console.log('Retry job:', job.id)
              }}
              variant="outline"
              className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-700/50">
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{formatTime(job.created_at)}</span>
          </div>
          {job.completed_at && (
            <div className="flex justify-between">
              <span>Completed:</span>
              <span>{formatTime(job.completed_at)}</span>
            </div>
          )}
          {job.credits_used && job.credits_used > 0 && (
            <div className="flex justify-between">
              <span>Credits Used:</span>
              <span className="text-yellow-400">{job.credits_used}</span>
            </div>
          )}
        </div>

        {/* Processing Animation with Status Details */}
        {shouldShowRefresh && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-center gap-3 mb-3">
              <CustomLoader />
              <span className="text-purple-400 font-medium">{getStatusText(job.status)}</span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>🐍 Using RoEx Python SDK for professional mastering</p>
              <p>⏱️ Processing typically takes 5-15 minutes</p>
              <p>🔄 Status updates automatically every 30 seconds</p>
            </div>
            {job.roex_task_id && (
              <div className="mt-2 text-xs text-gray-500">
                Task ID: {job.roex_task_id}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
