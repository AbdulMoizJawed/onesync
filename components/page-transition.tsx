"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useHapticFeedback } from '@/lib/haptics'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const { impact } = useHapticFeedback()

  useEffect(() => {
    // Trigger page change haptic
    impact()
    
    setIsLoading(true)
    
    // Short delay to show transition effect
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsLoading(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div className="min-h-screen">
      <div
        className={`transition-all duration-300 ease-out ${
          isLoading 
            ? 'opacity-0 translate-x-4 scale-98' 
            : 'opacity-100 translate-x-0 scale-100 animate-dissolve-in'
        }`}
      >
        {displayChildren}
      </div>
      
      {/* Page transition overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-sm z-40 animate-dissolve-in" />
      )}
    </div>
  )
}

/**
 * Loading state component with dissolving animation
 */
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-sm flex items-center justify-center z-50 animate-dissolve-in">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-600 border-t-white animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-500 animate-spin animate-ping" />
        </div>
        <p className="text-white/80 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Smooth reveal animation for content sections
 */
interface RevealProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
  className?: string
}

export function Reveal({ children, delay = 0, direction = 'up', className = '' }: RevealProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getAnimationClass = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'opacity-0 translate-y-8'
        case 'down': return 'opacity-0 -translate-y-8'
        case 'left': return 'opacity-0 translate-x-8'
        case 'right': return 'opacity-0 -translate-x-8'
        case 'scale': return 'opacity-0 scale-90'
        default: return 'opacity-0 translate-y-8'
      }
    }
    return 'opacity-100 translate-x-0 translate-y-0 scale-100'
  }

  return (
    <div
      className={`transition-all duration-500 ease-out ${getAnimationClass()} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Staggered reveal for lists
 */
interface StaggeredRevealProps {
  children: React.ReactNode[]
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
  className?: string
}

export function StaggeredReveal({ 
  children, 
  staggerDelay = 100, 
  direction = 'up', 
  className = '' 
}: StaggeredRevealProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <Reveal 
          key={index} 
          delay={index * staggerDelay} 
          direction={direction}
        >
          {child}
        </Reveal>
      ))}
    </div>
  )
}

/**
 * Fade transition for conditional content
 */
interface FadeTransitionProps {
  show: boolean
  children: React.ReactNode
  className?: string
}

export function FadeTransition({ show, children, className = '' }: FadeTransitionProps) {
  return (
    <div
      className={`transition-all duration-300 ease-out ${
        show 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-2'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Modal/Dialog transition wrapper
 */
interface ModalTransitionProps {
  isOpen: boolean
  children: React.ReactNode
  onClose?: () => void
}

export function ModalTransition({ isOpen, children, onClose }: ModalTransitionProps) {
  const { impact } = useHapticFeedback()
  
  useEffect(() => {
    if (isOpen) {
      impact()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-dissolve-in"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="animate-slide-in-up animate-dissolve-in">
          {children}
        </div>
      </div>
    </>
  )
}
