'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Breadcrumb } from '@/components/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CustomLoader from '@/components/ui/custom-loader'
import {
  Search,
  Filter,
  Play,
  Pause,
  Download,
  Heart,
  Clock,
  Music,
  Headphones,
  Zap,
  Award,
  Volume2,
  Star,
  ShoppingCart,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface Beat {
  id: string
  title: string
  description?: string
  genre: string
  bpm: number
  key?: string
  mood?: string
  tags?: string[]
  audio_url: string
  waveform_url?: string
  price: number
  license_type: string
  approval_status: string
  is_featured: boolean
  play_count: number
  purchase_count: number
  user_id: string
  created_at: string
  updated_at: string
}

interface Producer {
  id: string
  email?: string
  user_metadata?: {
    display_name?: string
    avatar_url?: string
  }
}

interface PaymentModalProps {
  beat: {
    id: string
    title: string
    price: number
    license_type: string
    user_id: string
  }
  producer: any
  onClose: () => void
  onSuccess: (beatId: string) => void
}

// Payment Modal
function PaymentModal({ beat, producer, onClose, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
   const { user, loading: authLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validateInputs = () => {
    if (!email || !name) {
      setError("Email and name are required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email")
      return false
    }
    return true
  }

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setError("Payment system not ready. Please refresh.")
      return
    }

    if (!validateInputs()) return

    setLoading(true)
    setError(null)

    try {
      // const { data: { user: authUser } } = await supabase.auth.getUser()
      const authUser = user
      
      if (!authUser) {
        setError("You must be logged in to purchase")
        setLoading(false)
        return
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        setError("Card input not found")
        setLoading(false)
        return
      }

      // ✅ Extract raw card data to send to backend
      const card = cardElement as any
      const cardData = {
        number: card._complete ? undefined : undefined, // Stripe prevents raw card details
      }

      // ❗ NOTE:
      // Instead of sending raw card number, Stripe recommends using Payment Element.
      // But for demonstration, we'll use `payment_method_data` proxy via stripe.js

      const { token, error: tokenError } = await stripe.createToken(cardElement)
      if (tokenError) throw new Error(tokenError.message)

      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(beat.price * 100),
          currency: "usd",
          email,
          name,
          beatId: beat.id,
          beatTitle: beat.title,
          paymentMethodData: { token: token.id }, // ✅ Pass token to backend
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment failed. Please try again.")
      }

      // ✅ Save purchase in Supabase
      const { error: dbError } = await supabase.from("beat_purchases").insert({
        beat_id: beat.id,
        user_id: authUser.id,
        license_type: beat.license_type,
        price: beat.price,
        payment_method: "stripe_card",
        payment_status: "completed",
        transaction_id: data.paymentIntentId,
        created_at: new Date().toISOString(),
      })

      if (dbError) throw new Error(dbError.message)

      setSuccess(true)
      setTimeout(() => {
        onSuccess(beat.id)
        onClose()
      }, 2000)
    } catch (err: any) {
      console.error("Payment error:", err)
      setError(err.message || "Payment failed.")
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#ffffff",
        "::placeholder": { color: "#6b7280" },
      },
      invalid: { color: "#fa755a", iconColor: "#fa755a" },
    },
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-white">Purchase Beat</h2>
          <p className="text-gray-400 text-sm">Secure payment via Stripe</p>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-300 text-sm">Beat Title</p>
            <p className="text-white font-bold">{beat.title}</p>
            <p className="text-gray-400 text-sm mt-1">License: {beat.license_type}</p>
            <p className="text-2xl font-bold text-purple-400 mt-3">${beat.price.toFixed(2)}</p>
          </div>

          {success ? (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 text-green-400">
              ✅ Payment Successful! Your beat is ready to download.
            </div>
          ) : (
            <>
              <div>
                <label className="text-gray-300 text-sm block mb-2">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm block mb-2">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={loading}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm block mb-2">Card Details</label>
                <div className="bg-gray-800 border border-gray-700 rounded p-3">
                  <CardElement options={cardElementOptions} />
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Test card: 4242 4242 4242 4242 | Future date | Any CVC
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={onClose} disabled={loading} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={loading || !stripe || !elements}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Pay ${beat.price.toFixed(2)}
                    </div>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Beat Card Component
function BeatCard({
  beat,
  isPurchased,
  onPurchaseClick,
  onDownload
}: {
  beat: Beat
  isPurchased: boolean
  onPurchaseClick: (beat: Beat) => void
  onDownload: (beat: Beat) => void
}) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-all hover:scale-105 group">
      <CardContent className="p-6">
        {/* Beat Cover */}
        <div className="relative mb-4">
          <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer group/play"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {beat.waveform_url ? (
              <Image
                src={beat.waveform_url}
                alt={beat.title}
                className="w-full h-full object-cover"
                width={300}
                height={192}
              />
            ) : (
              <Music className="w-12 h-12 text-white" />
            )}
            <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-opacity">
              {isPlaying ? (
                <Pause className="w-12 h-12 text-white" />
              ) : (
                <Play className="w-12 h-12 text-white" />
              )}
            </button>
            {beat.is_featured && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                FEATURED
              </div>
            )}
          </div>
        </div>

        {/* Beat Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-white text-lg">{beat.title}</h3>
            {beat.description && (
              <p className="text-gray-400 text-sm line-clamp-2">{beat.description}</p>
            )}
          </div>

          {/* Tags */}
          {beat.tags && beat.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {beat.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
          </div>

          {/* Beat Details */}
          <div className="flex justify-between text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              BPM: {beat.bpm}
            </span>
            {beat.key && <span>{beat.key}</span>}
            <span className="flex items-center gap-1">
              <Headphones className="w-3 h-3" />
              {beat.play_count}
            </span>
          </div>

          {/* License Type */}
          <div className="text-sm text-gray-400">
            <span className="inline-block px-2 py-1 bg-gray-800 rounded">
              {beat.license_type}
            </span>
          </div>

          {/* Price & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <span className="text-2xl font-bold text-white">
              ${beat.price.toFixed(2)}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-700 text-gray-300 hover:text-white"
              >
                <Heart className="w-4 h-4" />
              </Button>
              {isPurchased ? (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onDownload(beat)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => onPurchaseClick(beat)}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
  )
}

// Main Component
export default function BeatMarketplace() {
  const { user, loading: authLoading } = useAuth()
  const [beats, setBeats] = useState<Beat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [genres, setGenres] = useState<string[]>(['All'])
  const [searchTerm, setSearchTerm] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState<Beat | null>(null)
  const [purchasedBeats, setPurchasedBeats] = useState<Set<string>>(new Set())
  const [producersMap, setProducersMap] = useState<Record<string, Producer>>({})

  // Load beats from Supabase
  useEffect(() => {
    const loadBeats = async () => {
      try {
        setLoading(true)

        let query = supabase
          .from('beats')
          .select('*')
          .eq('approval_status', 'approved')

        if (selectedGenre !== 'All') {
          query = query.eq('genre', selectedGenre)
        }

        const { data, error } = await query.limit(20)

        if (error) throw error
        setBeats(data || [])
      } catch (err) {
        console.error('Error loading beats:', err)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(loadBeats, 300)
    return () => clearTimeout(debounceTimer)
  }, [selectedGenre])

  // Load genres
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const { data, error } = await supabase
          .from('beats')
          .select('genre')
          .eq('approval_status', 'approved')
          .not('genre', 'is', null)

        if (error) throw error

        const uniqueGenres = ['All', ...new Set(data?.map(b => b.genre) || [])]
        setGenres(uniqueGenres as string[])
      } catch (err) {
        console.error('Error loading genres:', err)
      }
    }

    loadGenres()
  }, [])

  // Check purchased beats
  useEffect(() => {
    const checkPurchases = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        const { data, error } = await supabase
          .from('beat_purchases')
          .select('beat_id')
          .eq('user_id', authUser.id)
          .eq('payment_status', 'completed')

        if (!error && data) {
          setPurchasedBeats(new Set(data.map(p => p.beat_id)))
        }
      } catch (err) {
        console.error('Error checking purchases:', err)
      }
    }

    if (user) {
      checkPurchases()
    }
  }, [user])

  // Search beats
  useEffect(() => {
    const searchBeats = async () => {
      if (!searchTerm.trim()) {
        return
      }

      try {
        let query = supabase
          .from('beats')
          .select('*')
          .eq('approval_status', 'approved')

        if (selectedGenre !== 'All') {
          query = query.eq('genre', selectedGenre)
        }

        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

        const { data, error } = await query.limit(20)

        if (error) throw error
        setBeats(data || [])
      } catch (err) {
        console.error('Error searching beats:', err)
      }
    }

    const debounceTimer = setTimeout(searchBeats, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedGenre])

  const handleDownload = async (beat: Beat) => {
    try {
      const response = await fetch(beat.audio_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${beat.title}.wav`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading beat:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <CustomLoader size="lg" showText text="Loading beats..." />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Please log in to access the beat marketplace</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <div className="border-b border-gray-800">
            <div className="container mx-auto px-4 py-3">
              <Breadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Beat Marketplace', href: '/beats' }
                ]}
              />
            </div>
          </div>

          {/* Hero */}
          <div className="bg-gray-900 py-12">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl font-bold text-white mb-4">Premium Beats</h1>
              <p className="text-gray-400 mb-6">Discover and purchase high-quality beats</p>

              <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search beats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedGenre === genre
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {beats.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No beats found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {beats.map(beat => (
                  <BeatCard
                    key={beat.id}
                    beat={beat}
                    isPurchased={purchasedBeats.has(beat.id)}
                    onPurchaseClick={setShowPaymentModal}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showPaymentModal && (
        <PaymentModal
          beat={showPaymentModal}
          producer={producersMap[showPaymentModal.user_id] || {}}
          onClose={() => setShowPaymentModal(null)}
          onSuccess={(beatId) => {
            setPurchasedBeats(new Set([...purchasedBeats, beatId]))
            setShowPaymentModal(null)
          }}
        />
      )}
    </div>
  )
}