import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <CardTitle className="text-2xl text-white font-montserrat">Page Not Found</CardTitle>
          <p className="text-gray-400 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full button-primary">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
              <Link href="javascript:history.back()">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Link>
            </Button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Need help? Check out our{" "}
              <Link href="/help" className="text-blue-400 hover:text-blue-300">
                help center
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
