"use client"

import CustomLoader from "@/components/ui/custom-loader"

export function AuthLoading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <CustomLoader size="lg" />
        <p className="text-gray-400 animate-pulse">Checking authentication...</p>
      </div>
    </div>
  )
}
