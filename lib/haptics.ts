"use client"

import { useCallback } from "react"

// Haptic feedback utilities for mobile devices
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if (typeof window !== "undefined" && "navigator" in window) {
      // Check if vibration is supported
      if ("vibrate" in navigator) {
        navigator.vibrate(pattern)
      }
    }
  }, [])

  const success = useCallback(() => {
    vibrate([50, 50, 50])
  }, [vibrate])

  const error = useCallback(() => {
    vibrate([100, 50, 100])
  }, [vibrate])

  const light = useCallback(() => {
    vibrate(20)
  }, [vibrate])

  const medium = useCallback(() => {
    vibrate(50)
  }, [vibrate])

  const heavy = useCallback(() => {
    vibrate(100)
  }, [vibrate])

  const buttonPress = useCallback(() => {
    vibrate(30)
  }, [vibrate])

  const impact = useCallback(() => {
    vibrate(80)
  }, [vibrate])

  return {
    vibrate,
    success,
    error,
    light,
    medium,
    heavy,
    buttonPress,
    impact,
  }
}
