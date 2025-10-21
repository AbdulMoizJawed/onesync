"use client"

import React from 'react'
import {
  // Navigation & UI
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  LogOut,
  Search,
  Settings,
  Bell,
  User,
  Home,
  Zap,
  
  // Music & Media
  Music,
  Music2,
  Music3,
  Music4,
  Disc3,
  Radio,
  Headphones,
  Mic,
  MicVocal,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  HandHeart,
  
  // Content & Creation
  Plus,
  PlusCircle,
  Upload,
  Download,
  FileMusic,
  Folder,
  Image,
  Film,
  Camera,
  Edit,
  Edit2,
  Edit3,
  Trash2,
  Copy,
  Share,
  
  // Analytics & Data
  BarChart,
  BarChart2,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  
  // Social & Communication
  Users,
  UserPlus,
  MessageCircle,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  
  // Business & Finance
  DollarSign,
  CreditCard,
  Receipt,
  Wallet,
  Banknote,
  TrendingUp as Growth,
  
  // More options
  MoreHorizontal,
  MoreVertical,
  
  // Status & Alerts
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  
  // Utility
  RefreshCw,
  Loader2,
  Star,
  Bookmark,
  Flag,
  Lock,
  Unlock,
  Shield,
  Key,
  
  // Navigation specific
  Compass,
  Map,
  Navigation,
  
} from 'lucide-react'

export interface IconProps {
  className?: string
  size?: number
  strokeWidth?: number
}

// Icon mapping for consistent usage
export const icons = {
  // Navigation & UI
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  logout: LogOut,
  search: Search,
  settings: Settings,
  notifications: Bell,
  user: User,
  home: Home,
  dashboard: Zap,
  
  // Music & Media - using cooler alternatives
  music: Music2,         // More sophisticated than basic Music
  album: Disc3,          // Better than basic circle
  radio: Radio,
  headphones: Headphones,
  microphone: MicVocal,  // More professional than basic Mic
  volume: Volume2,
  mute: VolumeX,
  play: Play,
  pause: Pause,
  previous: SkipBack,
  next: SkipForward,
  shuffle: Shuffle,
  repeat: Repeat,
  favorite: Heart,
  collaboration: HandHeart,
  
  // Content & Creation
  add: Plus,
  addCircle: PlusCircle,
  upload: Upload,
  download: Download,
  musicFile: FileMusic,
  musicFolder: Folder,
  image: Image,
  video: Film,
  camera: Camera,
  edit: Edit2,           // More refined than basic Edit
  delete: Trash2,
  copy: Copy,
  share: Share,
  
  // Analytics & Data - using more sophisticated variants
  barChart: BarChart3,   // More detailed than basic BarChart
  lineChart: LineChart,
  pieChart: PieChart,
  trending: TrendingUp,
  decline: TrendingDown,
  activity: Activity,
  target: Target,
  view: Eye,
  hide: EyeOff,
  calendar: Calendar,
  time: Clock,
  
  // Social & Communication
  users: Users,
  addUser: UserPlus,
  chat: MessageCircle,
  message: MessageSquare,
  email: Mail,
  phone: Phone,
  website: Globe,
  
  // Business & Finance
  dollar: DollarSign,
  card: CreditCard,
  receipt: Receipt,
  wallet: Wallet,
  money: Banknote,
  growth: Growth,
  
  // More options
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  
  // Status & Alerts
  check: Check,
  checkCircle: CheckCircle,
  alert: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  error: XCircle,
  
  // Utility
  refresh: RefreshCw,
  loading: Loader2,
  star: Star,
  bookmark: Bookmark,
  flag: Flag,
  lock: Lock,
  unlock: Unlock,
  shield: Shield,
  key: Key,
  
  // Navigation specific
  compass: Compass,
  map: Map,
  navigation: Navigation,
} as const

export type IconName = keyof typeof icons

interface IconComponentProps extends IconProps {
  name: IconName
}

export const IconComponent: React.FC<IconComponentProps> = ({ 
  name, 
  className = "", 
  size = 20, 
  strokeWidth = 1.5 
}) => {
  const IconElement = icons[name]
  
  if (!IconElement) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  
  return (
    <IconElement 
      className={className} 
      size={size} 
      strokeWidth={strokeWidth}
    />
  )
}

// Export specific icons for direct usage (maintaining backward compatibility)
export const {
  menu: MenuIcon,
  close: CloseIcon,
  search: SearchIcon,
  music: MusicIcon,
  album: AlbumIcon,
  play: PlayIcon,
  pause: PauseIcon,
  add: AddIcon,
  addCircle: AddCircleIcon,
  upload: UploadIcon,
  edit: EditIcon,
  delete: DeleteIcon,
  barChart: BarChartIcon,
  trending: TrendingIcon,
  view: ViewIcon,
  users: UsersIcon,
  settings: SettingsIcon,
  moreHorizontal: MoreHorizontalIcon,
  volume: VolumeIcon,
} = icons
