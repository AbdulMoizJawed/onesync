"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Music, 
  BarChart3, 
  Users, 
  DollarSign, 
  FileText, 
  Headphones,
  TrendingUp,
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Play
} from "lucide-react"

export default function ArtistToolsPage() {
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      title: 'Create & Upload',
      description: 'Upload your music and create your release',
      icon: Music,
      color: 'from-purple-500 to-pink-500',
      tools: ['Track Upload', 'Metadata Editor', 'Cover Art Designer', 'Release Calendar']
    },
    {
      title: 'Distribute',
      description: 'Send your music to streaming platforms',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      tools: ['Platform Selection', 'Release Scheduling', 'Territory Management', 'Pre-Save Links']
    },
    {
      title: 'Promote',
      description: 'Market your music to reach more fans',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      tools: ['Social Media Kit', 'Press Kit Generator', 'Playlist Pitching', 'Ad Campaign Manager']
    },
    {
      title: 'Analyze & Earn',
      description: 'Track performance and manage royalties',
      icon: DollarSign,
      color: 'from-orange-500 to-red-500',
      tools: ['Analytics Dashboard', 'Revenue Reports', 'Fan Insights', 'Payout Management']
    }
  ]

  const quickActions = [
    { icon: FileText, label: 'Generate EPK', description: 'Create your electronic press kit' },
    { icon: Users, label: 'Fan Insights', description: 'Understand your audience' },
    { icon: Headphones, label: 'Master Track', description: 'AI-powered mastering' },
    { icon: BarChart3, label: 'View Analytics', description: 'Track your performance' }
  ]

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Hero Section */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
                <div className="relative text-center py-12">
                  <h1 className="text-5xl font-bold mb-4 text-white">
                    Artist Tools
                  </h1>
                  <p className="text-xl text-gray-400 mb-8">
                    Everything you need to succeed in your music career
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-8 text-white">Your Release Journey</h2>
                
                {/* Step Indicators */}
                <div className="flex items-center justify-between mb-12">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center flex-1">
                      <button
                        onClick={() => setActiveStep(index)}
                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                          activeStep === index 
                            ? `bg-gradient-to-r ${step.color} scale-110` 
                            : index < activeStep 
                              ? 'bg-green-600' 
                              : 'bg-gray-800 border-2 border-gray-700'
                        }`}
                      >
                        {index < activeStep ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <span className="text-lg font-semibold">{index + 1}</span>
                        )}
                      </button>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 transition-all ${
                          index < activeStep ? 'bg-green-600' : 'bg-gray-800'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Active Step Content */}
                <div
                  key={activeStep}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-8 transition-all duration-300"
                >
                  <div className="flex items-start gap-6">
                    <div className={`p-4 rounded-xl bg-gradient-to-r ${steps[activeStep].color}`}>
                      {React.createElement(steps[activeStep].icon, { className: "w-8 h-8" })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-2 text-white">{steps[activeStep].title}</h3>
                      <p className="text-gray-400 mb-6">{steps[activeStep].description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {steps[activeStep].tools.map((tool, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg cursor-pointer transition-all hover:scale-105 border border-gray-700"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">{tool}</span>
                              <ArrowRight className="w-4 h-4 text-gray-500" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4 mt-6">
                        <Button 
                          onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
                          disabled={activeStep === 0}
                          variant="outline"
                          className="px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </Button>
                        <Button 
                          onClick={() => activeStep < steps.length - 1 && setActiveStep(activeStep + 1)}
                          disabled={activeStep === steps.length - 1}
                          className={`px-6 py-2 bg-gradient-to-r ${steps[activeStep].color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Next Step
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2 text-white">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-purple-500 transition-all hover:scale-105"
                    >
                      {React.createElement(action.icon, { className: "w-8 h-8 text-purple-500 mb-4" })}
                      <h3 className="font-semibold mb-2 text-white">{action.label}</h3>
                      <p className="text-sm text-gray-400">{action.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Overview */}
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-8 border border-purple-900/30">
                <h2 className="text-2xl font-semibold mb-6 text-white">Your Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">12</div>
                    <div className="text-gray-400">Releases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">48.2K</div>
                    <div className="text-gray-400">Total Streams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">$2,450</div>
                    <div className="text-gray-400">Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">89%</div>
                    <div className="text-gray-400">Profile Complete</div>
                  </div>
                </div>
              </div>

              {/* Get Started CTA */}
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Ready to Start Your Next Release?
                </h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  Follow our step-by-step process to ensure your music reaches the right audience and maximizes your revenue potential.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start New Release
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
