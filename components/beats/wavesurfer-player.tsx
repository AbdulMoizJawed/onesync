'use client'

import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, Volume2, VolumeX, Download, Heart, ShoppingCart } from 'lucide-react'

interface WaveSurferPlayerProps {
  audioUrl: string
  waveformData?: number[]
  title: string
  artist: string
  price?: number
  beatId: string
  onPurchase?: () => void
  onLike?: () => void
  onDownload?: () => void
  isLiked?: boolean
  className?: string
}

export function WaveSurferPlayer({
  audioUrl,
  waveformData,
  title,
  artist,
  price,
  beatId,
  onPurchase,
  onLike,
  onDownload,
  isLiked = false,
  className = ''
}: WaveSurferPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize WaveSurfer
    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#6366f1',
      progressColor: '#4f46e5',
      cursorColor: '#818cf8',
      barWidth: 2,
      barRadius: 1,
      height: 60,
      normalize: true,
      backend: 'WebAudio',
      mediaControls: false,
    })

    // Load the audio
    wavesurfer.current.load(audioUrl)

    // Event listeners
    wavesurfer.current.on('ready', () => {
      setDuration(wavesurfer.current?.getDuration() || 0)
      setIsLoading(false)
      if (wavesurfer.current) {
        wavesurfer.current.setVolume(volume)
      }
    })

    wavesurfer.current.on('play', () => setIsPlaying(true))
    wavesurfer.current.on('pause', () => setIsPlaying(false))
    
    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current?.getCurrentTime() || 0)
    })

    wavesurfer.current.on('interaction', () => {
      setCurrentTime(wavesurfer.current?.getCurrentTime() || 0)
    })

    return () => {
      wavesurfer.current?.destroy()
    }
  }, [audioUrl, volume])

  const togglePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause()
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(newVolume)
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (wavesurfer.current) {
      if (isMuted) {
        wavesurfer.current.setVolume(volume)
        setIsMuted(false)
      } else {
        wavesurfer.current.setVolume(0)
        setIsMuted(true)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-lg">{title}</h3>
          <p className="text-gray-400 text-sm">by {artist}</p>
        </div>
        <div className="flex items-center gap-2">
          {price && (
            <span className="text-indigo-400 font-bold text-lg">${price}</span>
          )}
        </div>
      </div>

      {/* Waveform */}
      <div className="mb-4">
        <div 
          ref={containerRef} 
          className="w-full bg-gray-800 rounded"
          style={{ minHeight: '60px' }}
        />
        {isLoading && (
          <div className="flex items-center justify-center h-[60px] bg-gray-800 rounded">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Play/Pause */}
        <Button
          onClick={togglePlayPause}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="h-10 w-10 rounded-full border-gray-600 hover:bg-gray-800"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        {/* Time Display */}
        <div className="flex items-center gap-2 text-sm text-gray-400 min-w-[80px]">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1 max-w-[120px]">
          <Button
            onClick={toggleMute}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-800"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.01}
            className="flex-1"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {onLike && (
            <Button
              onClick={onLike}
              size="sm"
              variant="ghost"
              className={`h-8 w-8 p-0 hover:bg-gray-800 ${
                isLiked ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          )}
          
          {onDownload && (
            <Button
              onClick={onDownload}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {onPurchase && price && (
            <Button
              onClick={onPurchase}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
