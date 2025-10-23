"use client";
// @ts-nocheck

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/auth";
import { isAdminUser } from "@/utils/admin";
import {
  Users,
  Music,
  Database,
  ExternalLink,
  BarChart3,
  Lock,
  AlertCircle,
  Bell,
  Send,
  Activity,
  DollarSign,
  MessageSquare,
  Zap,
  TrendingUp,
  Eye,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Settings,
  Shield,
  FileText,
  Upload,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Ban,
  Edit,
  Trash2,
  Plus,
  Target,
  Flag,
  Sparkles,
  Calendar,
  User,
  Mail,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminBeatUpload from "@/components/beats/AdminBeatUpload";
import AdminBeatManagement from "@/components/beats/AdminBeatManagement";
import ImprovedAdminNav from "@/components/ImprovedAdminNav";

interface AdminStats {
  totalUsers: number;
  totalReleases: number;
  pendingReleases: number;
  payoutRequests: number;
  supportTickets: number;
  publishingRequests: number;
  playlistCampaigns: number;
  beatsPendingApproval: number;
  activeMasteringJobs: number;
  forumFlags: number;
  aiServiceCost: number;
  platformRevenue: number;
  timestamp: string;
}

interface NotificationForm {
  user_id: string;
  title: string;
  message: string;
  type: "release" | "payout" | "system" | "promotion" | "warning";
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  role?: string;
  status?: string;
  last_sign_in_at?: string;
  release_count?: number;
  total_revenue?: number;
  [key: string]: any; // Allow any additional properties
}

interface Release {
  id: string;
  title: string;
  artist: string;
  status: string;
  created_at: string;
  user_id: string;
  cover_art?: string;
  artwork_url?: string;
  audio_file?: string;
  audio_url?: string;
  admin_notes?: string;
  [key: string]: any; // Allow any additional properties
}

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  method_type?: string;
  user_email?: string;
  admin_notes?: string;
  [key: string]: any; // Allow any additional properties
}

interface PublishingRequest {
  id: string;
  user_id: string;
  user_email: string;
  request_type: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  };
}

interface PlaylistCampaign {
  id: string;
  user_id: string;
  release_id: string;
  plan_type: "indie" | "pro" | "superstar";
  plan_price: number;
  status: string;
  campaign_data: any;
  campaign_results: any;
  playlist_placements: any[];
  streams_gained: number;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  profiles: { full_name: string; email: string };
  releases: { title: string; artist_name: string; cover_art_url?: string };
}

interface Beat {
  id: string;
  user_id: string;
  title: string;
  genre: string;
  bpm: number;
  price: any;
  approval_status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  created_at: string;
  profiles: { full_name: string; email: string };
}

interface MasteringJob {
  id: string;
  user_id: string;
  title: string;
  status: string;
  admin_review_status: string;
  admin_notes?: string;
  api_cost?: number;
  created_at: string;
  profiles: { full_name: string; email: string };
}

interface ForumFlag {
  id: string;
  content_type: "post" | "comment";
  content_id: string;
  flag_reason: string;
  description?: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  admin_notes?: string;
  created_at: string;
  reporter: { full_name: string; email: string };
  content?: any;
}

interface TakedownRequest {
  id: string;
  title: string;
  artist: string;
  complainant: string;
  status: string;
  created_at: string;
  reason: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Early return if no Supabase client
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="text-gray-400">Supabase client not available</p>
        </div>
      </div>
    );
  }

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [takedownRequests, setTakedownRequests] = useState<TakedownRequest[]>(
    []
  );
  const [releaseEdits, setReleaseEdits] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [publishingRequests, setPublishingRequests] = useState<
    PublishingRequest[]
  >([]);
  const [playlistCampaigns, setPlaylistCampaigns] = useState<
    PlaylistCampaign[]
  >([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [masteringJobs, setMasteringJobs] = useState<MasteringJob[]>([]);
  const [forumFlags, setForumFlags] = useState<ForumFlag[]>([]);
  const [aiStats, setAiStats] = useState<any>(null);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notificationForm, setNotificationForm] = useState<NotificationForm>({
    user_id: "",
    title: "",
    message: "",
    type: "system",
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    open: boolean;
    releaseId: string;
    releaseTitle: string;
  }>({ open: false, releaseId: "", releaseTitle: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [editRejectionModal, setEditRejectionModal] = useState<{
    open: boolean;
    editId: string;
    releaseTitle: string;
  }>({ open: false, editId: "", releaseTitle: "" });
  const [editRejectionReason, setEditRejectionReason] = useState("");

  // Admin authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login?redirect=/admin");
        return;
      }

      if (!isAdminUser(user)) {
        router.push("/");
        return;
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && isAdminUser(user)) {
      fetchAllData();
    }
  }, [user]);

  // Audio playback handler
  const handlePlayPause = async (
    releaseId: string,
    audioUrl: string | null
  ) => {
    if (!audioUrl) {
      toast.error("No audio file available for this release");
      return;
    }

    if (currentlyPlaying === releaseId) {
      if (audioRef) {
        audioRef.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      if (audioRef) {
        audioRef.pause();
        audioRef.src = "";
      }

      setAudioLoading(releaseId);

      try {
        const audio = new Audio();
        audio.oncanplay = () => {
          setAudioLoading(null);
        };

        audio.onplay = () => {
          setCurrentlyPlaying(releaseId);
        };

        audio.onpause = () => {
          setCurrentlyPlaying(null);
        };

        audio.onended = () => {
          setCurrentlyPlaying(null);
          setAudioRef(null);
        };

        audio.onerror = (e) => {
          console.error("Audio error:", e);
          setCurrentlyPlaying(null);
          setAudioRef(null);
          setAudioLoading(null);
          toast.error(
            "Playback failed - audio file may be corrupted or unavailable"
          );
        };

        audio.src = audioUrl;
        audio.load();
        setAudioRef(audio);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setCurrentlyPlaying(releaseId);
            })
            .catch((error) => {
              console.error("Error starting playback:", error);
              setCurrentlyPlaying(null);
              setAudioLoading(null);

              if (error.name === "NotAllowedError") {
                toast.error(
                  "Playback blocked - please interact with the page first"
                );
              } else if (error.name === "NotSupportedError") {
                toast.error("Audio format not supported by your browser");
              } else {
                toast.error(
                  "Playback failed - " + (error.message || "unknown error")
                );
              }
            });
        }
      } catch (error) {
        console.error("Error creating audio element:", error);
        setAudioLoading(null);
      }
    }
  };

  // User management handlers
  const handleUserAction = async (
    userId: string,
    action: "suspend" | "activate"
  ) => {
    try {
      if (action === "suspend") {
        // Create a suspension record
        const reason = prompt("Reason for suspension:");
        if (!reason) {
          toast.error("Suspension reason is required");
          return;
        }

        const suspensionType = confirm(
          "Permanent suspension? (Cancel for temporary 30-day suspension)"
        )
          ? "permanent"
          : "temporary";

        const expiresAt =
          suspensionType === "temporary"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const response = await fetch("/api/admin/forum-moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            reason,
            suspension_type: suspensionType,
            expires_at: expiresAt,
            admin_notes: `Suspended via admin dashboard`,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to suspend user");
        }

        // Send notification to user
        if (!supabase) return;

        const { data: user } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .single();

        await sendUserNotification(
          userId,
          "Account Suspended",
          `Your account has been ${suspensionType === "permanent" ? "permanently" : "temporarily"
          } suspended. Reason: ${reason}${suspensionType === "temporary" ? " (30 days)" : ""
          }`,
          "warning"
        );

        toast.success("User suspended successfully");
      } else {
        // Deactivate all suspensions for this user
        if (!supabase) return;

        const { error } = await supabase
          .from("user_suspensions")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("is_active", true);

        if (error) throw error;

        await sendUserNotification(
          userId,
          "Account Reactivated",
          "Your account suspension has been lifted. You can now access all platform features.",
          "system"
        );

        toast.success("User reactivated successfully");
      }

      fetchUsers();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleSendNotification = (userId: string) => {
    setNotificationForm((prev) => ({ ...prev, user_id: userId }));
    setActiveTab("notifications");
    toast.info("Switched to notifications tab to send message");
  };

  const handleUploadComplete = () => {
    setActiveTab("manage");
  };

  const handleViewUserReleases = async (userId: string) => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(`Found ${data?.length || 0} releases for this user`);
      setActiveTab("releases");
      // Filter releases by user in the releases tab
      setSearchTerm(userId);
    } catch (error) {
      console.error("Error fetching user releases:", error);
      toast.error("Failed to fetch user releases");
    }
  };

  const handleViewUserPayouts = async (userId: string) => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(`Found ${data?.length || 0} payout requests for this user`);
      setActiveTab("payouts");
    } catch (error) {
      console.error("Error fetching user payouts:", error);
      toast.error("Failed to fetch user payouts");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchReleases(),
        fetchPayoutRequests(),
        fetchTakedownRequests(),
        fetchReleaseEdits(),
        fetchSupportTickets(),
        fetchPublishingRequests(),
        fetchPlaylistCampaigns(),
        fetchBeats(),
        fetchMasteringJobs(),
        fetchForumFlags(),
        fetchAiStats(),
        fetchFinancialStats(),
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!supabase) {
        console.error("No Supabase client available");
        return;
      }

      const [
        usersResult,
        releasesResult,
        payoutsResult,
        pendingReleasesResult,
        supportResult,
        publishingResult,
        campaignsResult,
        beatsResult,
        masteringResult,
        forumFlagsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("releases").select("id", { count: "exact" }),
        supabase.from("payout_requests").select("id", { count: "exact" }),
        supabase
          .from("releases")
          .select("id", { count: "exact" })
          .in("status", ["pending", "draft", "processing"]),
        supabase
          .from("support_requests")
          .select("id", { count: "exact" })
          .eq("status", "open"),
        supabase
          .from("publishing_requests")
          .select("id", { count: "exact" })
          .eq("status", "pending"),
        supabase
          .from("playlist_campaigns")
          .select("id", { count: "exact" })
          .in("status", ["pending", "in_progress"]),
        supabase
          .from("beats")
          .select("id", { count: "exact" })
          .eq("approval_status", "pending"),
        supabase
          .from("mastering_jobs")
          .select("id", { count: "exact" })
          .in("status", ["pending", "processing"]),
        supabase
          .from("forum_content_flags")
          .select("id", { count: "exact" })
          .eq("status", "pending"),
      ]);

      // Fetch AI stats for cost
      const aiResponse = await fetch("/api/admin/ai-services?limit=1000");
      const aiData = await aiResponse.json();
      const aiCost = aiData.stats?.totalCost || 0;

      // Fetch financial stats for revenue
      const financialResponse = await fetch("/api/admin/financial?period=30");
      const financialData = await financialResponse.json();
      const revenue = financialData.stats?.totalRevenue || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalReleases: releasesResult.count || 0,
        pendingReleases: pendingReleasesResult.count || 0,
        payoutRequests: payoutsResult.count || 0,
        supportTickets: supportResult.count || 0,
        publishingRequests: publishingResult.count || 0,
        playlistCampaigns: campaignsResult.count || 0,
        beatsPendingApproval: beatsResult.count || 0,
        activeMasteringJobs: masteringResult.count || 0,
        forumFlags: forumFlagsResult.count || 0,
        aiServiceCost: aiCost,
        platformRevenue: revenue,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to zeros if database queries fail
      setStats({
        totalUsers: 0,
        totalReleases: 0,
        pendingReleases: 0,
        payoutRequests: 0,
        supportTickets: 0,
        publishingRequests: 0,
        playlistCampaigns: 0,
        beatsPendingApproval: 0,
        activeMasteringJobs: 0,
        forumFlags: 0,
        aiServiceCost: 0,
        platformRevenue: 0,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const fetchUsers = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Check suspension status for each user
      const usersWithStatus = await Promise.all(
        (data || []).map(async (user) => {
          const { data: activeSuspension } = await supabase
            .from("user_suspensions")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...user,
            status: activeSuspension ? "suspended" : "active",
            suspension: activeSuspension || null,
          };
        })
      );

      setUsers(usersWithStatus);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchReleases = async () => {
    try {
      const response = await fetch("/api/admin/release-queue");
      if (response.ok) {
        const data = await response.json();
        setReleases(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching releases:", error);
    }
  };

  const fetchPayoutRequests = async () => {
    try {
      const response = await fetch("/api/admin/payout-requests");
      if (response.ok) {
        const data = await response.json();
        setPayoutRequests(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching payout requests:", error);
    }
  };

  const fetchTakedownRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("takedown_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTakedownRequests(data || []);
    } catch (error) {
      console.error("Error fetching takedown requests:", error);
      // Fallback to mock data
      setTakedownRequests([
        {
          id: "1",
          title: "Sample Song",
          artist: "Sample Artist",
          complainant: "Rights Holder Inc.",
          status: "pending",
          created_at: new Date().toISOString(),
          reason: "Copyright infringement claim",
        },
      ]);
    }
  };

  const fetchReleaseEdits = async () => {
    try {
      const { data, error } = await supabase
        .from("release_edits")
        .select(
          `
          *,
          releases!inner(title, artist_name),
          profiles!release_edits_user_id_fkey(full_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReleaseEdits(data || []);
    } catch (error) {
      console.error("Error fetching release edits:", error);
      setReleaseEdits([]);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_requests")
        .select(
          `
          *,
          profiles!support_requests_user_id_fkey(full_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSupportTickets(data || []);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      setSupportTickets([]);
    }
  };

  const fetchPublishingRequests = async () => {
    try {
      const response = await fetch("/api/admin/publishing-requests");
      if (response.ok) {
        const data = await response.json();
        setPublishingRequests(data.requests || []);
      } else {
        throw new Error("Failed to fetch publishing requests");
      }
    } catch (error) {
      console.error("Error fetching publishing requests:", error);
      setPublishingRequests([]);
    }
  };

  const fetchPlaylistCampaigns = async () => {
    try {
      const response = await fetch("/api/admin/playlist-campaigns");
      if (response.ok) {
        const data = await response.json();
        setPlaylistCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching playlist campaigns:", error);
      setPlaylistCampaigns([]);
    }
  };

  const fetchBeats = async () => {
    try {
      const response = await fetch("/api/admin/beats");
      if (response.ok) {
        const data = await response.json();
        setBeats(data.beats || []);
      }
    } catch (error) {
      console.error("Error fetching beats:", error);
      setBeats([]);
    }
  };

  const fetchMasteringJobs = async () => {
    try {
      const response = await fetch("/api/admin/mastering-jobs");
      if (response.ok) {
        const data = await response.json();
        setMasteringJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching mastering jobs:", error);
      setMasteringJobs([]);
    }
  };

  const fetchForumFlags = async () => {
    try {
      const response = await fetch("/api/admin/forum-moderation");
      if (response.ok) {
        const data = await response.json();
        setForumFlags(data.flags || []);
      }
    } catch (error) {
      console.error("Error fetching forum flags:", error);
      setForumFlags([]);
    }
  };

  const fetchAiStats = async () => {
    try {
      const response = await fetch("/api/admin/ai-services?limit=100");
      if (response.ok) {
        const data = await response.json();
        setAiStats(data);
      }
    } catch (error) {
      console.error("Error fetching AI stats:", error);
    }
  };

  const fetchFinancialStats = async () => {
    try {
      const response = await fetch("/api/admin/financial?period=30");
      if (response.ok) {
        const data = await response.json();
        setFinancialStats(data);
      }
    } catch (error) {
      console.error("Error fetching financial stats:", error);
    }
  };

  // Helper function to send notifications to users
  const sendUserNotification = async (
    userId: string,
    title: string,
    message: string,
    type: "release" | "payout" | "system" | "warning" = "system"
  ) => {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        title,
        message,
        type,
        read: false,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error sending notification:", error);
        // Try alternative notification method if notifications table doesn't exist
        try {
          const { error: altError } = await supabase
            .from("admin_notifications")
            .insert({
              user_id: userId,
              title,
              message,
              type,
              status: "sent",
              created_at: new Date().toISOString(),
            });

          if (altError) throw altError;
        } catch (altErr) {
          console.error("Alternative notification method also failed:", altErr);
        }
      }
    } catch (error) {
      console.error("Failed to send user notification:", error);
    }
  };

  const handleEditAction = async (
    editId: string,
    action: "approved" | "rejected",
    reason?: string
  ) => {
    try {
      const { data: edit, error: fetchError } = await supabase
        .from("release_edits")
        .select(
          `
          *,
          releases!inner(title, artist_name),
          profiles!release_edits_user_id_fkey(full_name, email)
        `
        )
        .eq("id", editId)
        .single();

      if (fetchError) throw fetchError;

      if (action === "approved") {
        // Apply the changes to the release
        const { error: updateError } = await supabase
          .from("releases")
          .update({
            ...edit.proposed_changes,
            status: "live",
            updated_at: new Date().toISOString(),
          })
          .eq("id", edit.release_id);

        if (updateError) throw updateError;

        // Update the edit record
        const { error: editUpdateError } = await supabase
          .from("release_edits")
          .update({
            status: "approved",
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
            applied_at: new Date().toISOString(),
          })
          .eq("id", editId);

        if (editUpdateError) throw editUpdateError;

        // Send notification to user
        await sendUserNotification(
          edit.user_id,
          "Release Edit Approved",
          `Your edit request for "${edit.releases.title}" has been approved and the changes have been applied.`,
          "release"
        );

        toast.success("Edit approved, changes applied, and user notified");
      } else {
        // Reject the edit
        const { error: rejectError } = await supabase
          .from("release_edits")
          .update({
            status: "rejected",
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason: reason || "Edit rejected by admin",
          })
          .eq("id", editId);

        if (rejectError) throw rejectError;

        // Revert release status if it was pending edit
        const { error: revertError } = await supabase
          .from("releases")
          .update({
            status: "live",
            updated_at: new Date().toISOString(),
          })
          .eq("id", edit.release_id);

        if (revertError) throw revertError;

        // Send notification to user
        await sendUserNotification(
          edit.user_id,
          "Release Edit Rejected",
          `Your edit request for "${edit.releases.title}" has been rejected. ${reason ? `Reason: ${reason}` : "Please review and try again."
          }`,
          "warning"
        );

        toast.success("Edit rejected and user notified");
      }

      // Refresh data
      fetchReleaseEdits();
      fetchReleases();
      fetchStats();
    } catch (error) {
      console.error("Error handling edit action:", error);
      toast.error(`Failed to ${action} edit`);
    }
  };

  const handleReleaseAction = async (
    releaseId: string,
    action: "approve" | "reject",
    reason?: string
  ) => {
    try {
      console.log("🚀 Starting", action, "for release:", releaseId);

      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      // Fetch release details first
      const { data: releases, error: fetchError } = await supabase
        .from("releases")
        .select("*")
        .eq("id", releaseId)
        .limit(1);

      if (fetchError) {
        console.error("❌ Fetch error:", fetchError);
        throw new Error(`Failed to fetch release: ${fetchError.message}`);
      }

      if (!releases || releases.length === 0) {
        throw new Error("Release not found");
      }

      const release = releases[0];
      console.log(
        "✅ Release found:",
        release.title,
        "| Current Status:",
        release.status
      );

      // Determine new status
      const newStatus = action === "approve" ? "approved" : "rejected";

      // 🔥 BUILD UPDATE - ONLY EXISTING COLUMNS!
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // ✅ Store rejection reason in metadata (since admin_notes column doesn't exist)
      if (reason) {
        const existingMetadata = release.metadata || {};
        updateData.metadata = {
          ...existingMetadata,
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id || "admin",
        };
      }

      // ✅ Store approval info in metadata
      if (action === "approve") {
        const existingMetadata = release.metadata || {};
        updateData.metadata = {
          ...existingMetadata,
          approved_at: new Date().toISOString(),
          approved_by: user?.id || "admin",
        };
      }

      console.log("📝 Updating with:", updateData);

      // 🔥 DIRECT DATABASE UPDATE
      const { data: updated, error: updateError } = await supabase
        .from("releases")
        .update(updateData)
        .eq("id", releaseId)
        .select();

      if (updateError) {
        console.error("❌ Update error:", updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      if (!updated || updated.length === 0) {
        throw new Error("Update returned no data");
      }

      console.log("✅ Database updated! New status:", updated[0].status);

      // Send notification to user
      try {
        await sendUserNotification(
          release.user_id,
          `Release ${action === "approve" ? "Approved" : "Rejected"}`,
          action === "approve"
            ? `Your release "${release.title}" has been approved and is now live!`
            : `Your release "${release.title}" has been rejected. ${reason ? `Reason: ${reason}` : "Please review and resubmit."
            }`,
          action === "approve" ? "release" : "warning"
        );
        console.log("✅ Notification sent");
      } catch (notifError) {
        console.error("⚠️ Notification error (non-critical):", notifError);
      }

      // 🎉 SUCCESS TOAST
      toast.success(
        `Release ${action === "approve" ? "approved" : "rejected"
        } successfully!`,
        {
          description: `"${release.title}" status changed to ${newStatus}`,
          duration: 4000,
        }
      );

      // 🔄 Refresh UI
      console.log("🔄 Refreshing UI...");

      // Update the release in local state immediately for instant feedback
      setReleases((prevReleases) =>
        prevReleases.map((r) =>
          r.id === releaseId ? { ...r, ...updateData } : r
        )
      );

      // Fetch fresh data in background
      await Promise.all([fetchReleases(), fetchStats()]);

      console.log("✅ Complete!");
    } catch (error: any) {
      console.error("❌ Error:", error);

      // 🚨 ERROR TOAST
      toast.error(`Failed to ${action} release`, {
        description: error.message || "An unexpected error occurred",
        duration: 5000,
      });
    }
  };

  const handlePayoutAction = async (
    payoutId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    try {
      // Get payout details first
      const { data: payout, error: fetchError } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("id", payoutId)
        .single();

      if (fetchError) throw fetchError;

      const response = await fetch("/api/admin/payout-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: payoutId, status, admin_notes: notes }),
      });

      if (response.ok) {
        // Send notification to user
        await sendUserNotification(
          payout.user_id,
          `Payout Request ${status === "approved" ? "Approved" : "Rejected"}`,
          status === "approved"
            ? `Your payout request of $${payout.amount} has been approved and will be processed soon.`
            : `Your payout request of $${payout.amount} has been rejected. ${notes ? `Reason: ${notes}` : ""
            }`,
          status === "approved" ? "payout" : "warning"
        );

        toast.success(`Payout ${status} successfully and user notified`);
        fetchPayoutRequests();
      } else {
        throw new Error(`Failed to ${status} payout`);
      }
    } catch (error) {
      console.error(`Error ${status}ing payout:`, error);
      toast.error(`Failed to ${status} payout`);
    }
  };

  const sendNotification = async () => {
    if (
      !notificationForm.user_id ||
      !notificationForm.title ||
      !notificationForm.message
    ) {
      toast.error("Please fill in all notification fields");
      return;
    }

    setSendingNotification(true);
    try {
      // Mock notification sending - would be replaced with real API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Notification sent successfully");
      setNotificationForm({
        user_id: "",
        title: "",
        message: "",
        type: "system",
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setSendingNotification(false);
    }
  };

  const handleDownloadAll = async (release: any) => {
    try {
      toast.info("Preparing download package...");

      // Create CSV content with release information
      const csvHeaders = ["Field", "Value"];

      const csvRows = [
        ["Release ID", release.id],
        ["Title", release.title],
        ["Artist", release.artist || release.artist_name || "N/A"],
        ["Genre", release.genre || "N/A"],
        ["Type", release.type || release.metadata?.releaseType || "Single"],
        ["Status", release.status],
        [
          "Release Date",
          release.release_date
            ? new Date(release.release_date).toLocaleDateString()
            : "Not set",
        ],
        ["Created Date", new Date(release.created_at).toLocaleString()],
        ["Updated Date", new Date(release.updated_at).toLocaleString()],
        ["Streams", (release.streams || 0).toString()],
        ["Revenue", `${(release.revenue || 0).toFixed(2)}`],
        ["Track Count", (release.track_count || 1).toString()],
        ["User ID", release.user_id],
        [
          "Cover Art URL",
          release.cover_art ||
          release.cover_art_url ||
          release.artwork_url ||
          "N/A",
        ],
        ["Audio URL", release.audio_url || "N/A"],
        ["Platforms", release.platforms?.join(", ") || "N/A"],
      ];

      // Add metadata fields if available
      if (release.metadata && Object.keys(release.metadata).length > 0) {
        csvRows.push(["--- Additional Metadata ---", ""]);
        Object.entries(release.metadata).forEach(([key, value]) => {
          const formattedKey = key
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .trim();
          let formattedValue = "N/A";

          if (value !== null && value !== undefined) {
            if (typeof value === "object") {
              formattedValue = Array.isArray(value)
                ? value.join(", ")
                : Object.values(value).join(", ");
            } else {
              formattedValue = String(value);
            }
          }

          csvRows.push([formattedKey, formattedValue]);
        });
      }

      // Generate CSV content
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) =>
          row
            .map((cell) => {
              // Escape cells that contain commas, quotes, or newlines
              const cellStr = String(cell).replace(/"/g, '""');
              return cellStr.includes(",") ||
                cellStr.includes('"') ||
                cellStr.includes("\n")
                ? `"${cellStr}"`
                : cellStr;
            })
            .join(",")
        ),
      ].join("\n");

      // Download CSV file
      const csvBlob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const csvUrl = window.URL.createObjectURL(csvBlob);
      const csvLink = document.createElement("a");
      csvLink.href = csvUrl;
      csvLink.download = `${release.title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_info.csv`;
      document.body.appendChild(csvLink);
      csvLink.click();
      document.body.removeChild(csvLink);
      window.URL.revokeObjectURL(csvUrl);

      // Download audio file if available
      if (release.audio_url) {
        try {
          // Fetch the audio file
          const audioResponse = await fetch(release.audio_url);
          if (audioResponse.ok) {
            const audioBlob = await audioResponse.blob();

            // Determine file extension from URL or content type
            let extension = "mp3"; // default
            const urlExtension = release.audio_url
              .split(".")
              .pop()
              ?.toLowerCase();
            if (
              urlExtension &&
              ["mp3", "wav", "flac", "m4a", "aac"].includes(urlExtension)
            ) {
              extension = urlExtension;
            } else {
              const contentType = audioResponse.headers.get("content-type");
              if (contentType?.includes("wav")) extension = "wav";
              else if (contentType?.includes("flac")) extension = "flac";
              else if (contentType?.includes("m4a")) extension = "m4a";
              else if (contentType?.includes("aac")) extension = "aac";
            }

            const audioUrl = window.URL.createObjectURL(audioBlob);
            const audioLink = document.createElement("a");
            audioLink.href = audioUrl;
            audioLink.download = `${release.title.replace(
              /[^a-z0-9]/gi,
              "_"
            )}_audio.${extension}`;
            document.body.appendChild(audioLink);
            audioLink.click();
            document.body.removeChild(audioLink);
            window.URL.revokeObjectURL(audioUrl);

            toast.success("Download complete! (CSV + Audio)");
          } else {
            toast.warning("CSV downloaded. Audio file unavailable.");
          }
        } catch (audioError) {
          console.error("Audio download error:", audioError);
          toast.warning("CSV downloaded. Failed to download audio file.");
        }
      } else {
        toast.success("CSV downloaded! (No audio file available)");
      }

      // Optionally download cover art if available
      if (release.cover_art || release.cover_art_url || release.artwork_url) {
        try {
          const coverUrl =
            release.cover_art || release.cover_art_url || release.artwork_url;
          const coverResponse = await fetch(coverUrl);
          if (coverResponse.ok) {
            const coverBlob = await coverResponse.blob();

            // Determine image extension
            let extension = "jpg";
            const urlExtension = coverUrl.split(".").pop()?.toLowerCase();
            if (
              urlExtension &&
              ["jpg", "jpeg", "png", "webp"].includes(urlExtension)
            ) {
              extension = urlExtension;
            } else {
              const contentType = coverResponse.headers.get("content-type");
              if (contentType?.includes("png")) extension = "png";
              else if (contentType?.includes("webp")) extension = "webp";
            }

            const coverBlobUrl = window.URL.createObjectURL(coverBlob);
            const coverLink = document.createElement("a");
            coverLink.href = coverBlobUrl;
            coverLink.download = `${release.title.replace(
              /[^a-z0-9]/gi,
              "_"
            )}_cover.${extension}`;
            document.body.appendChild(coverLink);
            coverLink.click();
            document.body.removeChild(coverLink);
            window.URL.revokeObjectURL(coverBlobUrl);
          }
        } catch (coverError) {
          console.error("Cover art download error:", coverError);
          // Don't show error for cover art, it's optional
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download release package");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleRejectWithReason = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    await handleReleaseAction(
      rejectionModal.releaseId,
      "reject",
      rejectionReason
    );
    setRejectionModal({ open: false, releaseId: "", releaseTitle: "" });
    setRejectionReason("");
  };

  const handleEditRejectWithReason = async () => {
    if (!editRejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    await handleEditAction(
      editRejectionModal.editId,
      "rejected",
      editRejectionReason
    );
    setEditRejectionModal({ open: false, editId: "", releaseTitle: "" });
    setEditRejectionReason("");
  };

  const handleSupportAction = async (
    ticketId: string,
    status: "in_progress" | "resolved" | "closed"
  ) => {
    try {
      const { data: ticket, error: fetchError } = await supabase
        .from("support_requests")
        .select("*, profiles!inner(full_name, email)")
        .eq("id", ticketId)
        .single();

      if (fetchError) throw fetchError;

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("support_requests")
        .update(updateData)
        .eq("id", ticketId);

      if (updateError) throw updateError;

      // Send notification to user
      let notificationTitle = "";
      let notificationMessage = "";

      switch (status) {
        case "in_progress":
          notificationTitle = "Support Ticket In Progress";
          notificationMessage = `Your support request "${ticket.subject}" is now being reviewed by our team.`;
          break;
        case "resolved":
          notificationTitle = "Support Ticket Resolved";
          notificationMessage = `Your support request "${ticket.subject}" has been resolved. Thank you for contacting us!`;
          break;
        case "closed":
          notificationTitle = "Support Ticket Closed";
          notificationMessage = `Your support request "${ticket.subject}" has been closed.`;
          break;
      }

      await sendUserNotification(
        ticket.user_id,
        notificationTitle,
        notificationMessage,
        "system"
      );

      toast.success(
        `Support ticket ${status.replace("_", " ")} and user notified`
      );
      fetchSupportTickets();
    } catch (error) {
      console.error("Error updating support ticket:", error);
      toast.error("Failed to update support ticket");
    }
  };

  const handlePublishingAction = async (
    requestId: string,
    action: "approve" | "reject",
    adminNotes?: string
  ) => {
    try {
      const response = await fetch("/api/admin/publishing-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          action,
          admin_notes: adminNotes,
        }),
      });

      if (response.ok) {
        // Get the request details for notification
        const request = publishingRequests.find((req) => req.id === requestId);
        if (request) {
          await sendUserNotification(
            request.user_id,
            `Publishing Request ${action === "approve" ? "Approved" : "Rejected"
            }`,
            action === "approve"
              ? `Your publishing administration request has been approved! You now have access to publishing services.`
              : `Your publishing administration request has been rejected. ${adminNotes
                ? `Reason: ${adminNotes}`
                : "Please contact support for more information."
              }`,
            action === "approve" ? "system" : "warning"
          );
        }

        toast.success(
          `Publishing request ${action}d successfully and user notified`
        );
        fetchPublishingRequests();
        fetchStats(); // Update stats to reflect change
      } else {
        throw new Error(`Failed to ${action} publishing request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing publishing request:`, error);
      toast.error(`Failed to ${action} publishing request`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
 

  
        <ImprovedAdminNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          user={user}
        >
          {/* Stats Overview - Condensed for Mobile */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3 px-2 sm:px-0">
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Total Users
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.totalUsers || 0}
                      </p>
                    </div>
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Total Releases
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.totalReleases || 0}
                      </p>
                    </div>
                    <Music className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Pending Releases
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.pendingReleases || 0}
                      </p>
                    </div>
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Payout Requests
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.payoutRequests || 0}
                      </p>
                    </div>
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Support Tickets
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.supportTickets || 0}
                      </p>
                    </div>
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Publishing Requests
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.publishingRequests || 0}
                      </p>
                    </div>
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              {/* Row 2 Cards */}
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Playlist Campaigns
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.playlistCampaigns || 0}
                      </p>
                    </div>
                    <Music className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-pink-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Beats Pending
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.beatsPendingApproval || 0}
                      </p>
                    </div>
                    <Music className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Mastering Jobs
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.activeMasteringJobs || 0}
                      </p>
                    </div>
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Forum Flags
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {stats?.forumFlags || 0}
                      </p>
                    </div>
                    <Flag className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        AI Service Cost
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        ${(stats?.aiServiceCost || 0).toFixed(2)}
                      </p>
                    </div>
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm truncate">
                        Platform Revenue
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        ${(stats?.platformRevenue || 0).toFixed(0)}
                      </p>
                    </div>
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-emerald-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}


          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <Upload className="w-4 h-4 text-green-400 mr-3" />
                        <div>
                          <p className="text-white text-sm">
                            New release uploaded
                          </p>
                          <p className="text-gray-400 text-xs">2 minutes ago</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-green-400 border-green-400"
                      >
                        New
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-purple-400 mr-3" />
                        <div>
                          <p className="text-white text-sm">
                            Payout request submitted
                          </p>
                          <p className="text-gray-400 text-xs">
                            15 minutes ago
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-purple-400 border-purple-400"
                      >
                        Pending
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-400 mr-3" />
                        <div>
                          <p className="text-white text-sm">
                            Takedown request received
                          </p>
                          <p className="text-gray-400 text-xs">1 hour ago</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-red-400 border-red-400"
                      >
                        Urgent
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col"
                      onClick={() => setActiveTab("releases")}
                    >
                      <Music className="w-6 h-6 mb-2" />
                      Review Releases
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col"
                      onClick={() => setActiveTab("payouts")}
                    >
                      <DollarSign className="w-6 h-6 mb-2" />
                      Process Payouts
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col"
                      onClick={() => setActiveTab("users")}
                    >
                      <Users className="w-6 h-6 mb-2" />
                      Manage Users
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col"
                      onClick={() => setActiveTab("takedowns")}
                    >
                      <AlertCircle className="w-6 h-6 mb-2" />
                      Handle Takedowns
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Releases Tab */}
          <TabsContent value="releases" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Music className="w-5 h-5 mr-2 text-green-400" />
                    Release Management
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchReleases}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {releases.length === 0 ? (
                    <div className="text-center py-8">
                      <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No releases found</p>
                    </div>
                  ) : (
                    releases.map((release) => (
                      <div
                        key={release.id}
                        className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              {release.cover_art ? (
                                <img
                                  src={release.cover_art}
                                  alt={release.title}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                                  <Music className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              {release.audio_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full bg-gray-900 border-gray-600 hover:bg-gray-700"
                                  onClick={() =>
                                    handlePlayPause(
                                      release.id,
                                      release.audio_url
                                    )
                                  }
                                  disabled={audioLoading === release.id}
                                >
                                  {audioLoading === release.id ? (
                                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  ) : currentlyPlaying === release.id ? (
                                    <Pause className="w-3 h-3" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium">
                                {release.title}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {release.artist || release.artist_name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {release.genre}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge
                                  variant={
                                    release.status === "approved" ||
                                      release.status === "live"
                                      ? "default"
                                      : release.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className={
                                    release.status === "live" ||
                                      release.status === "approved"
                                      ? "bg-green-600"
                                      : release.status === "pending"
                                        ? "bg-yellow-600"
                                        : release.status === "processing"
                                          ? "bg-blue-600"
                                          : "bg-red-600"
                                  }
                                >
                                  {release.status}
                                </Badge>
                                <span className="text-gray-500 text-xs">
                                  {new Date(
                                    release.created_at
                                  ).toLocaleDateString()}
                                </span>
                                {release.streams > 0 && (
                                  <span className="text-gray-500 text-xs">
                                    {release.streams.toLocaleString()} streams
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {release.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleReleaseAction(release.id, "approve")
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    setRejectionModal({
                                      open: true,
                                      releaseId: release.id,
                                      releaseTitle: release.title,
                                    })
                                  }
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() =>
                                setSelectedRelease(
                                  selectedRelease?.id === release.id
                                    ? null
                                    : release
                                )
                              }
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {selectedRelease?.id === release.id
                                ? "Hide"
                                : "Details"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 cursor-pointer"
                              onClick={() => handleDownloadAll(release)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download All
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedRelease?.id === release.id && (
                          <div className="border-t border-gray-700 p-4 bg-gray-850">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  Release Information
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-gray-400">
                                      Release Date:
                                    </span>{" "}
                                    <span className="text-white">
                                      {release.release_date
                                        ? new Date(
                                          release.release_date
                                        ).toLocaleDateString()
                                        : "Not set"}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Genre:
                                    </span>{" "}
                                    <span className="text-white">
                                      {release.genre || "Not specified"}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">Type:</span>{" "}
                                    <span className="text-white capitalize">
                                      {release.type ||
                                        release.metadata?.releaseType ||
                                        "Single"}
                                    </span>
                                  </p>
                                  {release.track_count && (
                                    <p>
                                      <span className="text-gray-400">
                                        Tracks:
                                      </span>{" "}
                                      <span className="text-white">
                                        {release.track_count}
                                      </span>
                                    </p>
                                  )}
                                  <p>
                                    <span className="text-gray-400">
                                      User ID:
                                    </span>{" "}
                                    <span className="text-white font-mono text-xs">
                                      {release.user_id}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Release ID:
                                    </span>{" "}
                                    <span className="text-white font-mono text-xs">
                                      {release.id}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  Performance
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-gray-400">
                                      Streams:
                                    </span>{" "}
                                    <span className="text-white">
                                      {(release.streams || 0).toLocaleString()}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Revenue:
                                    </span>{" "}
                                    <span className="text-white">
                                      ${(release.revenue || 0).toFixed(2)}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Platforms:
                                    </span>{" "}
                                    <span className="text-white">
                                      {release.platforms?.length || 0} platforms
                                    </span>
                                  </p>
                                  {release.platforms &&
                                    release.platforms.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {release.platforms.map(
                                          (platform: string) => (
                                            <Badge
                                              key={platform}
                                              variant="outline"
                                              className="text-xs border-gray-600 text-gray-300"
                                            >
                                              {platform}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  Files & URLs
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-gray-400">
                                      Cover Art:
                                    </span>
                                    {release.cover_art_url ||
                                      release.artwork_url ? (
                                      <a
                                        href={
                                          release.cover_art_url ||
                                          release.artwork_url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 ml-1"
                                      >
                                        View
                                      </a>
                                    ) : (
                                      <span className="text-gray-500 ml-1">
                                        Not available
                                      </span>
                                    )}
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Audio File:
                                    </span>
                                    {release.audio_url ? (
                                      <a
                                        href={release.audio_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 ml-1"
                                      >
                                        Download
                                      </a>
                                    ) : (
                                      <span className="text-gray-500 ml-1">
                                        Not available
                                      </span>
                                    )}
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Created:
                                    </span>{" "}
                                    <span className="text-white">
                                      {new Date(
                                        release.created_at
                                      ).toLocaleString()}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Updated:
                                    </span>{" "}
                                    <span className="text-white">
                                      {new Date(
                                        release.updated_at
                                      ).toLocaleString()}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {release.metadata &&
                                Object.keys(release.metadata).length > 0 && (
                                  <div className="md:col-span-2 lg:col-span-3">
                                    <h4 className="text-white font-medium mb-2">
                                      Additional Metadata
                                    </h4>
                                    <div className="bg-gray-900 rounded p-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(release.metadata).map(
                                          ([key, value]) => (
                                            <div key={key} className="text-sm">
                                              <span className="text-gray-400 capitalize">
                                                {key
                                                  .replace(/_/g, " ")
                                                  .replace(/([A-Z])/g, " $1")
                                                  .trim()}
                                                :
                                              </span>
                                              <span className="text-white ml-2">
                                                {typeof value === "object" &&
                                                  value !== null
                                                  ? Array.isArray(value)
                                                    ? value.join(", ")
                                                    : Object.values(value).join(
                                                      ", "
                                                    )
                                                  : String(value)}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                    User Management
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 bg-gray-800 border-gray-700 text-white"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUsers}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .filter(
                      (user) =>
                        !searchTerm ||
                        user.email
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        (user.full_name &&
                          user.full_name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()))
                    )
                    .map((user) => (
                      <div
                        key={user.id}
                        className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium">
                                {user.full_name || user.email}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {user.email}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={
                                    user.status === "active"
                                      ? "text-green-400 border-green-400"
                                      : user.status === "suspended"
                                        ? "text-red-400 border-red-400"
                                        : "text-yellow-400 border-yellow-400"
                                  }
                                >
                                  {user.status || "Active"}
                                </Badge>
                                <span className="text-gray-500 text-xs">
                                  Joined{" "}
                                  {new Date(
                                    user.created_at
                                  ).toLocaleDateString()}
                                </span>
                                {user.role && (
                                  <Badge
                                    variant="outline"
                                    className="text-blue-400 border-blue-400 text-xs"
                                  >
                                    {user.role}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() =>
                                handleUserAction(
                                  user.id,
                                  user.status === "suspended"
                                    ? "activate"
                                    : "suspend"
                                )
                              }
                            >
                              {user.status === "suspended" ? (
                                <>
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Activate
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 mr-1" />
                                  Suspend
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() =>
                                setSelectedUser(
                                  selectedUser?.id === user.id ? null : user
                                )
                              }
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {selectedUser?.id === user.id
                                ? "Hide"
                                : "Details"}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded User Details */}
                        {selectedUser?.id === user.id && (
                          <div className="border-t border-gray-700 p-4 bg-gray-850">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  User Information
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-gray-400">
                                      Full Name:
                                    </span>{" "}
                                    <span className="text-white">
                                      {user.full_name || "Not provided"}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Email:
                                    </span>{" "}
                                    <span className="text-white">
                                      {user.email}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">Role:</span>{" "}
                                    <span className="text-white">
                                      {user.role || "User"}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Status:
                                    </span>{" "}
                                    <span className="text-white">
                                      {user.status || "Active"}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      User ID:
                                    </span>{" "}
                                    <span className="text-white font-mono text-xs">
                                      {user.id}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  Activity
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-gray-400">
                                      Joined:
                                    </span>{" "}
                                    <span className="text-white">
                                      {new Date(
                                        user.created_at
                                      ).toLocaleDateString()}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Last Active:
                                    </span>{" "}
                                    <span className="text-white">
                                      {user.last_sign_in_at
                                        ? new Date(
                                          user.last_sign_in_at
                                        ).toLocaleDateString()
                                        : "Never"}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Total Releases:
                                    </span>{" "}
                                    <span className="text-white">
                                      {user.release_count || 0}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Total Revenue:
                                    </span>{" "}
                                    <span className="text-white">
                                      ${(user.total_revenue || 0).toFixed(2)}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  Actions
                                </h4>
                                <div className="space-y-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                                    onClick={() =>
                                      handleSendNotification(user.id)
                                    }
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Message
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                                    onClick={() =>
                                      handleViewUserReleases(user.id)
                                    }
                                  >
                                    <Music className="w-4 h-4 mr-2" />
                                    View Releases
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                                    onClick={() =>
                                      handleViewUserPayouts(user.id)
                                    }
                                  >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    View Payouts
                                  </Button>
                                </div>
                              </div>

                              {user.metadata &&
                                Object.keys(user.metadata).length > 0 && (
                                  <div className="md:col-span-2 lg:col-span-3">
                                    <h4 className="text-white font-medium mb-2">
                                      Additional Information
                                    </h4>
                                    <div className="bg-gray-900 rounded p-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(user.metadata).map(
                                          ([key, value]) => (
                                            <div key={key} className="text-sm">
                                              <span className="text-gray-400 capitalize">
                                                {key
                                                  .replace(/_/g, " ")
                                                  .replace(/([A-Z])/g, " $1")
                                                  .trim()}
                                                :
                                              </span>
                                              <span className="text-white ml-2">
                                                {typeof value === "object" &&
                                                  value !== null
                                                  ? Array.isArray(value)
                                                    ? value.join(", ")
                                                    : Object.values(value).join(
                                                      ", "
                                                    )
                                                  : String(value)}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-purple-400" />
                  Payout Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No payout requests found</p>
                    </div>
                  ) : (
                    payoutRequests.map((payout) => (
                      <div
                        key={payout.id}
                        className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium">
                                ${payout.amount.toFixed(2)}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {payout.method_type || payout.payment_method}
                              </p>
                              <p className="text-gray-500 text-xs">
                                User: {payout.user_email || payout.user_id}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge
                                  variant={
                                    payout.status === "approved" ||
                                      payout.status === "completed"
                                      ? "default"
                                      : payout.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className={
                                    payout.status === "approved" ||
                                      payout.status === "completed"
                                      ? "bg-green-600"
                                      : payout.status === "pending"
                                        ? "bg-yellow-600"
                                        : payout.status === "processing"
                                          ? "bg-blue-600"
                                          : "bg-red-600"
                                  }
                                >
                                  {payout.status}
                                </Badge>
                                <span className="text-gray-500 text-xs">
                                  {new Date(
                                    payout.created_at
                                  ).toLocaleDateString()}
                                </span>
                                {payout.processed_at && (
                                  <span className="text-gray-500 text-xs">
                                    Processed:{" "}
                                    {new Date(
                                      payout.processed_at
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {payout.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handlePayoutAction(payout.id, "approved")
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handlePayoutAction(
                                      payout.id,
                                      "rejected",
                                      "Insufficient funds"
                                    )
                                  }
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() =>
                                setSelectedPayout(
                                  selectedPayout?.id === payout.id
                                    ? null
                                    : payout
                                )
                              }
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {selectedPayout?.id === payout.id
                                ? "Hide"
                                : "Details"}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Payout Details */}
                        {selectedPayout?.id === payout.id && (
                          <div className="border-t border-gray-700 p-4 bg-gray-850">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  Payout Information
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-gray-400">
                                      Amount:
                                    </span>{" "}
                                    <span className="text-white">
                                      ${payout.amount.toFixed(2)}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Method:
                                    </span>{" "}
                                    <span className="text-white">
                                      {payout.method_type ||
                                        payout.payment_method}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Status:
                                    </span>{" "}
                                    <span className="text-white">
                                      {payout.status}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      User ID:
                                    </span>{" "}
                                    <span className="text-white font-mono text-xs">
                                      {payout.user_id}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-400">
                                      Payout ID:
                                    </span>{" "}
                                    <span className="text-white font-mono text-xs">
                                      {payout.id}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  Payment Details
                                </h4>
                                <div className="space-y-1 text-sm">
                                  {payout.method_type === "paypal" &&
                                    payout.paypal_email && (
                                      <p>
                                        <span className="text-gray-400">
                                          PayPal Email:
                                        </span>{" "}
                                        <span className="text-white">
                                          {payout.paypal_email.replace(
                                            /(.{2}).*(@.*)/,
                                            "$1***$2"
                                          )}
                                        </span>
                                      </p>
                                    )}
                                  {payout.method_type === "bank_transfer" && (
                                    <>
                                      {payout.bank_name && (
                                        <p>
                                          <span className="text-gray-400">
                                            Bank:
                                          </span>{" "}
                                          <span className="text-white">
                                            {payout.bank_name}
                                          </span>
                                        </p>
                                      )}
                                      {payout.account_number && (
                                        <p>
                                          <span className="text-gray-400">
                                            Account:
                                          </span>{" "}
                                          <span className="text-white">
                                            ***{payout.account_number.slice(-4)}
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                  <p>
                                    <span className="text-gray-400">
                                      Created:
                                    </span>{" "}
                                    <span className="text-white">
                                      {new Date(
                                        payout.created_at
                                      ).toLocaleString()}
                                    </span>
                                  </p>
                                  {payout.processed_at && (
                                    <p>
                                      <span className="text-gray-400">
                                        Processed:
                                      </span>{" "}
                                      <span className="text-white">
                                        {new Date(
                                          payout.processed_at
                                        ).toLocaleString()}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-white font-medium mb-2">
                                  Actions
                                </h4>
                                <div className="space-y-2">
                                  {payout.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={() =>
                                          handlePayoutAction(
                                            payout.id,
                                            "approved"
                                          )
                                        }
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve Payout
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() =>
                                          handlePayoutAction(
                                            payout.id,
                                            "rejected",
                                            "Manual review required"
                                          )
                                        }
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject Payout
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                                    onClick={() =>
                                      handleViewUserPayouts(payout.user_id)
                                    }
                                  >
                                    <Users className="w-4 h-4 mr-2" />
                                    View User
                                  </Button>
                                </div>
                              </div>

                              {payout.admin_notes && (
                                <div className="md:col-span-2 lg:col-span-3">
                                  <h4 className="text-white font-medium mb-2">
                                    Admin Notes
                                  </h4>
                                  <div className="bg-gray-900 rounded p-3">
                                    <p className="text-gray-300 text-sm">
                                      {payout.admin_notes}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Takedowns Tab */}
          <TabsContent value="takedowns" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                  Takedown Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {takedownRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        No takedown requests found
                      </p>
                    </div>
                  ) : (
                    takedownRequests.map((takedown) => (
                      <div
                        key={takedown.id}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">
                              {takedown.title}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Artist: {takedown.artist}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Complainant: {takedown.complainant}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {takedown.reason}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="destructive">
                                {takedown.status}
                              </Badge>
                              <span className="text-gray-500 text-xs">
                                {new Date(
                                  takedown.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Take Down
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Release Edits Tab */}
          <TabsContent value="edits" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Edit className="w-5 h-5 mr-2 text-orange-400" />
                    Release Edit Requests ({releaseEdits.length})
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchReleaseEdits}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {releaseEdits.filter(
                    (edit) =>
                      statusFilter === "all" || edit.status === statusFilter
                  ).length === 0 ? (
                    <div className="text-center py-8">
                      <Edit className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No release edits found</p>
                    </div>
                  ) : (
                    releaseEdits
                      .filter(
                        (edit) =>
                          statusFilter === "all" || edit.status === statusFilter
                      )
                      .map((edit) => (
                        <div
                          key={edit.id}
                          className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                                <Edit className="w-6 h-6 text-orange-400" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-white font-medium">
                                  {edit.releases?.title || "Unknown Release"}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  by{" "}
                                  {edit.releases?.artist_name ||
                                    "Unknown Artist"}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  Edited by:{" "}
                                  {edit.profiles?.full_name ||
                                    edit.profiles?.email ||
                                    "Unknown User"}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge
                                    variant={
                                      edit.status === "approved"
                                        ? "default"
                                        : edit.status === "rejected"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    className={
                                      edit.status === "approved"
                                        ? "bg-green-600"
                                        : edit.status === "pending"
                                          ? "bg-yellow-600"
                                          : "bg-red-600"
                                    }
                                  >
                                    {edit.status}
                                  </Badge>
                                  <span className="text-gray-500 text-xs">
                                    {new Date(
                                      edit.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-blue-400 border-blue-400 text-xs"
                                  >
                                    {edit.edit_type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {edit.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleEditAction(edit.id, "approved")
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      setEditRejectionModal({
                                        open: true,
                                        editId: edit.id,
                                        releaseTitle:
                                          edit.releases?.title ||
                                          "Unknown Release",
                                      })
                                    }
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() =>
                                  setSelectedRelease(
                                    selectedRelease?.id === edit.id
                                      ? null
                                      : edit
                                  )
                                }
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {selectedRelease?.id === edit.id
                                  ? "Hide"
                                  : "Changes"}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Edit Details */}
                          {selectedRelease?.id === edit.id && (
                            <div className="border-t border-gray-700 p-4 bg-gray-850">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-white font-medium mb-3">
                                    Original Data
                                  </h4>
                                  <div className="bg-gray-900 rounded p-3 space-y-2">
                                    {edit.original_data &&
                                      Object.entries(edit.original_data).map(
                                        ([key, value]) => (
                                          <div key={key} className="text-sm">
                                            <span className="text-gray-400 capitalize">
                                              {key.replace(/_/g, " ")}:
                                            </span>
                                            <span className="text-gray-300 ml-2">
                                              {Array.isArray(value)
                                                ? value.join(", ")
                                                : String(value)}
                                            </span>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-white font-medium mb-3">
                                    Proposed Changes
                                  </h4>
                                  <div className="bg-gray-900 rounded p-3 space-y-2">
                                    {edit.proposed_changes &&
                                      Object.entries(edit.proposed_changes).map(
                                        ([key, value]) => (
                                          <div key={key} className="text-sm">
                                            <span className="text-gray-400 capitalize">
                                              {key.replace(/_/g, " ")}:
                                            </span>
                                            <span className="text-green-300 ml-2 font-medium">
                                              {Array.isArray(value)
                                                ? value.join(", ")
                                                : String(value)}
                                            </span>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </div>

                                <div className="lg:col-span-2">
                                  <h4 className="text-white font-medium mb-3">
                                    Edit Summary
                                  </h4>
                                  <div className="bg-gray-900 rounded p-3">
                                    <p className="text-gray-300 text-sm">
                                      {edit.change_summary ||
                                        "No summary provided"}
                                    </p>
                                  </div>

                                  {edit.rejection_reason && (
                                    <div className="mt-3">
                                      <h5 className="text-red-400 font-medium mb-2">
                                        Rejection Reason
                                      </h5>
                                      <div className="bg-red-900/20 border border-red-800 rounded p-3">
                                        <p className="text-red-300 text-sm">
                                          {edit.rejection_reason}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-400">
                                        Created:
                                      </span>
                                      <span className="text-white ml-2">
                                        {new Date(
                                          edit.created_at
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    {edit.reviewed_at && (
                                      <div>
                                        <span className="text-gray-400">
                                          Reviewed:
                                        </span>
                                        <span className="text-white ml-2">
                                          {new Date(
                                            edit.reviewed_at
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    {edit.applied_at && (
                                      <div>
                                        <span className="text-gray-400">
                                          Applied:
                                        </span>
                                        <span className="text-white ml-2">
                                          {new Date(
                                            edit.applied_at
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publishing Requests Tab */}
          <TabsContent value="publishing" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-yellow-400" />
                    Publishing Requests ({publishingRequests.length})
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchPublishingRequests}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publishingRequests
                    .filter(
                      (request) =>
                        statusFilter === "all" ||
                        request.status === statusFilter
                    )
                    .map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-white font-medium">
                                  {request.profiles.full_name}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  request.status === "approved"
                                    ? "default"
                                    : request.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className={
                                  request.status === "approved"
                                    ? "bg-green-600 text-white"
                                    : request.status === "rejected"
                                      ? "bg-red-600 text-white"
                                      : "bg-yellow-600 text-white"
                                }
                              >
                                {request.status.charAt(0).toUpperCase() +
                                  request.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="text-gray-300 text-sm space-y-1">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{request.user_email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>
                                  Requested{" "}
                                  {new Date(
                                    request.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span>
                                  Type: {request.request_type.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                            {request.message && (
                              <div className="mt-3 p-3 bg-gray-900 rounded border-l-4 border-blue-500">
                                <p className="text-gray-300 text-sm italic">
                                  "{request.message}"
                                </p>
                              </div>
                            )}
                            {request.admin_notes && (
                              <div className="mt-3 p-3 bg-gray-900 rounded border-l-4 border-yellow-500">
                                <p className="text-gray-400 text-xs font-medium mb-1">
                                  Admin Notes:
                                </p>
                                <p className="text-gray-300 text-sm">
                                  {request.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>
                          {request.status === "pending" && (
                            <div className="flex space-x-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handlePublishingAction(request.id, "approve")
                                }
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const notes = prompt(
                                    "Reason for rejection (optional):"
                                  );
                                  handlePublishingAction(
                                    request.id,
                                    "reject",
                                    notes || undefined
                                  );
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  {publishingRequests.filter(
                    (request) =>
                      statusFilter === "all" || request.status === statusFilter
                  ).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No publishing requests found</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                    Support Tickets ({supportTickets.length})
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchSupportTickets}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.filter(
                    (ticket) =>
                      statusFilter === "all" || ticket.status === statusFilter
                  ).length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No support tickets found</p>
                    </div>
                  ) : (
                    supportTickets
                      .filter(
                        (ticket) =>
                          statusFilter === "all" ||
                          ticket.status === statusFilter
                      )
                      .map((ticket) => (
                        <div
                          key={ticket.id}
                          className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-white font-medium">
                                  {ticket.subject}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  by{" "}
                                  {ticket.profiles?.full_name ||
                                    ticket.profiles?.email ||
                                    "Unknown User"}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  Category: {ticket.category}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge
                                    variant={
                                      ticket.status === "resolved"
                                        ? "default"
                                        : ticket.status === "closed"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className={
                                      ticket.status === "resolved"
                                        ? "bg-green-600"
                                        : ticket.status === "open"
                                          ? "bg-red-600"
                                          : ticket.status === "in_progress"
                                            ? "bg-yellow-600"
                                            : "bg-gray-600"
                                    }
                                  >
                                    {ticket.status.replace("_", " ")}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={
                                      ticket.priority === "high"
                                        ? "text-red-400 border-red-400"
                                        : ticket.priority === "medium"
                                          ? "text-yellow-400 border-yellow-400"
                                          : "text-green-400 border-green-400"
                                    }
                                  >
                                    {ticket.priority} priority
                                  </Badge>
                                  <span className="text-gray-500 text-xs">
                                    {new Date(
                                      ticket.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {ticket.status === "open" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleSupportAction(
                                      ticket.id,
                                      "in_progress"
                                    )
                                  }
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  Start
                                </Button>
                              )}
                              {ticket.status === "in_progress" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleSupportAction(ticket.id, "resolved")
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Resolve
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() =>
                                  setSelectedRelease(
                                    selectedRelease?.id === ticket.id
                                      ? null
                                      : ticket
                                  )
                                }
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {selectedRelease?.id === ticket.id
                                  ? "Hide"
                                  : "Details"}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Ticket Details */}
                          {selectedRelease?.id === ticket.id && (
                            <div className="border-t border-gray-700 p-4 bg-gray-850">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-white font-medium mb-3">
                                    Ticket Details
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <span className="text-gray-400">
                                        Subject:
                                      </span>{" "}
                                      <span className="text-white">
                                        {ticket.subject}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="text-gray-400">
                                        Category:
                                      </span>{" "}
                                      <span className="text-white">
                                        {ticket.category}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="text-gray-400">
                                        Priority:
                                      </span>{" "}
                                      <span className="text-white">
                                        {ticket.priority}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="text-gray-400">
                                        Status:
                                      </span>{" "}
                                      <span className="text-white">
                                        {ticket.status.replace("_", " ")}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="text-gray-400">
                                        User:
                                      </span>{" "}
                                      <span className="text-white">
                                        {ticket.profiles?.full_name ||
                                          ticket.profiles?.email ||
                                          "Unknown"}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-white font-medium mb-3">
                                    Timeline
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <span className="text-gray-400">
                                        Created:
                                      </span>{" "}
                                      <span className="text-white">
                                        {new Date(
                                          ticket.created_at
                                        ).toLocaleString()}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="text-gray-400">
                                        Updated:
                                      </span>{" "}
                                      <span className="text-white">
                                        {new Date(
                                          ticket.updated_at
                                        ).toLocaleString()}
                                      </span>
                                    </p>
                                    {ticket.resolved_at && (
                                      <p>
                                        <span className="text-gray-400">
                                          Resolved:
                                        </span>{" "}
                                        <span className="text-white">
                                          {new Date(
                                            ticket.resolved_at
                                          ).toLocaleString()}
                                        </span>
                                      </p>
                                    )}
                                    {ticket.assigned_to && (
                                      <p>
                                        <span className="text-gray-400">
                                          Assigned to:
                                        </span>{" "}
                                        <span className="text-white">
                                          {ticket.assigned_to}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="lg:col-span-2">
                                  <h4 className="text-white font-medium mb-3">
                                    Description
                                  </h4>
                                  <div className="bg-gray-900 rounded p-3">
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                      {ticket.description}
                                    </p>
                                  </div>

                                  {ticket.internal_notes && (
                                    <div className="mt-3">
                                      <h5 className="text-yellow-400 font-medium mb-2">
                                        Internal Notes
                                      </h5>
                                      <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3">
                                        <p className="text-yellow-300 text-sm">
                                          {ticket.internal_notes}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {ticket.resolution_notes && (
                                    <div className="mt-3">
                                      <h5 className="text-green-400 font-medium mb-2">
                                        Resolution Notes
                                      </h5>
                                      <div className="bg-green-900/20 border border-green-800 rounded p-3">
                                        <p className="text-green-300 text-sm">
                                          {ticket.resolution_notes}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playlist Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Target className="w-5 h-5 mr-2 text-pink-400" />
                    Playlist Campaigns ({playlistCampaigns.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPlaylistCampaigns}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playlistCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-white font-medium">
                              {campaign.releases?.title || "Unknown Release"}
                            </span>
                            <Badge
                              className={
                                campaign.status === "completed"
                                  ? "bg-green-600"
                                  : campaign.status === "in_progress"
                                    ? "bg-blue-600"
                                    : campaign.status === "cancelled"
                                      ? "bg-gray-600"
                                      : "bg-yellow-600"
                              }
                            >
                              {campaign.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-pink-400 border-pink-400"
                            >
                              {campaign.plan_type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-gray-300 text-sm space-y-1">
                            <div>
                              Artist:{" "}
                              {campaign.releases?.artist_name || "Unknown"}
                            </div>
                            <div>User: {campaign.profiles?.full_name}</div>
                            <div>Price: ${campaign.plan_price}</div>
                            <div>
                              Created:{" "}
                              {new Date(
                                campaign.created_at
                              ).toLocaleDateString()}
                            </div>
                            {campaign.started_at && (
                              <div>
                                Started:{" "}
                                {new Date(
                                  campaign.started_at
                                ).toLocaleDateString()}
                              </div>
                            )}
                            {campaign.completed_at && (
                              <div>
                                Completed:{" "}
                                {new Date(
                                  campaign.completed_at
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        {campaign.status === "paid" && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              await fetch("/api/admin/playlist-campaigns", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  id: campaign.id,
                                  action: "start",
                                }),
                              });
                              toast.success("Campaign started");
                              fetchPlaylistCampaigns();
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start Campaign
                          </Button>
                        )}
                        {campaign.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              const placements = prompt(
                                "Enter number of playlist placements:"
                              );
                              const streams = prompt("Enter streams gained:");
                              await fetch("/api/admin/playlist-campaigns", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  id: campaign.id,
                                  action: "complete",
                                  data: {
                                    playlist_placements: placements
                                      ? parseInt(placements)
                                      : 0,
                                    streams_gained: streams
                                      ? parseInt(streams)
                                      : 0,
                                  },
                                }),
                              });
                              toast.success("Campaign completed");
                              fetchPlaylistCampaigns();
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {playlistCampaigns.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No playlist campaigns found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="upload" className="mt-6">
            <AdminBeatUpload onUploadComplete={handleUploadComplete} />
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <AdminBeatManagement />
          </TabsContent>

          {/* Mastering Jobs Tab */}
          <TabsContent value="mastering" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                    Mastering Jobs ({masteringJobs.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMasteringJobs}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {masteringJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-white font-medium">
                              {job.title}
                            </span>
                            <Badge
                              className={
                                job.status === "completed"
                                  ? "bg-green-600"
                                  : job.status === "processing"
                                    ? "bg-blue-600"
                                    : job.status === "failed"
                                      ? "bg-red-600"
                                      : "bg-yellow-600"
                              }
                            >
                              {job.status}
                            </Badge>
                            {job.admin_review_status !== "none" && (
                              <Badge
                                variant="outline"
                                className="text-orange-400 border-orange-400"
                              >
                                {job.admin_review_status}
                              </Badge>
                            )}
                          </div>
                          <div className="text-gray-300 text-sm space-y-1">
                            <div>User: {job.profiles?.full_name}</div>
                            <div>
                              Created:{" "}
                              {new Date(job.created_at).toLocaleDateString()}
                            </div>
                            {job.api_cost && (
                              <div>API Cost: ${job.api_cost.toFixed(2)}</div>
                            )}
                          </div>
                          {job.admin_notes && (
                            <div className="mt-3 p-3 bg-gray-900 rounded">
                              <p className="text-gray-400 text-xs">
                                Admin Notes: {job.admin_notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {job.status === "failed" && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                const reason = prompt("Refund reason:");
                                const amount = prompt("Refund amount ($):");
                                await fetch("/api/admin/mastering-jobs", {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: job.id,
                                    action: "refund",
                                    data: {
                                      refund_reason: reason,
                                      refund_amount: parseFloat(amount || "0"),
                                    },
                                  }),
                                });
                                toast.success("Refund processed");
                                fetchMasteringJobs();
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {masteringJobs.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No mastering jobs found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forum Moderation Tab */}
          <TabsContent value="forum-mod" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Flag className="w-5 h-5 mr-2 text-red-400" />
                    Forum Content Flags ({forumFlags.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchForumFlags}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forumFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge className="bg-red-600">
                              {flag.content_type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-orange-400 border-orange-400"
                            >
                              {flag.flag_reason}
                            </Badge>
                            <Badge
                              className={
                                flag.status === "actioned"
                                  ? "bg-green-600"
                                  : flag.status === "dismissed"
                                    ? "bg-gray-600"
                                    : "bg-yellow-600"
                              }
                            >
                              {flag.status}
                            </Badge>
                          </div>
                          <div className="text-gray-300 text-sm space-y-1">
                            <div>Reporter: {flag.reporter?.full_name}</div>
                            <div>
                              Reported:{" "}
                              {new Date(flag.created_at).toLocaleDateString()}
                            </div>
                            {flag.description && (
                              <div className="mt-2 italic">
                                "{flag.description}"
                              </div>
                            )}
                          </div>
                        </div>
                        {flag.status === "pending" && (
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={async () => {
                                const notes = prompt("Admin notes (optional):");
                                await fetch("/api/admin/forum-moderation", {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: flag.id,
                                    action: "action",
                                    admin_notes: notes,
                                    admin_action: "removed",
                                  }),
                                });
                                toast.success("Content removed");
                                fetchForumFlags();
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await fetch("/api/admin/forum-moderation", {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: flag.id,
                                    action: "dismiss",
                                  }),
                                });
                                toast.success("Flag dismissed");
                                fetchForumFlags();
                              }}
                              className="border-gray-600 text-gray-300"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {forumFlags.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No content flags found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Dashboard Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        Total Revenue (30d)
                      </p>
                      <p className="text-3xl font-bold text-white">
                        ${(financialStats?.stats?.totalRevenue || 0).toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        Platform Fees (30d)
                      </p>
                      <p className="text-3xl font-bold text-white">
                        $
                        {(
                          financialStats?.stats?.totalPlatformFees || 0
                        ).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        Transactions (30d)
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {financialStats?.stats?.totalTransactions || 0}
                      </p>
                    </div>
                    <Activity className="w-10 h-10 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Revenue by Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Beat Sales</p>
                    <p className="text-white text-xl font-bold">
                      $
                      {(
                        financialStats?.stats?.byServiceCategory
                          ?.beat_purchase || 0
                      ).toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">
                      Playlist Campaigns
                    </p>
                    <p className="text-white text-xl font-bold">
                      $
                      {(
                        financialStats?.stats?.byServiceCategory
                          ?.playlist_campaign || 0
                      ).toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Mastering</p>
                    <p className="text-white text-xl font-bold">
                      $
                      {(
                        financialStats?.stats?.byServiceCategory?.mastering || 0
                      ).toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Promo Services</p>
                    <p className="text-white text-xl font-bold">
                      $
                      {(
                        financialStats?.stats?.byServiceCategory
                          ?.promo_services || 0
                      ).toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Other</p>
                    <p className="text-white text-xl font-bold">
                      $
                      {(
                        financialStats?.stats?.byServiceCategory?.other || 0
                      ).toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-yellow-400" />
                  Send Notification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Select User
                    </label>
                    <Select
                      value={notificationForm.user_id}
                      onValueChange={(value) =>
                        setNotificationForm({
                          ...notificationForm,
                          user_id: value,
                        })
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Choose a user..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px] overflow-y-auto">
                        {users.map((user) => (
                          <SelectItem
                            key={user.id}
                            value={user.id}
                            className="text-white hover:bg-gray-700"
                          >
                            <div className="flex flex-col">
                              <span>{user.full_name || user.email}</span>
                              <span className="text-xs text-gray-400">
                                {user.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {users.length} users available
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Title
                    </label>
                    <Input
                      placeholder="Notification title"
                      value={notificationForm.title}
                      onChange={(e) =>
                        setNotificationForm({
                          ...notificationForm,
                          title: e.target.value,
                        })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Message
                    </label>
                    <Textarea
                      placeholder="Notification message"
                      value={notificationForm.message}
                      onChange={(e) =>
                        setNotificationForm({
                          ...notificationForm,
                          message: e.target.value,
                        })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Type
                    </label>
                    <Select
                      value={notificationForm.type}
                      onValueChange={(value: any) =>
                        setNotificationForm({
                          ...notificationForm,
                          type: value,
                        })
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="release">Release</SelectItem>
                        <SelectItem value="payout">Payout</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={sendNotification}
                    disabled={sendingNotification}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingNotification ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ImprovedAdminNav>
       

      {/* Rejection Reason Modal */}
      <Dialog
        open={rejectionModal.open}
        onOpenChange={(open) => setRejectionModal({ ...rejectionModal, open })}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Reject Release: {rejectionModal.releaseTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Reason for Rejection *
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejecting this release..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {rejectionReason.length}/500 characters
              </p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3">
              <p className="text-yellow-300 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                The user will receive a notification with this rejection reason.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionModal({
                  open: false,
                  releaseId: "",
                  releaseTitle: "",
                });
                setRejectionReason("");
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectWithReason}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rejection Reason Modal */}
      <Dialog
        open={editRejectionModal.open}
        onOpenChange={(open) =>
          setEditRejectionModal({ ...editRejectionModal, open })
        }
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Reject Edit Request: {editRejectionModal.releaseTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Reason for Rejection *
              </label>
              <Textarea
                value={editRejectionReason}
                onChange={(e) => setEditRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejecting this edit request..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {editRejectionReason.length}/500 characters
              </p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3">
              <p className="text-yellow-300 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                The user will receive a notification with this rejection reason.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditRejectionModal({
                  open: false,
                  editId: "",
                  releaseTitle: "",
                });
                setEditRejectionReason("");
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEditRejectWithReason}
              disabled={!editRejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
