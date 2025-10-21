'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Button } from '@/components/ui/button'
import { OptimizedImage } from '@/components/optimized-image'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react'

interface WaveSurferPlayerProps {
  audioUrl: string
  beatTitle: string
  producerName: string
  artworkUrl: string
  onNext?: () => void
  onPrevious?: () => void
  onPlaylistToggle?: () => void
  isVisible: boolean
}

export default function WaveSurferPlayer({
  audioUrl,
  beatTitle,
  producerName,
  artworkUrl,
  onNext,
  onPrevious,
  onPlaylistToggle,
  isVisible
}: WaveSurferPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [repeat, setRepeat] = useState(false)
  const [shuffle, setShuffle] = useState(false)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return

    // Destroy existing instance
    if (wavesurfer.current) {
      wavesurfer.current.destroy()
    }

    // Create new WaveSurfer instance
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#6366f1',
      progressColor: '#3b82f6',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      normalize: true,
      interact: true,
      cursorColor: '#ffffff',
      cursorWidth: 2,
    })

    // Load audio
    wavesurfer.current.load(audioUrl)

    // Event listeners
    wavesurfer.current.on('ready', () => {
      setDuration(wavesurfer.current?.getDuration() || 0)
      setIsLoading(false)
    })

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current?.getCurrentTime() || 0)
    })

    wavesurfer.current.on('play', () => {
      setIsPlaying(true)
    })

    wavesurfer.current.on('pause', () => {
      setIsPlaying(false)
    })

    wavesurfer.current.on('finish', () => {
      setIsPlaying(false)
      if (repeat) {
        wavesurfer.current?.play()
      } else if (onNext) {
        onNext()
      }
    })

    wavesurfer.current.on('error', (error) => {
      console.error('WaveSurfer error:', error)
      setIsLoading(false)
    })

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy()
      }
    }
  }, [audioUrl, repeat, onNext])

  // Update volume
  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(isMuted ? 0 : volume / 100)
    }
  }, [volume, isMuted])

  const handlePlayPause = useCallback(() => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause()
    }
  }, [])

  const handleSeek = useCallback((value: number[]) => {
    if (wavesurfer.current && duration > 0) {
      const seekTime = (value[0] / 100) * duration
      wavesurfer.current.seekTo(seekTime / duration)
    }
  }, [duration])

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
    setIsMuted(false)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 shadow-2xl z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-64">
            <OptimizedImage
              src={artworkUrl}
              alt={beatTitle}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium text-sm line-clamp-1">{beatTitle}</h4>
              <p className="text-gray-400 text-xs line-clamp-1">{producerName}</p>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={!onPrevious}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hidden sm:flex"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="h-10 w-10 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={!onNext}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hidden sm:flex"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Waveform and Progress */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              
              <div className="flex-1 relative">
                {/* Waveform Container */}
                <div ref={waveformRef} className="w-full" />
                
                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-gray-800 rounded flex items-center justify-center">
                    <div className="text-xs text-gray-400">Loading waveform...</div>
                  </div>
                )}
              </div>
              
              <span className="text-xs text-gray-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Mobile Progress Bar */}
          <div className="flex-1 sm:hidden">
            <Slider
              value={[progressPercentage]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRepeat(!repeat)}
              className={`h-8 w-8 p-0 hidden sm:flex ${repeat ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Repeat className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShuffle(!shuffle)}
              className={`h-8 w-8 p-0 hidden sm:flex ${shuffle ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Shuffle className="w-4 h-4" />
            </Button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 hidden lg:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
