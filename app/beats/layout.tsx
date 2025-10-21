import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Beat Marketplace - Music Distribution Platform',
  description: 'Discover and purchase high-quality beats from top producers',
}

export default function BeatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
