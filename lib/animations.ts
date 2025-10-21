// Animation classes for smooth transitions
export const animations = {
  // Page transitions
  pageFadeIn: "animate-in fade-in duration-500",
  slideInFromLeft: "animate-in slide-in-from-left-4 duration-300",
  slideInFromRight: "animate-in slide-in-from-right-4 duration-300",
  slideInFromTop: "animate-in slide-in-from-top-4 duration-300",
  slideInFromBottom: "animate-in slide-in-from-bottom-4 duration-300",
  slideInTop: "animate-in slide-in-from-top-4 duration-300",
  slideInLeft: "animate-in slide-in-from-left-4 duration-300",
  slideInRight: "animate-in slide-in-from-right-4 duration-300",
  
  // Component animations
  scaleIn: "animate-in zoom-in-95 duration-200",
  fadeInUp: "animate-in fade-in slide-in-from-bottom-4 duration-300",
  fadeInDown: "animate-in fade-in slide-in-from-top-4 duration-300",
  cardSlideUp: "animate-in slide-in-from-bottom-4 duration-500",
  dissolveIn: "animate-in fade-in duration-500",
  swipeInLeft: "animate-in slide-in-from-left-8 duration-300",
  swipeInRight: "animate-in slide-in-from-right-8 duration-300",
  
  // Hover effects
  hoverScale: "transition-transform duration-200 hover:scale-105",
  hoverFade: "transition-opacity duration-200 hover:opacity-80",
  
  // Loading states
  pulse: "animate-pulse",
  spin: "animate-spin",
  bounce: "animate-bounce",
  
  // Modal/Dialog animations
  modalBackdrop: "animate-in fade-in duration-200",
  modalContent: "animate-in fade-in zoom-in-95 duration-200",
  
  // Button animations
  buttonPress: "transition-all duration-100 active:scale-95",
  buttonHover: "transition-all duration-200 hover:scale-105 hover:shadow-lg",
  
  // Stagger delay function
  staggerDelay: (index: number) => `delay-${index * 100}`,
}

// Button interaction animations
export const buttonInteractions = {
  hover: "hover:scale-105 hover:shadow-lg transition-all duration-200",
  press: "active:scale-95 transition-all duration-100",
  focus: "focus:ring-2 focus:ring-primary focus:ring-offset-2",
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  default: "transition-all duration-200 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-primary focus:ring-offset-2",
}
