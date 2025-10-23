"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth, supabase } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Search, MessageSquare, User, X, Paperclip, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

type Message = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  attachments?: any[]
  read: boolean
  created_at: string
  sender?: Profile
  recipient?: Profile
}

type Conversation = {
  user: Profile
  lastMessage: Message
  unreadCount: number
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = useCallback(async () => {
    if (!user || !supabase) return

    try {
      // Get all messages involving the user
      const { data: allMessages, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(id, username, full_name, avatar_url),
          recipient:profiles!direct_messages_recipient_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by conversation partner
      const convMap = new Map<string, Conversation>()
      
      allMessages?.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
        const partner = msg.sender_id === user.id ? msg.recipient : msg.sender
        
        if (!convMap.has(partnerId)) {
          const unreadCount = allMessages.filter(
            m => m.recipient_id === user.id && m.sender_id === partnerId && !m.read
          ).length

          convMap.set(partnerId, {
            user: partner,
            lastMessage: msg,
            unreadCount
          })
        }
      })

      setConversations(Array.from(convMap.values()))
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(id, username, full_name, avatar_url),
          recipient:profiles!direct_messages_recipient_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
      
      // Mark messages as read
      const unreadIds = data?.filter(m => m.recipient_id === user.id && !m.read).map(m => m.id) || []
      if (unreadIds.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ read: true })
          .in('id', unreadIds)
        
        fetchConversations() // Refresh unread counts
      }

      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    }
  }, [user, fetchConversations])

  const sendMessage = async () => {
    if (!user || !supabase || !selectedConversation || !newMessage.trim()) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation.id,
          content: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage("")
      await fetchMessages(selectedConversation.id)
      await fetchConversations()
      toast.success('Message sent!')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  const getDisplayName = (profile: Profile) => {
    return profile.username || profile.full_name || `user_${profile.id.substring(0, 8)}`
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const name = getDisplayName(conv.user).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden bg-gray-950">
            <div className="h-full flex">
              {/* Conversations List - Hidden on mobile when conversation is selected */}
              <div className={`w-full md:w-80 lg:w-96 border-r border-gray-800 flex flex-col bg-gray-900/50 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-3 md:p-4 border-b border-gray-800">
                  <h1 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Messages</h1>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white text-sm md:text-base"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="p-4 text-center text-gray-400">Loading...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-6 md:p-8 text-center">
                      <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-3 md:mb-4" />
                      <p className="text-gray-400 text-sm md:text-base">No conversations yet</p>
                      <p className="text-xs md:text-sm text-gray-500 mt-2">
                        Visit the forum to start chatting with other users!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.user.id}
                          onClick={() => setSelectedConversation(conv.user)}
                          className={`w-full p-3 md:p-4 text-left hover:bg-gray-800/50 transition-colors ${
                            selectedConversation?.id === conv.user.id ? 'bg-gray-800' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2 md:gap-3">
                            <Avatar className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                              <AvatarImage src={conv.user.avatar_url || ''} />
                              <AvatarFallback className="bg-purple-600 text-white text-sm md:text-base">
                                {getDisplayName(conv.user)[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-white truncate text-sm md:text-base">
                                  {getDisplayName(conv.user)}
                                </span>
                                {conv.unreadCount > 0 && (
                                  <Badge className="bg-purple-600 text-white text-xs flex-shrink-0 ml-2">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-gray-400 truncate">
                                {conv.lastMessage.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area - Full width on mobile when conversation is selected */}
              <div className={`flex-1 flex flex-col bg-gray-950 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 md:p-4 border-b border-gray-800 flex items-center gap-2 md:gap-3 bg-gray-900/50">
                      {/* Back button - only visible on mobile */}
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-white" />
                      </button>
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                        <AvatarImage src={selectedConversation.avatar_url || ''} />
                        <AvatarFallback className="bg-purple-600 text-white text-xs md:text-sm">
                          {getDisplayName(selectedConversation)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${selectedConversation.username || selectedConversation.id}`}>
                          <h2 className="font-semibold text-white hover:text-purple-400 transition-colors truncate text-sm md:text-base">
                            {getDisplayName(selectedConversation)}
                          </h2>
                        </Link>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-3 md:p-4">
                      <div className="space-y-3 md:space-y-4 max-w-4xl mx-auto">
                        {messages.map((msg) => {
                          const isOwn = msg.sender_id === user?.id
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex gap-1.5 md:gap-2 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isOwn && (
                                  <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                                    <AvatarImage src={selectedConversation.avatar_url || ''} />
                                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                                      {getDisplayName(selectedConversation)[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className={`space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                  <div
                                    className={`rounded-2xl px-3 py-2 md:px-4 md:py-2 break-words ${
                                      isOwn
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-100'
                                    }`}
                                  >
                                    <p className="text-xs md:text-sm whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                  <span className="text-[10px] md:text-xs text-gray-500 px-1 md:px-2">
                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-3 md:p-4 border-t border-gray-800 bg-gray-900/50">
                      <div className="max-w-4xl mx-auto">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            sendMessage()
                          }}
                          className="flex gap-2"
                        >
                          <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-800 border-gray-700 text-white resize-none min-h-[48px] md:min-h-[60px] max-h-[120px] text-sm md:text-base"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                              }
                            }}
                          />
                          <Button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-auto px-3 md:px-4"
                          >
                            <Send className="w-4 h-4 md:w-5 md:h-5" />
                          </Button>
                        </form>
                        <p className="text-[10px] md:text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 md:w-20 md:h-20 text-gray-600 mx-auto mb-3 md:mb-4" />
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Your Messages</h2>
                      <p className="text-sm md:text-base text-gray-400 mb-4">
                        Select a conversation to start chatting
                      </p>
                      <Link href="/forum">
                        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm md:text-base">
                          Go to Forum
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}