export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  username?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
}

export type PostWithProfile = {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string | null
  vote_count: number
  comment_count: number
  user_id: string
  is_pinned?: boolean
  profiles: Profile | null
}

export type CommentWithProfile = {
  id: string
  content: string
  created_at: string
  updated_at: string | null
  user_id: string
  post_id: string
  parent_comment_id: string | null
  vote_count: number
  reply_count: number
  is_edited: boolean
  edited_at: string | null
  profiles: Profile | null
}

export type CommentWithChildren = CommentWithProfile & {
  children: CommentWithChildren[]
}

export type MessageThread = {
  id: string
  title: string
  created_by: string
  created_at: string
  updated_at: string
  participants: Profile[]
  last_message?: ThreadMessage
}

export type ThreadMessage = {
  id: string
  thread_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  profiles: Profile | null
}

export type DirectMessage = {
  id: string
  sender_id: string
  recipient_id: string
  subject: string | null
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
  profiles: Profile | null
}

export type CommentReaction = {
  id: string
  comment_id: string
  user_id: string
  reaction_type: "like" | "dislike" | "love" | "laugh" | "angry" | "sad"
  created_at: string
}

export type CommentVote = {
  id: string
  comment_id: string
  user_id: string
  vote_type: -1 | 0 | 1
  created_at: string
  updated_at: string
}

export type DraftRelease = {
  id: string
  user_id: string
  title: string | null
  artist_name: string | null
  genre: string | null
  release_date: string | null
  description: string | null
  cover_art_url: string | null
  audio_url: string | null
  tracks: any[] | null
  platforms: string[] | null
  metadata: any | null
  created_at: string
  updated_at: string
  last_saved_at: string
}

export type ReleaseEdit = {
  id: string
  user_id: string
  release_id: string
  edit_type: 'update' | 'takedown' | 'resubmit'
  changes: any
  status: 'pending' | 'approved' | 'rejected'
  reason: string | null
  admin_notes: string | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}
