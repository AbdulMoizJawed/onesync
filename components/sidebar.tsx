"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { icons } from "@/lib/icons"
import { Button } from "@/components/ui/button"


const navigation = [
  { name: "Dashboard", href: "/", icon: icons.dashboard },
  { name: "Releases", href: "/releases", icon: icons.releases },
  { name: "Upload", href: "/upload", icon: icons.upload },
  { name: "Artist Tools", href: "/artist-tools", icon: icons.artistTools },
  { name: "Analytics", href: "/analytics", icon: icons.analytics },
  { name: "Industry Stats", href: "/industry-stats", icon: icons.barChart },
  { name: "Beat Marketplace", href: "/beats", icon: icons.beats },
  { name: "Artists", href: "/artists", icon: icons.artists },
  { name: "Mastering", href: "/mastering", icon: icons.mastering },
  // { name: "Messages", href: "/messages", icon: icons.forum },
  { name: "Forum", href: "/forum", icon: icons.forum },
  { name: "Sync", href: "/sync", icon: icons.sync },
  { name: "Payments", href: "/payments", icon: icons.payments },
  { name: "Settings", href: "/settings", icon: icons.settings },
]

const supportNav = { name: "Support", href: "/support", icon: icons.support }



function CollapsedSidebarContent() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto">
      {navigation.map((item, index) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className="block"
          >
            <div
              className={cn(
                "flex items-center justify-center h-12 w-12 mx-auto rounded-lg relative group transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent",
              )}
              title={item.name}
            >
              <item.icon className="h-5 w-5 transition-all duration-200" />

              {/* Active indicator */}
              {isActive && (
                <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
              )}
            </div>
          </Link>
        )
      })}
      
      {/* Support at bottom */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <Link
          key={supportNav.name}
          href={supportNav.href}
          className="block"
        >
          <div
            className={cn(
              "flex items-center justify-center h-12 w-12 mx-auto rounded-lg relative group transition-all duration-200",
              pathname === supportNav.href
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent",
            )}
            title={supportNav.name}
          >
            <supportNav.icon className="h-5 w-5 transition-all duration-200" />
            {pathname === supportNav.href && (
              <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
            )}
          </div>
        </Link>
      </div>
    </nav>
  )
}

function ExpandedSidebarContent({ onItemClick }: { onItemClick?: () => void } = {}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navigation.map((item, index) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg group relative transition-all duration-200",
              isActive
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-gray-400 hover:text-white hover:bg-white/5 hover:border-transparent border border-transparent",
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0 transition-all duration-200" />
            <span className="truncate flex-1 font-inter">{item.name}</span>

            {/* Active indicator */}
            {isActive && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
            )}
          </Link>
        )
      })}
      
      {/* Support at bottom */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <Link
          href={supportNav.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg group relative transition-all duration-200",
            pathname === supportNav.href
              ? "bg-white/10 text-white shadow-sm border border-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5 hover:border-transparent border border-transparent",
          )}
        >
          <supportNav.icon className="h-5 w-5 flex-shrink-0 transition-all duration-200" />
          <span className="truncate flex-1 font-inter">{supportNav.name}</span>
          {pathname === supportNav.href && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
          )}
        </Link>
      </div>
    </nav>
  )
}

export function Sidebar({ 
  className,
  mobileOpen = false,
  onMobileClose
}: { 
  className?: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const [isMounted, setIsMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileCollapsed, setMobileCollapsed] = useState(false)
  const pathname = usePathname()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  
  // Safe mounting for client-side only rendering and load from localStorage
  useEffect(() => {
    setIsMounted(true)
    // Load collapsed state from localStorage
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsedState !== null) {
      setCollapsed(savedCollapsedState === 'true')
    }
  }, [])
  
  // Save to localStorage whenever collapsed state changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebarCollapsed', collapsed.toString())
    }
  }, [collapsed, isMounted])
  
  // Reset mobile collapsed state when sidebar closes
  useEffect(() => {
    if (!mobileOpen) {
      setMobileCollapsed(false)
    }
  }, [mobileOpen])
  
  // Close mobile sidebar when route changes (only if expanded)
  useEffect(() => {
    if (mobileOpen && !mobileCollapsed && isMounted) {
      onMobileClose?.()
    }
  }, [pathname])
  
  // Escape key handler
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        onMobileClose?.()
      }
    }
    
    if (mobileOpen) {
      window.addEventListener('keydown', handleEscapeKey)
    }
    
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [mobileOpen, onMobileClose])

  // Click outside handler (only when expanded)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileOpen && 
        !mobileCollapsed &&
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        onMobileClose?.()
      }
    }
    
    if (mobileOpen && !mobileCollapsed) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileOpen, mobileCollapsed, onMobileClose])

  if (!isMounted) return null

  const handleToggleCollapse = () => {
    console.log('Toggling sidebar collapse, current state:', collapsed)
    setCollapsed(!collapsed)
  }

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 h-screen bg-black/95 border-r border-white/10 backdrop-blur-xl transition-all duration-300 ease-out z-40",
          collapsed ? "w-20" : "w-64",
          className,
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center p-4 border-b border-white/10 h-20",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {collapsed ? (
            <button
              onClick={handleToggleCollapse}
              className="w-12 h-12 flex items-center cursor-pointer justify-center hover:bg-white/5 rounded-lg transition-all duration-200"
              aria-label="Expand sidebar"
              type="button"
              title="Expand sidebar"
            >
              <Image
                src="/loaders/custom-loader.png"
                alt="Logo"
                width={48}
                height={48}
                className="rounded-sm"
              />
            </button>
          ) : (
            <>
              <Image src="/logo.png" alt="ONE Logo" width={120} height={40} className="rounded-lg" />
              {/* Desktop Close Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleToggleCollapse()
                }}
                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                aria-label="Collapse sidebar"
                type="button"
              >
                <icons.close className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        {collapsed ? <CollapsedSidebarContent /> : <ExpandedSidebarContent />}

        {/* Toggle Button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleToggleCollapse()
            }}
            className={cn(
              "text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 rounded-lg flex items-center",
              collapsed ? "w-12 h-10 mx-auto justify-center" : "w-full justify-start px-3 py-2"
            )}
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <icons.chevronRight className={cn("h-4 w-4 transition-transform duration-200", !collapsed && "rotate-180")} />
            {!collapsed && <span className="ml-2 text-sm font-medium">Collapse</span>}
          </button>
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-white/10">
            <div className="text-xs text-gray-500 text-center">
              © 2025 OneSync
              <div className="text-[10px] text-gray-600 mt-1">v2.1.0</div>
            </div>
          </div>
        )}
      </div>

      {/* Spacer div to push content when sidebar is visible */}
      <div className={cn(
        "hidden md:block transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )} />
    </>
  )
}