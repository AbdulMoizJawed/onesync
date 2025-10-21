import {
  Home,
  Upload,
  BarChart3,
  Users,
  Music,
  Headphones,
  RefreshCw,
  CreditCard,
  MessageCircle,
  Settings,
  HelpCircle,
  ChevronRight,
  X,
  Menu,
  Mic,
  TrendingUp,
  Disc,
  Palette,
  Zap
} from "lucide-react"

export const icons = {
  dashboard: Home,
  releases: Disc,
  upload: Upload,
  artistTools: Palette,
  analytics: TrendingUp,
  barChart: BarChart3,
  beats: Headphones,
  artists: Users,
  mastering: Zap,
  sync: RefreshCw,
  payments: CreditCard,
  forum: MessageCircle,
  settings: Settings,
  support: HelpCircle,
  chevronRight: ChevronRight,
  close: X,
  menu: Menu,
  mic: Mic,
  music: Music,
  users: Users,
  trending: TrendingUp
}

export type IconName = keyof typeof icons