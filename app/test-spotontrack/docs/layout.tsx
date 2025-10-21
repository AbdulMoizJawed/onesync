import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SpotOnTrack API Documentation',
  description: 'Documentation for the SpotOnTrack API integration for music analytics',
}

export default function SpotOnTrackDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="container mx-auto px-4 py-8">
      {children}
    </section>
  )
}
