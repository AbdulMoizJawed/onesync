import CustomLoader from "@/components/ui/custom-loader"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
      <CustomLoader 
        size="xl" 
        text="Loading Releases..." 
        showText={true}
        className="text-center"
      />
    </div>
  )
}
