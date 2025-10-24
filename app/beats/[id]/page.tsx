"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CustomLoader from "@/components/ui/custom-loader";
import {
  Play,
  Pause,
  Download,
  Heart,
  Clock,
  Music,
  Headphones,
  Volume2,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Calendar,
  Tag,
  TrendingUp,
  User,
  Award,
  ArrowLeft,
  Shield,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, useElements, useStripe, Elements } from "@stripe/react-stripe-js";
import { useRouter, useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface Beat {
  id: string;
  title: string;
  description?: string;
  genre: string;
  bpm: number;
  key?: string;
  mood?: string;
  tags?: string[];
  audio_url: string;
  waveform_url?: string;
  duration?: number;
  price: number;
  license_type: string;
  approval_status: string;
  admin_notes?: string;
  is_featured: boolean;
  play_count: number;
  purchase_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

interface Producer {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface PaymentModalProps {
  beat: Beat;
  producer: Producer | null;
  onClose: () => void;
  onSuccess: (beatId: string) => void;
}

// Payment Modal Component
function PaymentModalContent({ beat, producer, onClose, onSuccess }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateInputs = () => {
    if (!email || !name) {
      setError("Email and name are required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setError("Payment system not ready. Please refresh.");
      return;
    }

    if (!validateInputs()) return;

    setLoading(true);
    setError(null);

    try {
      const authUser = user;

      if (!authUser) {
        setError("You must be logged in to purchase");
        setLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Card input not found");
        setLoading(false);
        return;
      }

      const { token, error: tokenError } = await stripe.createToken(cardElement);
      if (tokenError) throw new Error(tokenError.message);

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
          paymentMethodData: { token: token.id },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment failed. Please try again.");
      }

      const { error: dbError } = await supabase.from("beat_purchases").insert({
        beat_id: beat.id,
        user_id: authUser.id,
        license_type: beat.license_type,
        price: beat.price,
        payment_method: "stripe_card",
        payment_status: "completed",
        transaction_id: data.paymentIntentId,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw new Error(dbError.message);

      setSuccess(true);
      setTimeout(() => {
        onSuccess(beat.id);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#ffffff",
        "::placeholder": { color: "#6b7280" },
      },
      invalid: { color: "#fa755a", iconColor: "#fa755a" },
    },
  };

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
            <p className="text-2xl font-bold text-purple-400 mt-3">
              ${beat.price.toFixed(2)}
            </p>
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
                <Button onClick={onClose} disabled={loading} variant="outline" className="flex-1 cursor-pointer ">
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
  );
}

// Payment Modal Wrapper with Stripe Elements
function PaymentModal({ beat, producer, onClose, onSuccess }: PaymentModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentModalContent beat={beat} producer={producer} onClose={onClose} onSuccess={onSuccess} />
    </Elements>
  );
}

// Main Beat Detail Component
export default function BeatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const beatId = params?.id as string;
  const { user, loading: authLoading } = useAuth();

  const [beat, setBeat] = useState<Beat | null>(null);
  const [producer, setProducer] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.addEventListener("ended", () => {
      setIsPlaying(false);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Load beat data
  useEffect(() => {
    const loadBeat = async () => {
      if (!beatId) return;

      try {
        setLoading(true);

        // Load beat data
        const { data: beatData, error: beatError } = await supabase
          .from("beats")
          .select("*")
          .eq("id", beatId)
          .single();

        if (beatError) throw beatError;
        setBeat(beatData);

        // Load producer info (attempt to get from auth, fallback to basic info)
        try {
          const { data: { user: producerData }, error: producerError } = 
            await supabase.auth.admin.getUserById(beatData.user_id);

          if (!producerError && producerData) {
            setProducer(producerData as any);
          }
        } catch (err) {
          // If admin API not available, use fallback
          setProducer({
            id: beatData.user_id,
            email: "Unknown",
            user_metadata: {
              display_name: "Producer",
            },
          });
        }

        // Check if purchased
        if (user) {
          const { data: purchaseData } = await supabase
            .from("beat_purchases")
            .select("id")
            .eq("beat_id", beatId)
            .eq("user_id", user.id)
            .eq("payment_status", "completed")
            .maybeSingle();

          if (purchaseData) {
            setIsPurchased(true);
          }
        }
      } catch (err) {
        console.error("Error loading beat:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBeat();
  }, [beatId, user]);

  const handlePlayPause = () => {
    if (!audioRef.current || !beat) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.src !== beat.audio_url) {
        audioRef.current.src = beat.audio_url;
        audioRef.current.load();
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Error playing audio:", err));
    }
  };

  const handleDownload = async () => {
    if (!beat) return;

    try {
      const response = await fetch(beat.audio_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${beat.title}.wav`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading beat:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <CustomLoader size="lg" showText text="Loading beat details..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Please log in to view beat details</p>
      </div>
    );
  }

  if (!beat) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Beat not found</p>
              <Button onClick={() => router.push("/beats")} className="mt-4 cursor-pointer " variant="outline">
                Back to Marketplace
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
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
                  { label: "Home", href: "/" },
                  { label: "Beat Marketplace", href: "/beats" },
                  { label: beat.title, href: `/beats/${beat.id}` },
                ]}
              />
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {/* Back Button */}
            <Button variant="outline" onClick={() => router.push("/beats")} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2 cursor-pointer " />
              Back to Marketplace
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Beat Cover & Player */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="relative mb-6">
                      <div className="w-full h-96 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                        {beat.waveform_url ? (
                          <Image
                            src={beat.waveform_url}
                            alt={beat.title}
                            className="w-full h-full object-cover"
                            width={800}
                            height={384}
                          />
                        ) : (
                          <Music className="w-24 h-24 text-white" />
                        )}
                        {beat.is_featured && (
                          <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold">
                            FEATURED
                          </div>
                        )}
                        {isPlaying && (
                          <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            NOW PLAYING
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Player Controls */}
                    <div className="flex items-center gap-4 mb-6">
                      <button
                        onClick={handlePlayPause}
                        className="w-16 h-16 cursor-pointer flex items-center justify-center bg-purple-600 hover:bg-purple-700 rounded-full transition-colors "
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-1">{beat.title}</h1>
                        <p className="text-gray-400">
                          by {producer?.user_metadata?.display_name || "Unknown Producer"}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {beat.description && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">Description</h3>
                        <p className="text-gray-300">{beat.description}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {beat.tags && beat.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                          <Tag className="w-5 h-5" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {beat.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Beat Details */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Beat Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Genre</p>
                        <p className="text-white font-semibold">{beat.genre}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">BPM</p>
                        <p className="text-white font-semibold flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {beat.bpm}
                        </p>
                      </div>
                      {beat.key && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Key</p>
                          <p className="text-white font-semibold">{beat.key}</p>
                        </div>
                      )}
                      {beat.mood && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Mood</p>
                          <p className="text-white font-semibold">{beat.mood}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Duration</p>
                        <p className="text-white font-semibold">{formatDuration(beat.duration)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">License</p>
                        <p className="text-white font-semibold">{beat.license_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                          <Headphones className="w-4 h-4" />
                          Plays
                        </p>
                        <p className="text-white font-semibold">{beat.play_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Purchases
                        </p>
                        <p className="text-white font-semibold">
                          {beat.purchase_count.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Uploaded
                        </p>
                        <p className="text-white font-semibold text-xs">
                          {formatDate(beat.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Producer Info */}
                {producer && (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Producer
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                          {producer.user_metadata?.avatar_url ? (
                            <Image
                              src={producer.user_metadata.avatar_url}
                              alt={producer.user_metadata?.display_name || "Producer"}
                              className="w-full h-full object-cover rounded-full"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <User className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg">
                            {producer.user_metadata?.display_name || "Unknown Producer"}
                          </p>
                          <p className="text-gray-400 text-sm">{producer.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar - Purchase Section */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-900 border-gray-800 sticky top-4">
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center py-4 border-b border-gray-800">
                      <p className="text-gray-400 text-sm mb-2">Price</p>
                      <p className="text-4xl font-bold text-white">${beat.price.toFixed(2)}</p>
                      <p className="text-gray-400 text-sm mt-2">{beat.license_type}</p>
                    </div>

                    {isPurchased ? (
                      <>
                        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 text-center">
                          <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-green-400 font-semibold">You own this beat!</p>
                        </div>
                        <Button
                          onClick={handleDownload}
                          className="w-full bg-green-600 hover:bg-green-700 cursor-pointer "
                          size="lg"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download Beat
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => setShowPaymentModal(true)}
                          className="w-full bg-purple-600 hover:bg-purple-700 cursor-pointer "
                          size="lg"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Purchase Beat
                        </Button>
                        <Button variant="outline" className="w-full border-gray-700 cursor-pointer " size="lg">
                          <Heart className="w-5 h-5 mr-2" />
                          Add to Favorites
                        </Button>
                      </>
                    )}

                    <div className="pt-4 border-t border-gray-800 space-y-3 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Instant download</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>High-quality WAV file</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Commercial license included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span>Secure payment</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500 text-center">
                        By purchasing, you agree to the license terms
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showPaymentModal && beat && (
        <PaymentModal
          beat={beat}
          producer={producer}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(beatId) => {
            setIsPurchased(true);
            setShowPaymentModal(false);
          }}
        />
      )}
    </div>
  );
}