/**
 * Mobile Optimization Utilities
 * Contains responsive classes and mobile-first utilities for consistent mobile UX
 */

// Mobile-first breakpoints (matching Tailwind defaults)
export const breakpoints = {
  sm: '640px',    // Small devices (landscape phones)
  md: '768px',    // Medium devices (tablets)
  lg: '1024px',   // Large devices (laptops)
  xl: '1280px',   // Extra large devices (desktops)
  '2xl': '1536px' // 2X Extra large devices (large desktops)
}

// Mobile-optimized spacing classes
export const mobileSpacing = {
  // Padding: mobile-first approach
  padding: {
    page: 'p-3 sm:p-4 lg:p-6',           // Page container padding
    card: 'p-4 sm:p-6',                  // Card content padding
    section: 'p-3 sm:p-4',               // Section padding
    button: 'px-3 py-2 sm:px-4 sm:py-2', // Button padding
  },
  
  // Margins: mobile-first approach
  margin: {
    section: 'mb-4 sm:mb-6 lg:mb-8',     // Section bottom margin
    element: 'mb-3 sm:mb-4',             // Element bottom margin
    small: 'mb-2 sm:mb-3',               // Small element margin
  },
  
  // Gaps: mobile-first approach
  gap: {
    grid: 'gap-2 sm:gap-3 lg:gap-6',     // Grid gap
    flex: 'gap-3 sm:gap-4',              // Flex gap
    small: 'gap-2 sm:gap-3',             // Small gap
  }
}

// Mobile-optimized typography classes
export const mobileTypography = {
  heading: {
    h1: 'text-xl sm:text-2xl lg:text-3xl font-bold',
    h2: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    h3: 'text-base sm:text-lg lg:text-xl font-semibold',
    h4: 'text-sm sm:text-base lg:text-lg font-medium',
  },
  
  body: {
    large: 'text-sm sm:text-base lg:text-lg',
    normal: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm',
    caption: 'text-xs',
  },
  
  label: 'text-sm font-medium',
  button: 'text-sm sm:text-base font-medium',
}

// Mobile-optimized layout classes
export const mobileLayout = {
  // Grid systems
  grid: {
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    stats: 'grid grid-cols-2 lg:grid-cols-4',
    form: 'grid grid-cols-1 sm:grid-cols-2',
    auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  
  // Flex layouts
  flex: {
    responsive: 'flex flex-col sm:flex-row',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start',
    mobile_stack: 'flex flex-col sm:flex-row',
  },
  
  // Container widths
  container: {
    full: 'w-full',
    max: 'max-w-7xl mx-auto',
    content: 'max-w-4xl mx-auto',
    narrow: 'max-w-2xl mx-auto',
  }
}

// Mobile-optimized component sizes
export const mobileSizes = {
  // Icons
  icon: {
    small: 'w-4 h-4',
    normal: 'w-4 h-4 sm:w-5 sm:h-5',
    large: 'w-5 h-5 sm:w-6 sm:h-6',
    xlarge: 'w-6 h-6 sm:w-8 sm:h-8',
  },
  
  // Buttons
  button: {
    small: 'h-8 px-2 text-xs',
    normal: 'h-9 px-3 sm:h-10 sm:px-4',
    large: 'h-10 px-4 sm:h-11 sm:px-6',
  },
  
  // Images
  image: {
    avatar: 'w-8 h-8 sm:w-10 sm:h-10',
    thumbnail: 'w-12 h-12 sm:w-16 sm:h-16',
    card: 'w-full h-48 sm:h-64',
  },
  
  // Input fields
  input: {
    normal: 'h-9 sm:h-10',
    large: 'h-10 sm:h-11',
  }
}

// Mobile-optimized interaction classes
export const mobileInteraction = {
  // Touch targets (minimum 44px recommended)
  touch: {
    minimum: 'min-h-[44px] min-w-[44px]',
    button: 'h-11 px-4', // Ensures good touch target
    icon: 'p-2', // Adequate padding for icon buttons
  },
  
  // Hover states (disabled on touch devices)
  hover: {
    card: 'hover:bg-gray-800/50 transition-colors',
    button: 'hover:bg-gray-700 transition-colors',
    link: 'hover:text-blue-400 transition-colors',
  },
  
  // Focus states for accessibility
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900',
    border: 'focus:border-blue-500 focus:outline-none',
  }
}

// Mobile-optimized visibility classes
export const mobileVisibility = {
  // Show/hide at different breakpoints
  show: {
    mobile: 'block sm:hidden',
    tablet: 'hidden sm:block lg:hidden',
    desktop: 'hidden lg:block',
    mobile_tablet: 'block lg:hidden',
    tablet_desktop: 'hidden sm:block',
  },
  
  hide: {
    mobile: 'hidden sm:block',
    tablet: 'block sm:hidden lg:block',
    desktop: 'block lg:hidden',
    mobile_tablet: 'hidden lg:block',
    tablet_desktop: 'block sm:hidden',
  }
}

// Navigation specific mobile classes
export const mobileNavigation = {
  sidebar: {
    desktop: 'hidden md:flex fixed left-0 top-0 h-full w-64 bg-black/95 border-r border-white/10',
    mobile: 'md:hidden fixed top-4 left-4 z-50',
  },
  
  header: {
    container: 'flex items-center justify-between h-16 px-4 sm:px-6',
    title: 'text-lg sm:text-xl font-semibold truncate',
    actions: 'flex items-center gap-2 sm:gap-3',
  },
  
  tabs: {
    container: 'flex bg-gray-800/50 rounded-lg p-1',
    tab: 'flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors',
    mobile_text: 'hidden sm:inline',
    mobile_short: 'sm:hidden',
  }
}

// Form specific mobile classes
export const mobileForm = {
  field: {
    container: 'space-y-2',
    label: 'text-sm font-medium text-white',
    input: 'w-full h-10 px-3 rounded-md bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none',
    textarea: 'w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none',
    select: 'w-full h-10 px-3 rounded-md bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:outline-none',
  },
  
  layout: {
    single: 'space-y-4 sm:space-y-6',
    double: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    triple: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  },
  
  button: {
    primary: 'w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors',
    secondary: 'w-full h-11 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors',
    submit: 'w-full sm:w-auto h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors',
  }
}

// Utility function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Mobile-first media query helper
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

// Touch device detection
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Responsive text truncation
export const textTruncation = {
  single: 'truncate',
  double: 'line-clamp-2',
  triple: 'line-clamp-3',
  mobile_single: 'truncate sm:line-clamp-2',
  mobile_double: 'line-clamp-1 sm:line-clamp-2',
}

// Export commonly used combinations
export const commonMobileClasses = {
  pageContainer: cn(
    mobileLayout.container.max,
    mobileSpacing.padding.page,
    'min-h-screen bg-gray-950'
  ),
  
  cardGrid: cn(
    mobileLayout.grid.cards,
    mobileSpacing.gap.grid,
    mobileSpacing.margin.section
  ),
  
  mobileCard: cn(
    'bg-gray-900 border border-gray-800 rounded-lg',
    mobileSpacing.padding.card,
    mobileInteraction.hover.card
  ),
  
  mobileButton: cn(
    mobileForm.button.primary,
    mobileInteraction.touch.button,
    mobileInteraction.focus.ring
  ),
  
  mobileInput: cn(
    mobileForm.field.input,
    mobileInteraction.focus.border
  ),
  
  responsiveText: cn(
    mobileTypography.body.normal,
    'text-gray-300'
  ),
  
  responsiveHeading: cn(
    mobileTypography.heading.h1,
    'text-white'
  )
}

export default {
  breakpoints,
  mobileSpacing,
  mobileTypography,
  mobileLayout,
  mobileSizes,
  mobileInteraction,
  mobileVisibility,
  mobileNavigation,
  mobileForm,
  textTruncation,
  commonMobileClasses,
  cn,
  isMobile,
  isTouchDevice
}
