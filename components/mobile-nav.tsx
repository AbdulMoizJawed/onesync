"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { icons } from "@/lib/icons"
import { X, Settings, BarChart3, Users, Music, Headphones, CreditCard, MessageCircle, HelpCircle } from "lucide-react"

const primaryNav = [
  { name: "Home", href: "/", icon: icons.dashboard },
  { name: "Upload", href: "/upload", icon: icons.upload },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Forum", href: "/forum", icon: icons.forum },
]

const morePages = [
  { name: "Releases", href: "/releases", icon: Music },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Artists", href: "/artists", icon: Users },
  { name: "Artist Tools", href: "/artist-tools", icon: Music },
  { name: "Beats", href: "/beats", icon: Headphones },
  { name: "Mastering", href: "/mastering", icon: Music },
  { name: "Sync", href: "/sync", icon: Music },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Industry Stats", href: "/industry-stats", icon: BarChart3 },
  { name: "Support", href: "/support", icon: HelpCircle },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const isMorePageActive = morePages.some(page => pathname === page.href || (page.href !== "/" && pathname.startsWith(page.href)))

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setShowMoreMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">More Options</h3>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3">
              {morePages.map((page) => {
                const isActive = pathname === page.href || (page.href !== "/" && pathname.startsWith(page.href))
                return (
                  <Link
                    key={page.name}
                    href={page.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "text-indigo-400 bg-indigo-500/15"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                    )}
                  >
                    <page.icon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {page.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-gray-700/50 bg-gray-950/98 backdrop-blur-xl shadow-2xl shadow-black/50">
        <div className="flex items-center justify-around px-1 py-2.5 safe-area-inset-bottom">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-0 px-3 py-2 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-indigo-400 bg-indigo-500/15 scale-105 shadow-lg shadow-indigo-500/20"
                    : "text-gray-400 hover:text-gray-200 active:bg-gray-800/50 hover:scale-105"
                )}
              >
                <item.icon className={cn("h-6 w-6 mb-1 transition-transform duration-200", isActive && "scale-110")} />
                <span className={cn(
                  "text-[10px] font-medium truncate w-full text-center transition-all duration-200",
                  isActive && "font-semibold text-indigo-300"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
          
          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={cn(
              "flex flex-col items-center justify-center min-w-0 px-3 py-2 rounded-xl transition-all duration-200",
              isMorePageActive
                ? "text-indigo-400 bg-indigo-500/15 scale-105 shadow-lg shadow-indigo-500/20"
                : "text-gray-400 hover:text-gray-200 active:bg-gray-800/50 hover:scale-105"
            )}
          >
            <icons.menu className={cn("h-6 w-6 mb-1 transition-transform duration-200", isMorePageActive && "scale-110")} />
            <span className={cn(
              "text-[10px] font-medium truncate w-full text-center transition-all duration-200",
              isMorePageActive && "font-semibold text-indigo-300"
            )}>
              More
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
