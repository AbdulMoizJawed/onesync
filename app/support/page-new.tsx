"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, MessageCircle, Clock, CheckCircle, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import CustomLoader from "@/components/ui/custom-loader"

interface SupportRequest {
  id: string
  subject: string
  category: string
  priority: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const FAQ_DATA: FAQItem[] = [
  // Distribution & Releases
  {
    id: "1",
    category: "Distribution & Releases",
    question: "How long does it take for my music to appear on streaming platforms?",
    answer: "Most platforms receive your music within 24-48 hours, but it can take 5-10 business days to go live. Spotify and Apple Music typically process releases within 2-7 days, while other platforms may take up to 10 days."
  },
  {
    id: "2", 
    category: "Distribution & Releases",
    question: "Which streaming platforms does OneSync distribute to?",
    answer: "We distribute to 100+ platforms including Spotify, Apple Music, Amazon Music, YouTube Music, Deezer, Tidal, Pandora, and many more. View the complete list in your dashboard."
  },
  {
    id: "3",
    category: "Distribution & Releases", 
    question: "Can I update my release after it's distributed?",
    answer: "You can update metadata, add/remove platforms, and modify promotional materials. However, changes to audio files require creating a new release to avoid disrupting streaming data and playlists."
  },
  
  // Royalties & Payments
  {
    id: "4",
    category: "Royalties & Payments",
    question: "How much do I earn per stream?",
    answer: "Streaming payouts vary by platform and region. Spotify pays $0.003-0.005 per stream, Apple Music pays $0.007-0.01, while YouTube Music pays $0.001-0.003. You keep 85% of all earnings."
  },
  {
    id: "5",
    category: "Royalties & Payments", 
    question: "When do I get paid?",
    answer: "Royalties are collected monthly from platforms and paid out quarterly. You can request a payout once you reach the minimum threshold of $20. Payments are processed within 5-10 business days."
  },
  {
    id: "6",
    category: "Royalties & Payments",
    question: "What is Publishing Administration?", 
    answer: "Publishing administration helps you collect royalties from radio play, streaming, sync placements, and live performances worldwide. We register your songs with collection societies and take 15% of collected publishing royalties."
  },
  
  // Account & Technical
  {
    id: "7",
    category: "Account & Technical",
    question: "What audio formats do you accept?",
    answer: "We accept WAV, FLAC, and AIFF files. We recommend 24-bit/44.1kHz WAV files for best quality. MP3 files are not accepted to ensure high-quality distribution."
  },
  {
    id: "8",
    category: "Account & Technical",
    question: "Can I remove my music from platforms?",
    answer: "Yes, you can takedown your music at any time. The process takes 5-10 business days. Note that removing music will break playlist placements and reset streaming statistics."
  },
  {
    id: "9",
    category: "Account & Technical",
    question: "Do I need to renew my account annually?",
    answer: "No, there are no annual fees or renewals. You pay once per release ($9.99 per single, $29.99 per album) and keep your music online forever. Additional services like playlist pitching have separate one-time fees."
  },
  
  // Rights & Copyright
  {
    id: "10",
    category: "Rights & Copyright",
    question: "Do I retain ownership of my music?",
    answer: "Yes, you retain 100% ownership of your master recordings and publishing rights. OneSync is a distribution service - we never claim ownership of your music or rights."
  },
  {
    id: "11",
    category: "Rights & Copyright", 
    question: "Can I distribute cover songs?",
    answer: "Yes, but you need a mechanical license. We can help obtain licenses through our partner services for $15 per cover song. This covers worldwide distribution rights."
  },
  {
    id: "12",
    category: "Rights & Copyright",
    question: "What if someone uploads my music without permission?",
    answer: "We take copyright seriously. Report unauthorized uploads through your dashboard or contact support immediately. We'll work with platforms to remove unauthorized content and can help with DMCA takedown requests."
  },
  
  // Marketing & Promotion
  {
    id: "13",
    category: "Marketing & Promotion",
    question: "How does playlist pitching work?", 
    answer: "Our playlist pitching service ($99-$499) submits your music to relevant curators across multiple genres and platform types. We provide detailed campaign reports and guarantee minimum submission numbers."
  },
  {
    id: "14",
    category: "Marketing & Promotion",
    question: "Can you help me get verified on Spotify?",
    answer: "While we can't guarantee verification, we provide guidance on the process and help optimize your profile. Verification depends on meeting Spotify's criteria including significant streaming activity and authentic social presence."
  },
  {
    id: "15", 
    category: "Marketing & Promotion",
    question: "Do you offer mastering services?",
    answer: "Yes, we offer professional mastering services starting at $25 per track. Our engineers use industry-standard tools and provide masters optimized for streaming platforms."
  }
]

const STATUS_COLORS = {
  open: 'bg-blue-500',
  in_progress: 'bg-yellow-500', 
  resolved: 'bg-green-500',
  closed: 'bg-gray-500'
}

export default function SupportPage() {
  const { user } = useAuth()
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'faq' | 'history'>('faq')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchSupportRequests()
    }
  }, [user])

  const fetchSupportRequests = async () => {
    try {
      const response = await fetch('/api/support')
      const data = await response.json()
      
      if (data.success) {
        setSupportRequests(data.supportRequests)
      }
    } catch (error) {
      console.error('Error fetching support requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4" />
      case 'in_progress':
        return <MessageCircle className="w-4 h-4" />
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <HelpCircle className="w-4 h-4" />
    }
  }

  const openIntercom = () => {
    window.location.href = 'mailto:support@onesync.music?subject=Support Request from OneSync Platform'
  }

  const filteredFAQ = FAQ_DATA.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const faqByCategory = filteredFAQ.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, FAQItem[]>)

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                  <CustomLoader size="lg" showText text="Loading support..." />
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-4 lg:p-6">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8">
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Support Center</h1>
                  <p className="text-sm sm:text-base text-gray-400">Find answers to common questions or get help from our team</p>
                </div>
                <Button 
                  onClick={openIntercom}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Contact Support</span>
                  <span className="sm:hidden">Contact</span>
                </Button>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'faq'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span className="hidden sm:inline">Frequently Asked Questions</span>
                  <span className="sm:hidden">FAQ</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span className="hidden sm:inline">Support History ({supportRequests.length})</span>
                  <span className="sm:hidden">History ({supportRequests.length})</span>
                </button>
              </div>

              {/* FAQ Tab */}
              {activeTab === 'faq' && (
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search FAQ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* FAQ Categories */}
                  <div className="space-y-6">
                    {Object.entries(faqByCategory).map(([category, items]) => (
                      <Card key={category} className="card-dark">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg text-white">{category}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="border border-gray-700 rounded-lg overflow-hidden"
                            >
                              <button
                                onClick={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                                className="w-full px-4 py-3 text-left bg-gray-800 hover:bg-gray-750 transition-colors flex items-center justify-between"
                              >
                                <span className="font-medium text-white text-sm sm:text-base">{item.question}</span>
                                {expandedFAQ === item.id ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                )}
                              </button>
                              {expandedFAQ === item.id && (
                                <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
                                  <p className="text-gray-300 text-sm leading-relaxed">{item.answer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* No results */}
                  {searchQuery && Object.keys(faqByCategory).length === 0 && (
                    <div className="text-center py-12">
                      <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
                      <p className="text-gray-400 mb-6">
                        Can't find what you're looking for? Contact our support team.
                      </p>
                      <Button onClick={openIntercom} className="bg-blue-600 hover:bg-blue-700">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact Support
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Support History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {supportRequests.length === 0 ? (
                    <Card className="card-dark">
                      <CardContent className="text-center py-12">
                        <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No Support Requests</h3>
                        <p className="text-gray-400 mb-6">
                          You haven't submitted any support requests yet.
                        </p>
                        <Button onClick={openIntercom} className="bg-blue-600 hover:bg-blue-700">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact Support
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    supportRequests.map((request) => (
                      <Card key={request.id} className="card-dark">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white text-sm sm:text-base truncate">
                                {request.subject}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                                {formatDate(request.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className={`${STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]} text-white border-none text-xs`}
                              >
                                {getStatusIcon(request.status)}
                                <span className="ml-1 capitalize">
                                  {request.status.replace('_', ' ')}
                                </span>
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-300 text-xs sm:text-sm line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                            <span className="capitalize">{request.category}</span>
                            <span>•</span>
                            <span className="capitalize">{request.priority} Priority</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
