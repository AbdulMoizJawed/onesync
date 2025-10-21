"use client"

import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { EditRelease } from "@/components/edit-release"
import { animations } from "@/lib/animations"

export default function EditReleasePage() {
  const { id } = useParams()
  const router = useRouter()

  const handleCancel = () => {
    router.push(`/releases/${id}`)
  }

  const handleUpdate = () => {
    router.push(`/releases/${id}`)
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6 ${animations.pageFadeIn}`}>
            <div className="max-w-7xl mx-auto">
              <EditRelease
                releaseId={id as string}
                onCancel={handleCancel}
                onUpdate={handleUpdate}
              />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
