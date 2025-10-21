import Image from "next/image"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface CustomLoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
  showText?: boolean
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 80, height: 80 }
}

export default function CustomLoader({ 
  size = "md", 
  className, 
  text,
  showText = false 
}: CustomLoaderProps) {
  const { width, height } = sizeMap[size]

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <Image
          src="/loaders/custom-loader.png"
          alt="Loading..."
          width={width}
          height={height}
          className="animate-spin" 
          style={{ animationDuration: '2s' }}
          priority
        />
      </div>
      {showText && text && (
        <p className="text-gray-400 text-sm">{text}</p>
      )}
    </div>
  )
}
