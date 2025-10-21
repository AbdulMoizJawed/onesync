"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Settings, Volume2, Music, Zap } from "lucide-react"
import { MUSICAL_STYLES, LOUDNESS_PRESETS, SAMPLE_RATES, getMusicalStyleDisplayName } from "@/lib/roex-api"
import type { MusicalStyle, LoudnessPreset, SampleRate } from "@/lib/roex-api"

interface MasteringConfigProps {
  onConfigChange: (config: MasteringConfig) => void
  disabled?: boolean
  initialConfig?: Partial<MasteringConfig>
}

export interface MasteringConfig {
  title: string
  artistName: string
  musicalStyle: MusicalStyle
  loudnessPreset: LoudnessPreset
  sampleRate: SampleRate
  analyzeFirst: boolean
}

export function MasteringConfig({ onConfigChange, disabled = false, initialConfig = {} }: MasteringConfigProps) {
  const [config, setConfig] = useState<MasteringConfig>({
    title: "",
    artistName: "",
    musicalStyle: "pop",
    loudnessPreset: "streaming",
    sampleRate: 44100,
    analyzeFirst: false,
    ...initialConfig
  })

  const handleConfigUpdate = (updates: Partial<MasteringConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const getPresetDescription = (preset: LoudnessPreset) => {
    const descriptions: Record<string, string> = {
      streaming: "Optimized for Spotify, Apple Music (-14 LUFS)",
      cd: "Commercial CD standard (-9 LUFS)", 
      vinyl: "Vinyl mastering with warmth (-16 LUFS)",
      broadcast: "Radio and TV broadcast (-23 LUFS)",
      club: "Club and DJ use (-6 LUFS)",
      custom: "Custom loudness settings"
    }
    return descriptions[preset] || "Unknown preset"
  }

  const getSampleRateDescription = (rate: SampleRate) => {
    const descriptions: Record<string, string> = {
      "44100": "CD Quality (44.1 kHz)",
      "48000": "Professional (48 kHz)",
      "88200": "High Quality (88.2 kHz)",
      "96000": "High-Res Audio (96 kHz)",
      "192000": "Ultra High-Res (192 kHz)"
    }
    return descriptions[rate.toString()] || "Unknown sample rate"
  }

  return (
    <Card className="card-dark border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-pink-900/10 animate-fade-in-up">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <span className="text-lg sm:text-xl">Mastering Configuration</span>
            <p className="text-xs sm:text-sm text-gray-400 font-normal">Customize your AI mastering settings</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300 text-sm">Track Title</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => handleConfigUpdate({ title: e.target.value })}
              placeholder="Enter track title"
              disabled={disabled}
              className="bg-gray-800/50 border-gray-600 text-white focus:border-purple-500 h-10 sm:h-auto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist" className="text-gray-300 text-sm">Artist Name</Label>
            <Input
              id="artist"
              value={config.artistName}
              onChange={(e) => handleConfigUpdate({ artistName: e.target.value })}
              placeholder="Enter artist name"
              disabled={disabled}
              className="bg-gray-800/50 border-gray-600 text-white focus:border-purple-500 h-10 sm:h-auto"
            />
          </div>
        </div>

        {/* Musical Style */}
        <div className="space-y-3">
          <Label className="text-gray-300 flex items-center gap-2">
            <Music className="w-4 h-4" />
            Musical Style
          </Label>
          <Select 
            value={config.musicalStyle} 
            onValueChange={(value) => handleConfigUpdate({ musicalStyle: value as MusicalStyle })}
            disabled={disabled}
          >
            <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white focus:border-purple-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {MUSICAL_STYLES.map((style) => (
                <SelectItem key={style} value={style} className="text-white hover:bg-gray-700">
                  {getMusicalStyleDisplayName(style)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-400">
            Choose the style that best matches your track for optimal AI processing
          </p>
        </div>

        {/* Loudness Preset */}
        <div className="space-y-3">
          <Label className="text-gray-300 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Loudness Target
          </Label>
          <Select 
            value={config.loudnessPreset} 
            onValueChange={(value) => handleConfigUpdate({ loudnessPreset: value as LoudnessPreset })}
            disabled={disabled}
          >
            <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white focus:border-purple-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {LOUDNESS_PRESETS.map((preset) => (
                <SelectItem key={preset} value={preset} className="text-white hover:bg-gray-700">
                  <div className="flex flex-col">
                    <span className="font-medium">{preset}</span>
                    <span className="text-xs text-gray-400">{getPresetDescription(preset)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-400">
            {getPresetDescription(config.loudnessPreset)}
          </p>
        </div>

        {/* Sample Rate */}
        <div className="space-y-3">
          <Label className="text-gray-300 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Output Sample Rate
          </Label>
          <Select 
            value={config.sampleRate.toString()} 
            onValueChange={(value) => handleConfigUpdate({ sampleRate: parseInt(value) as SampleRate })}
            disabled={disabled}
          >
            <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white focus:border-purple-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {SAMPLE_RATES.map((rate) => (
                <SelectItem key={rate} value={rate.toString()} className="text-white hover:bg-gray-700">
                  {getSampleRateDescription(rate)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-400">
            {getSampleRateDescription(config.sampleRate)}
          </p>
        </div>

        {/* Analysis Option */}
        <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-white font-medium">Pre-Master Analysis</p>
              <p className="text-sm text-gray-400">Analyze your mix first for technical insights</p>
            </div>
          </div>
          <Button
            variant={config.analyzeFirst ? "default" : "outline"}
            size="sm"
            onClick={() => handleConfigUpdate({ analyzeFirst: !config.analyzeFirst })}
            disabled={disabled}
            className={config.analyzeFirst ? "bg-yellow-600 hover:bg-yellow-700" : ""}
          >
            {config.analyzeFirst ? "Enabled" : "Enable"}
          </Button>
        </div>

        {/* Configuration Summary */}
        <div className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/20">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Configuration Summary
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 hover:bg-purple-600/30">
              {getMusicalStyleDisplayName(config.musicalStyle)}
            </Badge>
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30">
              {config.loudnessPreset}
            </Badge>
            <Badge variant="secondary" className="bg-green-600/20 text-green-300 hover:bg-green-600/30">
              {config.sampleRate / 1000}kHz
            </Badge>
            {config.analyzeFirst && (
              <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30">
                Analysis Enabled
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
