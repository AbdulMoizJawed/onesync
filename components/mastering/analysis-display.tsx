"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  Volume2, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Waves,
  Headphones,
  Radio
} from "lucide-react"
import { formatLoudness, formatDynamicRange } from "@/lib/roex-api"
import type { MixAnalysisResults } from "@/lib/roex-api"

interface AnalysisDisplayProps {
  analysis: MixAnalysisResults
  className?: string
}

export function AnalysisDisplay({ analysis, className = "" }: AnalysisDisplayProps) {
  const payload = analysis.payload

  const getLoudnessColor = (lufs: number) => {
    if (lufs >= -14) return "text-red-400"
    if (lufs >= -18) return "text-yellow-400"
    return "text-green-400"
  }

  const getClippingColor = (clipping: string) => {
    switch (clipping) {
      case "NONE": return "text-green-400"
      case "LIGHT": return "text-yellow-400"
      case "MODERATE": return "text-orange-400"
      case "HEAVY": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  const getStereoFieldColor = (field: string) => {
    switch (field) {
      case "NARROW": return "text-orange-400"
      case "MEDIUM": return "text-green-400"
      case "WIDE": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

  const getFrequencyLevel = (level: string) => {
    const levels = { LOW: 25, MEDIUM: 50, HIGH: 75 }
    return levels[level as keyof typeof levels] || 0
  }

  const getFrequencyColor = (level: string) => {
    switch (level) {
      case "LOW": return "bg-red-500"
      case "MEDIUM": return "bg-yellow-500"
      case "HIGH": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Technical Overview */}
      <Card className="card-dark border-blue-500/20 bg-gradient-to-br from-blue-900/10 to-cyan-900/10 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl">Technical Analysis</span>
              <p className="text-sm text-gray-400 font-normal">Professional audio quality metrics</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Loudness</span>
              </div>
              <p className={`text-2xl font-bold ${getLoudnessColor(payload.integrated_loudness_lufs)}`}>
                {formatLoudness(payload.integrated_loudness_lufs)}
              </p>
              <p className="text-xs text-gray-500">Integrated LUFS</p>
            </div>

            <div className="bg-gray-800/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">Peak Level</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {payload.peak_loudness_dbfs.toFixed(1)} dB
              </p>
              <p className="text-xs text-gray-500">Peak dBFS</p>
            </div>

            <div className="bg-gray-800/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Sample Rate</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {(payload.sample_rate / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-gray-500">{payload.bit_depth}-bit</p>
            </div>

            <div className="bg-gray-800/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Waves className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Stereo Field</span>
              </div>
              <p className={`text-lg font-bold ${getStereoFieldColor(payload.stereo_field)}`}>
                {payload.stereo_field}
              </p>
              <p className="text-xs text-gray-500">Image width</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Issues */}
      <Card className="card-dark border-yellow-500/20 bg-gradient-to-br from-yellow-900/10 to-orange-900/10 animate-fade-in-up stagger-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl">Quality Assessment</span>
              <p className="text-sm text-gray-400 font-normal">Potential issues and compatibility</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Clipping</span>
                <Badge 
                  variant="secondary" 
                  className={`${getClippingColor(payload.clipping)} bg-gray-800`}
                >
                  {payload.clipping}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {payload.clipping === "NONE" ? "No clipping detected" : "Audio clipping present"}
              </p>
            </div>

            <div className="bg-gray-800/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Phase Issues</span>
                <div className="flex items-center gap-1">
                  {payload.phase_issues ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">Yes</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">None</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {payload.phase_issues ? "Phase correlation issues found" : "Phase correlation is good"}
              </p>
            </div>

            <div className="bg-gray-800/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Mono Compatible</span>
                <div className="flex items-center gap-1">
                  {payload.mono_compatible ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Yes</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">Issues</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {payload.mono_compatible ? "Mono playback compatible" : "May have mono compatibility issues"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequency Analysis */}
      <Card className="card-dark border-green-500/20 bg-gradient-to-br from-green-900/10 to-emerald-900/10 animate-fade-in-up stagger-3">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl">Frequency Balance</span>
              <p className="text-sm text-gray-400 font-normal">Tonal profile analysis</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Bass (20-200 Hz)", value: payload.tonal_profile.bass_frequency, key: "bass" },
              { label: "Low Mid (200-500 Hz)", value: payload.tonal_profile.low_mid_frequency, key: "lowMid" },
              { label: "High Mid (2-8 kHz)", value: payload.tonal_profile.high_mid_frequency, key: "highMid" },
              { label: "High (8-20 kHz)", value: payload.tonal_profile.high_frequency, key: "high" }
            ].map((freq) => (
              <div key={freq.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{freq.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${freq.value === 'HIGH' ? 'text-green-400' : freq.value === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'} bg-gray-800`}
                  >
                    {freq.value}
                  </Badge>
                </div>
                <div className="relative">
                  <Progress 
                    value={getFrequencyLevel(freq.value)} 
                    className="h-2 bg-gray-700"
                  />
                  <div 
                    className={`absolute inset-0 h-2 rounded-full transition-all ${getFrequencyColor(freq.value)}`}
                    style={{ width: `${getFrequencyLevel(freq.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="card-dark border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-pink-900/10 animate-fade-in-up stagger-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl">AI Recommendations</span>
              <p className="text-sm text-gray-400 font-normal">Suggested improvements for your track</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/30 p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-3">Mix Recommendations</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Loudness</span>
                  <span className="text-sm text-purple-400">
                    {formatDynamicRange(payload.if_mix_loudness)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Dynamic Range</span>
                  <span className="text-sm text-purple-400">
                    {formatDynamicRange(payload.if_mix_drc)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-3">Master Recommendations</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Loudness</span>
                  <span className="text-sm text-pink-400">
                    {formatDynamicRange(payload.if_master_loudness)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Dynamic Range</span>
                  <span className="text-sm text-pink-400">
                    {formatDynamicRange(payload.if_master_drc)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {payload.summary && Object.keys(payload.summary).length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/20">
              <h4 className="text-white font-semibold mb-2">Analysis Summary</h4>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(payload.summary, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
