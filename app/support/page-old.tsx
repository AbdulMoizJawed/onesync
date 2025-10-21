"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, MessageSquare, Send, Clock, CheckCircle } from "lucide-react"
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

const SUPPORT_CATEGORIES = [
  { value: 'general', label: 'General Question' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'distribution', label: 'Music Distribution' },
  { value: 'mastering', label: 'AI Mastering' },
  { value: 'account', label: 'Account Management' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'bug', label: 'Bug Report' }
]

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-gray-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' }
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
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')

  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: ''
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.category || !formData.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Support request submitted successfully!')
        setFormData({
          subject: '',
          category: '',
          priority: 'medium',
          description: ''
        })
        fetchSupportRequests()
        setActiveTab('history')
      } else {
        toast.error(data.error || 'Failed to submit support request')
      }
    } catch (error) {
      console.error('Error submitting support request:', error)
      toast.error('Failed to submit support request')
    } finally {
      setSubmitting(false)
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
        return <MessageSquare className="w-4 h-4" />
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <HelpCircle className="w-4 h-4" />
    }
  }

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
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Support Center</h1>
                  <p className="text-sm sm:text-base text-gray-400">Get help with your account and services - powered by Intercom</p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('new')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span className="hidden sm:inline">New Request</span>
                  <span className="sm:hidden">New</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span className="hidden sm:inline">Request History ({supportRequests.length})</span>
                  <span className="sm:hidden">History ({supportRequests.length})</span>
                </button>
              </div>

              {activeTab === 'new' && (
                <Card className="card-dark">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Submit Support Request
                    </CardTitle>
                    <p className="text-gray-400 text-sm mt-2">
                      Your request will be sent to our support team via Intercom for the fastest response. 
                      You'll receive email notifications about updates to your request.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label className="text-white">Subject *</Label>
                          <Input
                            value={formData.subject}
                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Brief description of your issue"
                            className="input-dark"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="input-dark">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="glass border-gray-800">
                              {SUPPORT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value} className="text-gray-200">
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value: string) => setFormData(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger className="input-dark">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass border-gray-800">
                            {PRIORITY_LEVELS.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value} className="text-gray-200">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                                  {priority.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Description *</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Please provide detailed information about your issue or question..."
                          className="input-dark min-h-[120px]"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full button-primary"
                      >
                        {submitting ? (
                          <>
                            <CustomLoader size="sm" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Request
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {supportRequests.length === 0 ? (
                    <Card className="card-dark">
                      <CardContent className="p-8 text-center">
                        <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Support Requests</h3>
                        <p className="text-gray-400 mb-4">You haven't submitted any support requests yet.</p>
                        <Button onClick={() => setActiveTab('new')} className="button-primary">
                          Submit Your First Request
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    supportRequests.map((request) => (
                      <Card key={request.id} className="card-dark">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{request.subject}</h3>
                                <Badge
                                  variant="secondary"
                                  className={`${STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]} text-white`}
                                >
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(request.status)}
                                    {request.status.replace('_', ' ').toUpperCase()}
                                  </div>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                <span>#{request.id.slice(0, 8)}</span>
                                <span>{SUPPORT_CATEGORIES.find(c => c.value === request.category)?.label}</span>
                                <span>{formatDate(request.created_at)}</span>
                              </div>
                              <p className="text-gray-300 text-sm">{request.description}</p>
                            </div>
                            <div className="ml-4">
                              <div className={`w-3 h-3 rounded-full ${
                                PRIORITY_LEVELS.find(p => p.value === request.priority)?.color
                              }`} />
                            </div>
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
