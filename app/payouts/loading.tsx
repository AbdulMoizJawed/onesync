import CustomLoader from "@/components/ui/custom-loader"

export default function Loading() {
  return (
    <div className="flex h-screen bg-gray-950">
      <div className="w-16 bg-gray-900" /> {/* Sidebar placeholder */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-gray-900 border-b border-gray-800" /> {/* Header placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CustomLoader />
            <p className="text-gray-400 mt-4">Loading payouts...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
