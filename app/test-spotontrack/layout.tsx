import { Metadata } from "next"
import { Breadcrumb } from "@/components/breadcrumb"

export const metadata: Metadata = {
  title: "SpotOnTrack API Test | Music Distribution App",
  description: "Test and explore the SpotOnTrack API integration for music analytics across multiple platforms including Spotify, Apple Music, Deezer, and Shazam.",
}

export default function SpotOnTrackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Music Intelligence", href: "/music-intelligence" },
              { label: "SpotOnTrack API", current: true },
            ]}
            className="mb-6"
          />
          {children}
        </div>
      </div>
    </div>
  )
}
