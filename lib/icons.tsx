import {
  // Core navigation - more sophisticated alternatives
  LayoutDashboard,
  Disc3,
  CloudUpload,
  Sparkles,
  TrendingUp,
  Search,
  Radio,
  Users2,
  AudioWaveform,
  Globe2,
  Wallet,
  MessageCircle,
  Settings2,
  // Support and utilities
  LifeBuoy,
  Menu,
  ChevronRight,
  // Action icons - more refined
  Plus,
  MoreHorizontal,
  Edit3,
  Trash2,
  Eye,
  Play,
  Pause,
  Volume2,
  Download,
  ExternalLink,
  Share2,
  Copy,
  Check,
  X,
  AlertTriangle,
  Info,
  Link2,
  // User and social
  UserCheck,
  UserPlus,
  Heart,
  Star,
  // Media and audio
  Music4,
  Headphones,
  Mic,
  Radio as RadioIcon,
  // Data and analytics
  BarChart4,
  LineChart,
  PieChart,
  Activity,
  // Communication
  Mail,
  Bell,
  Send,
  // System
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Lock,
  Unlock,
} from "lucide-react"

// Export a curated set of more sophisticated icons
export const icons = {
  // Navigation - Premium feel
  dashboard: LayoutDashboard,
  releases: Disc3,
  upload: CloudUpload,
  artistTools: Sparkles,
  link: Link2,
  analytics: TrendingUp,
  musicIntelligence: Search,
  beats: Radio,
  artists: Users2,
  mastering: AudioWaveform,
  sync: Globe2,
  payments: Wallet,
  forum: MessageCircle,
  settings: Settings2,
  support: LifeBuoy,
  
  // Interface elements
  menu: Menu,
  chevronRight: ChevronRight,
  
  // Actions - More refined
  add: Plus,
  more: MoreHorizontal,
  edit: Edit3,
  delete: Trash2,
  view: Eye,
  play: Play,
  pause: Pause,
  volume: Volume2,
  download: Download,
  external: ExternalLink,
  share: Share2,
  copy: Copy,
  
  // States
  check: Check,
  close: X,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
  refresh: RefreshCw,
  
  // User interactions
  like: Heart,
  star: Star,
  userAdd: UserPlus,
  userCheck: UserCheck,
  
  // Media
  music: Music4,
  headphones: Headphones,
  microphone: Mic,
  radio: RadioIcon,
  
  // Analytics - More sophisticated
  barChart: BarChart4,
  lineChart: LineChart,
  pieChart: PieChart,
  activity: Activity,
  
  // Communication
  mail: Mail,
  bell: Bell,
  send: Send,
  
  // System
  energy: Zap,
  shield: Shield,
  lock: Lock,
  unlock: Unlock,
}

// Icon component with consistent styling
export function Icon({ 
  name, 
  className = "h-4 w-4", 
  ...props 
}: { 
  name: keyof typeof icons
  className?: string
  [key: string]: any
}) {
  const IconComponent = icons[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  
  return <IconComponent className={className} {...props} />
}
