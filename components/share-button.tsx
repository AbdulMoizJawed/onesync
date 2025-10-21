"use client"

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  title: string
  artistName: string
}

export function ShareButton({ title, artistName }: ShareButtonProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out "${title}" by ${artistName}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <Button
      variant="outline"
      className="border-gray-600 text-gray-300 hover:bg-gray-800"
      onClick={handleShare}
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share This Release
    </Button>
  )
}
