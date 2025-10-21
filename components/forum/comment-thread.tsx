"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, ThumbsDown, Reply, Send } from "lucide-react"
import { Profile, getDisplayName } from "@/lib/utils"

type ForumComment = {
  id: string
  post_id: string
  parent_comment_id: string | null // Fixed: changed from parent_id to parent_comment_id
  content: string
  author_id: string
  created_at: string
  updated_at: string
  vote_count?: number
  is_deleted?: boolean
  author: Profile | null
  replies?: ForumComment[]
}

interface CommentThreadProps {
  comment: ForumComment
  onReply?: (parentId: string, content: string) => Promise<void>
  onVote?: (commentId: string, voteType: "up" | "down") => Promise<void>
  currentUserId?: string
  canReply?: boolean
  depth?: number
}

export function CommentThread({
  comment,
  onReply,
  onVote,
  currentUserId,
  canReply = false,
  depth = 0,
}: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }



  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onReply || !replyContent.trim()) return

    setSubmitting(true)
    try {
      await onReply(comment.id, replyContent.trim())
      setReplyContent("")
      setShowReplyForm(false)
    } catch (error) {
      console.error("Error posting reply:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (voteType: "up" | "down") => {
    if (!onVote) return
    try {
      await onVote(comment.id, voteType)
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  if (comment.is_deleted) {
    return (
      <div className={`${depth > 0 ? "ml-8" : ""} py-2`}>
        <div className="text-gray-500 italic text-sm">This comment has been deleted</div>
      </div>
    )
  }

  return (
    <div className={`${depth > 0 ? "ml-8 border-l border-gray-700 pl-4" : ""} space-y-3`}>
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.author?.avatar_url || ""} />
          <AvatarFallback className="bg-purple-600 text-white">
            {getDisplayName(comment.author)[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-purple-400">@{getDisplayName(comment.author)}</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
          </div>
          <p className="text-gray-300 text-sm whitespace-pre-wrap mb-2">
            {comment.content?.replace(/<[^>]*>/g, '') || ''}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("up")}
              className="text-gray-400 hover:text-green-400 h-6 px-2"
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              {comment.vote_count || 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("down")}
              className="text-gray-400 hover:text-red-400 h-6 px-2"
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
            {canReply && depth < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-gray-300 hover:text-blue-400 h-6 px-2 font-medium"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>

      {showReplyForm && (
        <form onSubmit={handleReply} className="ml-11 space-y-3">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            className="input-dark min-h-[80px] resize-y"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{replyContent.length}/1000 characters</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyForm(false)
                  setReplyContent("")
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !replyContent.trim()} size="sm" className="button-primary">
                {submitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onVote={onVote}
              currentUserId={currentUserId}
              canReply={canReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
