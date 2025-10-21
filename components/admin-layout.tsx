"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconComponent } from "@/components/ui/icons"
import { 
  Shield, 
  Users, 
  Music, 
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  FileDown
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

// Separate component that uses useSearchParams
function AdminNavigation({ sidebarOpen }: { sidebarOpen: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const adminNavItems = [
    { name: "Overview", href: "/admin", icon: BarChart3 },
    { name: "Artists", href: "/admin/artists", icon: Users },
    { name: "Releases", href: "/admin/releases", icon: Music },
    { name: "Ready for Delivery", href: "/admin?tab=delivery", icon: FileDown },
    { name: "Payouts", href: "/admin?tab=payouts", icon: Users },
    { name: "Takedowns", href: "/admin?tab=takedowns", icon: Shield },
    { name: "Sync Requests", href: "/admin?tab=sync", icon: Bell },
    { name: "Export", href: "/admin?tab=export", icon: Settings },
  ]

  return (
    <nav className="flex-1 p-4 space-y-2">
      {adminNavItems.map((item) => {
        const Icon = item.icon
        const isActive = 
          (pathname === "/admin" && (
            (item.href === "/admin" && !searchParams.get('tab')) ||
            item.href.includes(`tab=${searchParams.get('tab')}`)
          )) || 
          (item.href === "/admin/artists" && pathname === "/admin/artists") ||
          (item.href === "/admin/releases" && pathname === "/admin/releases")
        return (
          <button
            key={item.name}
            onClick={() => router.push(item.href)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
              ${isActive
                ? 'bg-red-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <Icon className="w-5 h-5" />
            {sidebarOpen && <span>{item.name}</span>}
          </button>
        )
      })}
    </nav>
  )
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSignOut = async () => {
    try {
      console.log('🚪 Admin logout initiated')
      await signOut()
      console.log('✅ Logout successful, redirecting to home')
      // Clear any cached admin state
      window.location.href = "/"  // Force full page reload instead of router.push
    } catch (error) {
      console.error("Error signing out:", error)
      // Fallback: force redirect even if signOut fails
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Admin Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}>
        {/* Admin Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">Admin Panel</h1>
                  <p className="text-gray-400 text-xs">OneSync Music</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <Suspense fallback={
          <nav className="flex-1 p-4 space-y-2">
            <div className="w-full h-10 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="w-full h-10 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="w-full h-10 bg-gray-700 rounded-lg animate-pulse"></div>
          </nav>
        }>
          <AdminNavigation sidebarOpen={sidebarOpen} />
        </Suspense>

        {/* Admin User Info */}
        <div className="p-4 border-t border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-red-600 text-white">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {sidebarOpen && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                      <p className="text-xs text-gray-400">Administrator</p>
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end">
              <DropdownMenuLabel className="text-gray-300">Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                onClick={() => router.push("/")}
                className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
              >
                <IconComponent name="view" className="mr-2 h-4 w-4" />
                View Site
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/settings")}
                className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-400 hover:bg-red-900/20 hover:text-red-300 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="flex-1 flex flex-col">
        {/* Admin Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
              <p className="text-gray-400 text-sm">Manage your music distribution platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-red-600/10 border border-red-600/20 rounded-lg px-3 py-1">
                <span className="text-red-400 text-sm font-medium">ADMIN MODE</span>
              </div>
              <div className="text-gray-400 text-sm">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </header>

        {/* Admin Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
