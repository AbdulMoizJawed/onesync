"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tabs as AntTabs, Button as AntButton, Card as AntCard } from 'antd'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react'

// Hook to detect screen size
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const updateScreenSize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth
        if (width < 768) setScreenSize('mobile')
        else if (width < 1024) setScreenSize('tablet')
        else setScreenSize('desktop')
      }
    }

    updateScreenSize()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateScreenSize)
      return () => window.removeEventListener('resize', updateScreenSize)
    }
  }, [])

  // Prevent hydration mismatch by returning safe defaults during SSR
  if (!isMounted) {
    return { screenSize: 'desktop' as const, isMobile: false, isTablet: false, isMounted: false }
  }

  return { screenSize, isMobile: screenSize === 'mobile', isTablet: screenSize === 'tablet', isMounted }
}

// Mobile-Optimized Tabs Component
interface MobileTabsProps {
  items: Array<{
    key: string
    label: string
    children: React.ReactNode
    icon?: React.ReactNode
  }>
  defaultActiveKey?: string
  className?: string
  type?: 'card' | 'line' | 'editable-card'
}

export function MobileTabs({ items, defaultActiveKey, className, type = 'card' }: MobileTabsProps) {
  const { isMobile, isMounted } = useResponsive()
  const [activeTab, setActiveTab] = useState(defaultActiveKey || items[0]?.key)

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isMounted) return
      const currentIndex = items.findIndex(item => item.key === activeTab)
      const nextIndex = (currentIndex + 1) % items.length
      setActiveTab(items[nextIndex].key)
    },
    onSwipedRight: () => {
      if (!isMounted) return
      const currentIndex = items.findIndex(item => item.key === activeTab)
      const prevIndex = (currentIndex - 1 + items.length) % items.length
      setActiveTab(items[prevIndex].key)
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  })

  // Show desktop version during SSR and when not mounted to prevent hydration mismatch
  if (!isMounted || !isMobile) {
    // Desktop version uses Ant Design tabs
    return (
      <AntTabs
        type={type}
        activeKey={activeTab}
        onChange={setActiveTab}
        className={className}
        items={items.map(item => ({
          key: item.key,
          label: (
            <span className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
          ),
          children: item.children
        }))}
      />
    )
  }

  // Mobile version with swipe support
  if (isMobile && isMounted) {
    return (
      <div className={cn("w-full", className)} {...swipeHandlers}>
        {/* Mobile Tab Navigation */}
        <div className="flex overflow-x-auto scrollbar-hide mb-4 bg-black/20 backdrop-blur-md rounded-xl p-1">
          {items.map((item) => (
            <motion.button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-w-max",
                activeTab === item.key
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {item.icon}
              {item.label}
            </motion.button>
          ))}
        </div>

        {/* Swipe Indicator */}
        <div className="flex justify-center mb-4">
          <div className="flex gap-1">
            {items.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  items.findIndex(item => item.key === activeTab) === index
                    ? "bg-purple-500"
                    : "bg-gray-600"
                )}
              />
            ))}
          </div>
        </div>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {items.find(item => item.key === activeTab)?.children}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // Fallback
  return null
}

// Mobile-Optimized Button Component
interface MobileButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  className?: string
  fullWidth?: boolean
  icon?: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
}

export function MobileButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled, 
  loading, 
  className,
  fullWidth,
  icon,
  type = 'button'
}: MobileButtonProps) {
  const { isMobile } = useResponsive()

  const baseClasses = "relative overflow-hidden font-medium transition-all duration-200 flex items-center justify-center gap-2"
  
  const variantClasses = {
    primary: "bg-gradient-to-b from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-950 shadow-lg hover:shadow-xl",
    secondary: "bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl",
    outline: "border-2 border-gray-400 text-gray-300 hover:bg-gray-800 hover:text-white",
    ghost: "text-gray-400 hover:text-white hover:bg-white/10"
  }

  const sizeClasses = {
    sm: isMobile ? "px-4 py-2 text-sm rounded-lg" : "px-3 py-1.5 text-sm rounded-md",
    md: isMobile ? "px-6 py-3 text-base rounded-xl" : "px-4 py-2 text-sm rounded-lg",
    lg: isMobile ? "px-8 py-4 text-lg rounded-xl" : "px-6 py-3 text-base rounded-lg",
    xl: isMobile ? "px-10 py-5 text-xl rounded-2xl" : "px-8 py-4 text-lg rounded-xl"
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        />
      )}
      {icon && !loading && icon}
      {children}
    </motion.button>
  )
}

// Mobile-Optimized Card Component
interface MobileCardProps {
  children: React.ReactNode
  title?: string
  className?: string
  hover?: boolean
  gradient?: boolean
}

export function MobileCard({ children, title, className, hover = true, gradient = false }: MobileCardProps) {
  const { isMobile } = useResponsive()

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      className={cn(
        "rounded-xl border backdrop-blur-md transition-all duration-200",
        gradient 
          ? "bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20" 
          : "bg-black/40 border-white/10",
        hover && "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10",
        isMobile ? "p-4" : "p-6",
        className
      )}
    >
      {title && (
        <h3 className={cn(
          "font-montserrat font-semibold text-white mb-4",
          isMobile ? "text-lg" : "text-xl"
        )}>
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  )
}

// Responsive Grid Container
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: { mobile: number; tablet: number; desktop: number }
  gap?: number
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 }, 
  gap = 4,
  className 
}: ResponsiveGridProps) {
  const { screenSize } = useResponsive()
  
  const gridCols = {
    mobile: `grid-cols-${cols.mobile}`,
    tablet: `grid-cols-${cols.tablet}`,
    desktop: `grid-cols-${cols.desktop}`
  }

  return (
    <div className={cn(
      "grid",
      gridCols[screenSize],
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}

// Touch-Friendly Navigation
interface TouchNavProps {
  items: Array<{
    label: string
    onClick: () => void
    icon?: React.ReactNode
    active?: boolean
  }>
  className?: string
}

export function TouchNav({ items, className }: TouchNavProps) {
  const { isMobile } = useResponsive()

  if (!isMobile) return null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 z-50",
      className
    )}>
      <div className="flex">
        {items.map((item, index) => (
          <motion.button
            key={index}
            onClick={item.onClick}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex-1 py-3 px-2 flex flex-col items-center gap-1 text-xs font-medium transition-colors",
              item.active 
                ? "text-purple-400 bg-purple-500/10" 
                : "text-gray-400 hover:text-white"
            )}
          >
            {item.icon}
            {item.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// Screen Size Indicator (for development)
export function ScreenSizeIndicator() {
  const { screenSize, isMounted } = useResponsive()

  if (!isMounted || process.env.NODE_ENV === 'production') return null

  const icons = {
    mobile: <Smartphone className="w-4 h-4" />,
    tablet: <Tablet className="w-4 h-4" />,
    desktop: <Monitor className="w-4 h-4" />
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 z-50">
      <div className="flex items-center gap-2 text-white text-sm">
        {icons[screenSize]}
        {screenSize}
      </div>
    </div>
  )
}
