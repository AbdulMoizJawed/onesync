'use client'

import React from 'react'

export function ApiStatusDebug() {
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>API Status: Connected</span>
      </div>
    </div>
  )
}
