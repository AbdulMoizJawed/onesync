"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Film, 
  Tv, 
  Radio, 
  Music, 
  Gamepad2, 
  DollarSign, 
  Calendar, 
  Building,
  Mail,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from "sonner"

interface SyncOpportunity {
  id: string
  title: string
  type: 'film' | 'tv' | 'commercial' | 'game' | 'podcast' | 'other'
  description: string | null
  genre: string | null
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  company: string | null
  contact_email: string | null
  requirements: string | null
  status: 'active' | 'closed' | 'filled'
  created_at: string
}

const typeIcons = {
  film: Film,
  tv: Tv,
  commercial: Radio,
  game: Gamepad2,
  podcast: Music,
  other: Music
}

const typeColors = {
  film: 'bg-red-500',
  tv: 'bg-blue-500',
  commercial: 'bg-green-500',
  game: 'bg-purple-500',
  podcast: 'bg-yellow-500',
  other: 'bg-gray-500'
}

export function SyncOpportunitiesManager() {
  const [opportunities, setOpportunities] = useState<SyncOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    genre: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    company: '',
    contact_email: '',
    requirements: ''
  })

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/admin/sync-opportunities')
      const data = await response.json()
      
      if (data.opportunities) {
        setOpportunities(data.opportunities)
      }
    } catch (error) {
      console.error('Error fetching sync opportunities:', error)
      toast.error('Failed to fetch sync opportunities')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/sync-opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        }),
      })

      const data = await response.json()

      if (data.opportunity) {
        setOpportunities([data.opportunity, ...opportunities])
        setShowCreateDialog(false)
        setFormData({
          title: '',
          type: '',
          description: '',
          genre: '',
          budget_min: '',
          budget_max: '',
          deadline: '',
          company: '',
          contact_email: '',
          requirements: ''
        })
        toast.success('Sync opportunity created successfully')
      } else {
        toast.error('Failed to create sync opportunity')
      }
    } catch (error) {
      console.error('Error creating sync opportunity:', error)
      toast.error('Failed to create sync opportunity')
    } finally {
      setSubmitting(false)
    }
  }

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Budget TBD'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `$${min.toLocaleString()}+`
    if (max) return `Up to $${max.toLocaleString()}`
    return 'Budget TBD'
  }

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline set'
    return new Date(deadline).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card className="bg-purple-900/20 border-purple-700/50">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-purple-300">Loading sync opportunities...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-purple-900/20 border-purple-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <Film className="w-5 h-5" />
              Sync Opportunities ({opportunities.length})
            </CardTitle>
            <CardDescription className="text-purple-300">
              Manage sync licensing opportunities for artists
            </CardDescription>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Sync Opportunity</DialogTitle>
                <DialogDescription>
                  Add a new sync licensing opportunity that will be visible to artists
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Action Film Soundtrack"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({...formData, type: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="film">Film</SelectItem>
                        <SelectItem value="tv">TV Show</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="game">Video Game</SelectItem>
                        <SelectItem value="podcast">Podcast</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the project and what type of music is needed..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      value={formData.genre}
                      onChange={(e) => setFormData({...formData, genre: e.target.value})}
                      placeholder="e.g., Hip-Hop, Rock, Electronic"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Production company or client"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget_min">Min Budget ($)</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({...formData, budget_min: e.target.value})}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget_max">Max Budget ($)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({...formData, budget_max: e.target.value})}
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    placeholder="Any specific requirements, usage rights, or submission guidelines..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !formData.title || !formData.type}>
                    {submitting ? 'Creating...' : 'Create Opportunity'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {opportunities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Film className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No sync opportunities yet</h3>
              <p className="text-sm">Create your first sync opportunity to get started.</p>
            </div>
          ) : (
            opportunities.map((opportunity) => {
              const TypeIcon = typeIcons[opportunity.type]
              const typeColor = typeColors[opportunity.type]
              
              return (
                <Card key={opportunity.id} className="bg-gray-900/60 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${typeColor}`}>
                          <TypeIcon className="w-4 h-4 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">{opportunity.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {opportunity.type}
                            </Badge>
                            {opportunity.status === 'active' && (
                              <Badge className="bg-green-600 text-xs">Active</Badge>
                            )}
                          </div>
                          
                          {opportunity.description && (
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                              {opportunity.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {opportunity.company && (
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                <span>{opportunity.company}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{formatBudget(opportunity.budget_min, opportunity.budget_max)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDeadline(opportunity.deadline)}</span>
                            </div>
                            
                            {opportunity.contact_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{opportunity.contact_email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" variant="outline" className="h-8">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
