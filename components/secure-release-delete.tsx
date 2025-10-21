"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trash2, AlertTriangle } from "lucide-react"

interface SecureReleaseDeleteProps {
  releaseId: string
  releaseTitle: string
  onRequestSubmitted?: () => void
}

export function SecureReleaseDelete({ 
  releaseId, 
  releaseTitle, 
  onRequestSubmitted 
}: SecureReleaseDeleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for deletion')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/releases/delete-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          releaseId,
          reason: reason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deletion request')
      }

      toast.success('Deletion request submitted successfully')
      toast.info('Your request will be reviewed by our team within 24-48 hours')
      
      setReason('')
      setIsOpen(false)
      onRequestSubmitted?.()
      
    } catch (error) {
      console.error('Delete request error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit deletion request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Request Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Request Release Deletion
          </DialogTitle>
          <DialogDescription>
            Submit a request to delete <strong>"{releaseTitle}"</strong>. This request will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for deletion *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you want to delete this release..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] mt-1"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/500 characters
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <strong>Important:</strong> This is a request-based system for security. 
                Direct deletions are not allowed. Our team will review your request and 
                respond within 24-48 hours.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmitRequest}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
