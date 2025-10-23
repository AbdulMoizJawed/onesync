// components/ImprovedAdminNav.tsx
// COMPLETE FINAL VERSION - Copy this entire file

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import {
  Users, Music, DollarSign, AlertCircle, MessageSquare,
  FileText, Target, Zap, Flag, TrendingUp, Bell,
  Search, Settings, LayoutDashboard, Upload, Edit,
  Shield, ChevronLeft, Menu, X
} from 'lucide-react'
import { useState } from 'react'

interface AdminStats {
  totalUsers: number
  totalReleases: number
  pendingReleases: number
  payoutRequests: number
  supportTickets: number
  publishingRequests: number
  playlistCampaigns: number
  beatsPendingApproval: number
  activeMasteringJobs: number
  forumFlags: number
  aiServiceCost: number
  platformRevenue: number
  timestamp: string
}

interface ImprovedAdminNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  stats: AdminStats | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  user: any
  children: React.ReactNode
}

export default function ImprovedAdminNav({ 
  activeTab, 
  setActiveTab, 
  stats, 
  searchTerm, 
  setSearchTerm, 
  user,
  children 
}: ImprovedAdminNavProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Navigation structure
  const navigation = {
    main: [
      {
        id: 'overview',
        label: 'Dashboard',
        icon: LayoutDashboard,
        description: 'Overview & analytics'
      }
    ],
    content: [
      {
        id: 'releases',
        label: 'Releases',
        icon: Music,
        badge: stats?.pendingReleases || 0,
        badgeColor: 'bg-yellow-600',
        description: 'Pending releases'
      },
      {
        id: 'upload',
        label: 'Upload Beat',
        icon: Upload,
        description: 'Add new beat'
      },
      {
        id: 'manage',
        label: 'Manage Beats',
        icon: Music,
        badge: stats?.beatsPendingApproval || 0,
        badgeColor: 'bg-cyan-600',
        description: 'Beat marketplace'
      },
      {
        id: 'edits',
        label: 'Edit Requests',
        icon: Edit,
        description: 'Release edits'
      }
    ],
    financial: [
      {
        id: 'payouts',
        label: 'Payouts',
        icon: DollarSign,
        badge: stats?.payoutRequests || 0,
        badgeColor: 'bg-purple-600',
        description: 'Payout requests'
      },
      {
        id: 'financial',
        label: 'Analytics',
        icon: TrendingUp,
        description: 'Revenue & reports'
      }
    ],
    services: [
      {
        id: 'campaigns',
        label: 'Campaigns',
        icon: Target,
        badge: stats?.playlistCampaigns || 0,
        badgeColor: 'bg-pink-600',
        description: 'Playlist campaigns'
      },
      {
        id: 'mastering',
        label: 'Mastering',
        icon: Zap,
        badge: stats?.activeMasteringJobs || 0,
        badgeColor: 'bg-yellow-600',
        description: 'Mastering jobs'
      },
      {
        id: 'publishing',
        label: 'Publishing',
        icon: FileText,
        badge: stats?.publishingRequests || 0,
        badgeColor: 'bg-yellow-600',
        description: 'Publishing requests'
      }
    ],
    moderation: [
      {
        id: 'users',
        label: 'Users',
        icon: Users,
        description: 'User management'
      },
      {
        id: 'forum-mod',
        label: 'Forum',
        icon: Flag,
        badge: stats?.forumFlags || 0,
        badgeColor: 'bg-red-600',
        description: 'Content flags'
      },
      {
        id: 'takedowns',
        label: 'Takedowns',
        icon: AlertCircle,
        badgeColor: 'bg-red-600',
        description: 'DMCA requests'
      }
    ],
    support: [
      {
        id: 'support',
        label: 'Support',
        icon: MessageSquare,
        badge: stats?.supportTickets || 0,
        badgeColor: 'bg-blue-600',
        description: 'Open tickets'
      },
      {
        id: 'notifications',
        label: 'Send Alert',
        icon: Bell,
        description: 'User notifications'
      }
    ]
  }

  const NavItem = ({ item }: any) => (
    <button
      onClick={() => {
        setActiveTab(item.id)
        setSidebarOpen(false) // Close mobile sidebar on selection
      }}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${
        activeTab === item.id
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <item.icon className={`w-5 h-5 flex-shrink-0 ${
          activeTab === item.id ? 'text-blue-400' : ''
        }`} />
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium text-sm">{item.label}</div>
          <div className="text-xs text-gray-500 truncate">{item.description}</div>
        </div>
      </div>
      {item.badge > 0 && (
        <Badge className={`${item.badgeColor} text-white ml-2 flex-shrink-0`}>
          {item.badge}
        </Badge>
      )}
    </button>
  )

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Global Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search anything..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('releases')
              setSidebarOpen(false)
            }}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-auto py-3 flex flex-col gap-1"
          >
            <Music className="w-4 h-4" />
            <span className="text-xs">Releases</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('payouts')
              setSidebarOpen(false)
            }}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-auto py-3 flex flex-col gap-1"
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Payouts</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('support')
              setSidebarOpen(false)
            }}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-auto py-3 flex flex-col gap-1"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">Tickets</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('forum-mod')
              setSidebarOpen(false)
            }}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-auto py-3 flex flex-col gap-1"
          >
            <Flag className="w-4 h-4" />
            <span className="text-xs">Forum</span>
          </Button>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Main</h3>
          <div className="space-y-1">
            {navigation.main.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Content Management */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Content</h3>
          <div className="space-y-1">
            {navigation.content.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Financial */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Financial</h3>
          <div className="space-y-1">
            {navigation.financial.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Services</h3>
          <div className="space-y-1">
            {navigation.services.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Moderation */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Moderation</h3>
          <div className="space-y-1">
            {navigation.moderation.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Support</h3>
          <div className="space-y-1">
            {navigation.support.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Button 
          variant="outline" 
          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          onClick={() => window.location.href = '/'}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to App
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 border border-gray-800 rounded-lg"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Fixed */}
      <div className="hidden lg:flex w-80 bg-gray-900 border-r border-gray-800 flex-col flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-gray-900 border-r border-gray-800 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Main Content Area - Full Width, Scrollable */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Header Bar */}
        <div className="bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className='hidden md:block'></div>
              <div className="flex items-center md:hidden">
                <Shield className="w-8 h-8 text-blue-400 mr-3" />
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Badge
                  variant="outline"
                  className="text-green-400 border-green-400"
                >
                  {user?.email}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Back to App
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 lg:p-6">
            {/* Tabs wrapper with children - NO max-width */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {children}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}