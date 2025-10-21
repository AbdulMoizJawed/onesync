"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Music, User } from "lucide-react"

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: "music" | "user" | "custom"
  fallbackContent?: React.ReactNode
  priority?: boolean
  quality?: number
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  sizes?: string
}

export function OptimizedImage({
  src,
  alt,
  width = 300,
  height = 300,
  className,
  fallback = "music",
  fallbackContent,
  priority = false,
  quality = 85,
  placeholder = "empty",
  blurDataURL,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageError = () => {
    console.warn('Image failed to load:', src)
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-700 relative overflow-hidden",
        className
      )}>
        {fallbackContent || (
          fallback === "music" ? (
            <Music className="w-8 h-8 text-gray-500" />
          ) : fallback === "user" ? (
            <User className="w-8 h-8 text-gray-500" />
          ) : (
            <div className="w-8 h-8 bg-gray-600 rounded" />
          )
        )}
      </div>
    )
  }

  // For blob URLs or data URLs, use regular img tag since Next.js Image doesn't support them
  const isBlobOrDataURL = src && (src.startsWith('blob:') || src.startsWith('data:'))

  if (isBlobOrDataURL) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- blob/data URLs are not supported by next/image */}
        <img
          src={src as string}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "object-cover transition-opacity duration-300",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ width, height }}
        />
        
        {/* Loading spinner */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes}
        unoptimized={true}
        className={cn(
          "object-cover transition-opacity duration-300",
          imageLoading ? "opacity-0" : "opacity-100"
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        onLoadStart={() => setImageLoading(true)}
      />
      
      {/* Loading spinner */}
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// Specific optimized components for common use cases
export function ReleaseImage({ 
  src, 
  alt, 
  className,
  size = "md"
}: { 
  src: string | null | undefined
  alt: string
  className?: string 
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const sizeMap = {
    sm: { width: 64, height: 64 },
    md: { width: 128, height: 128 },
    lg: { width: 256, height: 256 },
    xl: { width: 400, height: 400 }
  }
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      {...sizeMap[size]}
      className={className}
      fallback="music"
      quality={90}
      sizes={
        size === "sm" ? "64px" :
        size === "md" ? "128px" :
        size === "lg" ? "256px" : 
        "400px"
      }
    />
  )
}

export function ArtistImage({ 
  src, 
  alt, 
  className,
  size = "md"
}: { 
  src: string | null | undefined
  alt: string
  className?: string 
  size?: "sm" | "md" | "lg"
}) {
  const sizeMap = {
    sm: { width: 48, height: 48 },
    md: { width: 96, height: 96 },
    lg: { width: 160, height: 160 }
  }
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      {...sizeMap[size]}
      className={cn("rounded-full", className)}
      fallback="user"
      quality={85}
      sizes={
        size === "sm" ? "48px" :
        size === "md" ? "96px" :
        "160px"
      }
    />
  )
}
