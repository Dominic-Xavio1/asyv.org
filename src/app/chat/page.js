"use client"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useTheme } from '@/lib/theme'
import { io } from "socket.io-client"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import toast from "react-hot-toast"
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Smile,
  ImageIcon,
  MessageSquare,
  FileText,
  Mic,
  Film,
  ArrowLeft,
  X,
  Users,
  Plus,
  Loader2,
} from "lucide-react"
import ComboboxPopover from "./combobox"
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(
  () => import('@/components/emojiPicker'),
  { ssr: false }
);

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [socket, setSocket] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [messageInput, setMessageInput] = useState("")
  const [showConversation, setShowConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isLoadingOnlineUsers, setIsLoadingOnlineUsers] = useState(false)
  const { theme } = useTheme()
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  
  // Refs for scroll behavior
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  
  const today = new Date();
  const formatted = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const result = `Today, ${formatted}`;

  const formatTime = (dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (Number.isNaN(date.getTime())) return ""
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const mapConversationToChat = useCallback(
    (conversation) => {
      if (!conversation || !currentUser) return null

      const currentUserId = String(currentUser.id)
      const user1Id = String(conversation.user1_id)
      const user2Id = String(conversation.user2_id)
      const otherUserId = conversation.other_user_id ? String(conversation.other_user_id) : (user1Id === currentUserId ? user2Id : user1Id)

      const first = conversation.first_name || conversation.name || conversation.username || null
      const rwandan = conversation.rwandan_name || conversation.last_name || null
      const displayName = first ? (rwandan ? `${first} ${rwandan}` : first) : `User ${otherUserId}`

      const otherUser = {
        id: otherUserId,
        name: displayName,
        avatar: conversation.avatar || conversation.profile_image || "/default.png",
        status: conversation.status || "online",
      }

      return {
        id: String(conversation.id),
        type: 'private',
        user: otherUser,
        lastMessage: conversation.last_message || "",
        timestamp: formatTime(conversation.created_at),
        unread: conversation.unread || 0,
      }
    },
    [currentUser]
  )

  // Map a group object into a chat-compatible shape. Accepts an optional profile lookup to resolve member names/avatars
  const mapGroupToChat = useCallback(
    (group, profileLookup = {}) => {
      if (!group || !currentUser) return null

      const members = typeof group.members === 'string' ? JSON.parse(group.members) : group.members
      const memberArray = Array.isArray(members) ? members : []

      const memberObjs = memberArray.map((id) => {
        const key = String(id)
        const profile = profileLookup[key]
        return {
          id: key,
          name: profile?.username || profile?.full_name || `User ${key}`,
          avatar: profile?.profile_image || '/default.png',
        }
      })

      return {
        id: String(group.id),
        type: 'group',
        user: {
          id: String(group.id),
          name: group.name,
          avatar: group.image || "/default.png",
          status: "group",
          memberCount: memberObjs.length,
          members: memberObjs,
        },
        lastMessage: group.last_message || "",
        timestamp: formatTime(group.created_at),
        unread: group.unread || 0,
        isGroup: true,
        description: group.description || '',
      }
    },
    [currentUser]
  )

  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
    setShowConversation(true)

    if (chat?.id) {
      const conversationId = String(chat.id)
      
      if (socket) {
        if (socket.connected) {
          socket.emit("join_conversation", { conversationId })
        } else {
          socket.once("connect", () => {
            socket.emit("join_conversation", { conversationId })
          })
        }
      }

      loadMessagesForConversation(conversationId)
    }
    
    setSearchQuery("")
    
    if (chat.unread > 0) {
      setChats((prev) => prev.map(c => 
        String(c.id) === String(chat.id) ? { ...c, unread: 0 } : c
      ))
    }
  }

  const mapMessageToUi = useCallback(
    (message) => {
      if (!message || !currentUser) return null

      return {
        id: String(message.id),
        senderId: String(message.sender_id),
        text: message.content || "",
        mediaUrl: message.media_url || null,
        timestamp: formatTime(message.created_at),
        isOwn: String(message.sender_id) === String(currentUser.id),
      }
    },
    [currentUser]
  )

  const loadMessagesForConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) return
      setIsLoadingMessages(true)
      try {
        const res = await fetch(`/api/privatechat/messages?conversationId=${conversationId}`)
        const data = await res.json()
        if (data?.success && Array.isArray(data.data)) {
          const mapped = data.data
            .map(mapMessageToUi)
            .filter(Boolean)
          setMessages(mapped)
        } else {
          setMessages([])
        }
      } catch (err) {
        console.error("Error loading messages", err)
        setMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    },
    [mapMessageToUi]
  )

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        setCurrentUser(parsed)
      }
    } catch (err) {
      console.error("Error reading current user from localStorage:", err)
    }
  }, [])

  const [placeholderOpen, setPlaceholderOpen] = useState(false)

  const startConversationWithUser = useCallback(async (user) => {
    if (!currentUser?.id || !user?.id) return

    try {
      const res = await fetch("/api/privatechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user1: currentUser.id, user2: user.id }),
      })
      const data = await res.json()
      if (!data?.success || !data.data) {
        toast.error("Failed to create conversation.")
        return
      }
      toast.success("Conversation created successfully!")
      const mapped = mapConversationToChat(data.data)
      if (!mapped) return

      setChats((prev) => {
        const exists = prev.some((c) => String(c.id) === String(mapped.id))
        return exists ? prev : [mapped, ...prev]
      })

      handleChatSelect(mapped)
    } catch (err) {
      console.error("Error starting conversation", err)
    } finally {
      try { setPlaceholderOpen(false) } catch {}
    }
  }, [currentUser, mapConversationToChat, handleChatSelect])

  useEffect(() => {
    if (!currentUser?.id) return

    const loadConversations = async () => {
      setIsLoadingChats(true)
      try {
        // Load private conversations
        const privateRes = await fetch(`/api/privatechat/userid?userid=${currentUser.id}`)
        const privateData = await privateRes.json();
        
        // Load group conversations
        const groupRes = await fetch(`/api/group-conversation?userId=${currentUser.id}`)
        const groupData = await groupRes.json();

        const allChats = []

        // Map private conversations
        if (privateData?.success && Array.isArray(privateData.data)) {
          const mappedPrivate = privateData.data
            .map(mapConversationToChat)
            .filter(Boolean)
          allChats.push(...mappedPrivate)
        }

        // Map group conversations
        let profileLookup = {}
        try {
          const usersRes = await fetch('/api/users')
          const usersJson = await usersRes.json()
          if (usersJson?.users && Array.isArray(usersJson.users)) {
            usersJson.users.forEach(u => {
              if (u.created_by) profileLookup[String(u.created_by)] = u
            })
          }
        } catch (e) {
          console.error('Error fetching user profiles for groups:', e)
        }

        if (groupData?.success && Array.isArray(groupData.data)) {
          const mappedGroups = groupData.data
            .map((g) => mapGroupToChat(g, profileLookup))
            .filter(Boolean)
          allChats.push(...mappedGroups)
        }

        // Sort by timestamp (most recent first)
        allChats.sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime()
          const timeB = new Date(b.timestamp || 0).getTime()
          return timeB - timeA
        })

        setChats(allChats)

        if (allChats.length > 0 && !selectedChat) {
          const first = allChats[0]
          setSelectedChat(first)
          setShowConversation(true)
          await loadMessagesForConversation(first.id)
        }
      } catch (err) {
        console.error("Error loading conversations", err)
        setChats([])
      } finally {
        setIsLoadingChats(false)
      }
    }

    loadConversations()
  }, [currentUser, mapConversationToChat, mapGroupToChat, loadMessagesForConversation, selectedChat])

  const loadOnlineUsers = useCallback(async () => {
    if (!currentUser?.id) return
    
    setIsLoadingOnlineUsers(true)
    try {
      const res = await fetch(`/api/online-users?excludeUserId=${currentUser.id}`)
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) {
        setOnlineUsers(data.data)
      } else {
        setOnlineUsers([])
      }
    } catch (err) {
      console.error("Error loading online users", err)
      setOnlineUsers([])
    } finally {
      setIsLoadingOnlineUsers(false)
    }
  }, [currentUser])

  useEffect(() => {
    loadOnlineUsers()
  }, [loadOnlineUsers])

  useEffect(() => {
    if (onlineUsers.length === 0 && chats.length === 0) return

    setChats((prev) =>
      prev.map((chat) => {
        const isOnline = onlineUsers.some(user => String(user.id) === String(chat.user.id))
        return {
          ...chat,
          user: {
            ...chat.user,
            status: isOnline ? "online" : (chat.user.status || "offline")
          }
        }
      })
    )
  }, [onlineUsers])

  useEffect(() => {
    if (!currentUser?.id) return

    const socketInstance = io(undefined, {
      path: "/api/socketio",
    })

    setSocket(socketInstance)

    socketInstance.on("connect", () => {
      socketInstance.emit("join_user", { userId: currentUser.id })
      if (selectedChat?.id) {
        socketInstance.emit("join_conversation", { conversationId: selectedChat.id })
      }
      socketInstance.emit("get_online_users")
    })

    socketInstance.on("online_users_list", (data) => {
      if (data?.users && Array.isArray(data.users)) {
        const filtered = data.users.filter(user => String(user.id) !== String(currentUser.id))
        setOnlineUsers(filtered)
      }
    })

    socketInstance.on("user_online", ({ userId }) => {
      if (String(userId) !== String(currentUser.id)) {
        loadOnlineUsers()
        setChats((prev) =>
          prev.map((chat) => {
            if (String(chat.user.id) === String(userId)) {
              return { ...chat, user: { ...chat.user, status: "online" } }
            }
            return chat
          })
        )
      }
    })

    socketInstance.on("user_offline", ({ userId }) => {
      if (String(userId) !== String(currentUser.id)) {
        setOnlineUsers((prev) => prev.filter(user => String(user.id) !== String(userId)))
        setChats((prev) =>
          prev.map((chat) => {
            if (String(chat.user.id) === String(userId)) {
              return { ...chat, user: { ...chat.user, status: "offline" } }
            }
            return chat
          })
        )
      }
    })

    socketInstance.on("private_conversation_created", (conversation) => {
      setChats((prev) => {
        const exists = prev.some((c) => String(c.id) === String(conversation.id))
        const mapped = mapConversationToChat(conversation)
        if (!mapped) return prev
        if (exists) {
          return prev.map((c) => (String(c.id) === String(conversation.id) ? mapped : c))
        }
        return [mapped, ...prev]
      })
    })

    socketInstance.on("private_message", (message) => {
      const convId = String(message.conversation_id)
      const msgId = String(message.id)
      
      setMessages((prev) => {
        if (!selectedChat || String(selectedChat.id) !== convId) {
          return prev
        }
        
        const exists = prev.some((msg) => {
          return String(msg.id) === msgId || 
                 (msg.isPending && 
                  msg.text === message.content && 
                  String(msg.senderId) === String(message.sender_id))
        })
        
        if (exists) {
          return prev.map((msg) => {
            if (msg.isPending && 
                msg.text === message.content && 
                String(msg.senderId) === String(message.sender_id)) {
              const mapped = mapMessageToUi(message)
              return mapped || msg
            }
            return msg
          })
        }
        
        const mapped = mapMessageToUi(message)
        if (!mapped) return prev
        
        const filtered = prev.filter((msg) => 
          !(msg.isPending && 
            msg.text === message.content && 
            String(msg.senderId) === String(message.sender_id))
        )
        
        return [...filtered, mapped]
      })

      setChats((prev) =>
        prev.map((chat) => {
          if (String(chat.id) !== convId) return chat
          const preview = message.content || (message.media_url ? "Media message" : "")
          const time = formatTime(message.created_at)
          const isCurrentConversation = selectedChat && String(selectedChat.id) === convId
          return {
            ...chat,
            lastMessage: preview,
            timestamp: time,
            unread: isCurrentConversation ? 0 : (chat.unread || 0) + 1,
          }
        })
      )
    })

    const activityInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit("user_activity")
      }
    }, 30000)

    socketInstance.on("disconnect", () => {
      clearInterval(activityInterval)
    })

    return () => {
      clearInterval(activityInterval)
      socketInstance.disconnect()
    }
  }, [currentUser, selectedChat, mapConversationToChat, mapMessageToUi, loadOnlineUsers])

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats
    
    const query = searchQuery.toLowerCase()
    return chats.filter(chat => 
      chat.user.name.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    )
  }, [chats, searchQuery])

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim() || !showConversation) return messages
    
    const query = searchQuery.toLowerCase()
    return messages.filter(message => 
      message.text.toLowerCase().includes(query)
    )
  }, [messages, searchQuery, showConversation])

  const handleBackToChats = () => {
    setShowConversation(false)
    setSearchQuery("")
  }

  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(null)

  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      toast.error("Message cannot be empty")
      return
    }

    if (!currentUser?.id) {
      toast.error("You must be logged in to send messages")
      return
    }

    if (!selectedChat?.id) {
      toast.error("No conversation selected")
      return
    }

    const content = messageInput.trim()
    const conversationId = String(selectedChat.id)
    const senderId = String(currentUser.id)

    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      senderId: senderId,
      text: content,
      mediaUrl: null,
      timestamp: formatTime(new Date().toISOString()),
      isOwn: true,
      isPending: true,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setMessageInput("")

    if (socket && socket.connected) {
      socket.emit("join_conversation", { conversationId })
    }

    const sendViaSocket = () => {
      return new Promise((resolve, reject) => {
        if (!socket || !socket.connected) {
          reject(new Error("Socket not connected"))
          return
        }

        socket.emit(
          "send_private_message",
          {
            conversationId: conversationId,
            senderId: senderId,
            content: content,
            mediaUrl: null,
          },
          (response) => {
            if (response?.success) {
              setMessages((prev) => {
                const filtered = prev.filter((msg) => msg.id !== tempId)
                const realMessage = mapMessageToUi(response.message)
                return realMessage ? [...filtered, realMessage] : filtered
              })
              
              setChats((prev) =>
                prev.map((chat) => {
                  if (String(chat.id) !== conversationId) return chat
                  return {
                    ...chat,
                    lastMessage: content,
                    timestamp: formatTime(response.message.created_at),
                  }
                })
              )

              resolve(response)
            } else {
              reject(new Error(response?.error || "Failed to send message"))
            }
          }
        )

        setTimeout(() => {
          reject(new Error("Socket timeout"))
        }, 5000)
      })
    }

    try {
      await sendViaSocket()
    } catch (socketError) {
      console.warn("Socket send failed:", socketError)
      try {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        setMessageInput(content)
        toast.error("Failed to send message. Please try again.")
      } catch (httpError) {
        console.error("Both socket and HTTP send failed:", httpError)
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        setMessageInput(content)
        toast.error(httpError.message || "Failed to send message. Please try again.")
      }
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji)
    setShowEmoji(false)
  }

  // Theme classes
  const isDark = theme === 'dark'
  const bgColor = isDark ? "bg-gray-900" : "bg-gray-50"
  const cardBg = isDark ? "bg-gray-800" : "bg-white"
  const borderColor = isDark ? "border-gray-700" : "border-gray-200"
  const textColor = isDark ? "text-white" : "text-gray-900"
  const textMuted = isDark ? "text-gray-400" : "text-gray-600"
  const hoverBg = isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-100/50"
  const onlineStatus = isDark ? "border-gray-800" : "border-white"
  const messageBgOwn = isDark ? "bg-green-600" : "bg-green-500"
  const messageBgOther = isDark ? "bg-gray-700" : "bg-gray-100"
  const inputBg = isDark ? "bg-gray-700" : "bg-gray-50"

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-300 pt-16`}>
      <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row gap-4 p-4">
        
        {/* Online Users Sidebar - Desktop Only */}
        <aside className="hidden lg:flex lg:w-64">
          <Card className={`flex-1 ${cardBg} ${borderColor} border flex flex-col`}>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Users className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <h2 className={`text-lg font-semibold ${textColor}`}>Online Users</h2>
              </div>
              <p className={`text-sm ${textMuted}`}>
                {isLoadingOnlineUsers ? "Loading..." : `${onlineUsers.length} active now`}
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {isLoadingOnlineUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                  </div>
                ) : onlineUsers.length === 0 ? (
                  <div className={`text-center py-8 ${textMuted}`}>No users online</div>
                ) : (
                  onlineUsers.map((user) => (
                    <Card 
                      key={user.id} 
                      className={`p-3 ${hoverBg} transition-colors duration-200 cursor-pointer ${cardBg} border ${borderColor}`}
                      onClick={() => startConversationWithUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || "/default.png"} alt={user.name} />
                            <AvatarFallback className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 ${onlineStatus} rounded-full`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${textColor} truncate`}>{user.name}</p>
                          <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Active now</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </aside>

        {/* Chat List */}
        <aside className={`w-full lg:w-80 flex ${showConversation ? 'hidden lg:flex' : 'flex'}`}>
          <Card className={`flex-1 ${cardBg} ${borderColor} border flex flex-col`}>
            {/* Mobile Online Users */}
            <div className="lg:hidden border-b">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    <h3 className={`text-sm font-semibold ${textColor}`}>Online Users</h3>
                  </div>
                  <Badge className={`${isDark ? 'bg-green-500/20' : 'bg-green-100'} ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {onlineUsers.length} online
                  </Badge>
                </div>
                <ScrollArea className="w-full" orientation="horizontal">
                  <div className="flex gap-3 pb-2 min-w-max">
                    {isLoadingOnlineUsers ? (
                      <div className="flex items-center justify-center w-20 h-20">
                        <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                      </div>
                    ) : onlineUsers.length === 0 ? (
                      <div className={`text-xs ${textMuted} py-4 px-6`}>No users online</div>
                    ) : (
                      onlineUsers.slice(0, 5).map((user) => (
                        <Card
                          key={user.id}
                          className={`p-3 ${cardBg} ${borderColor} border ${hoverBg} transition-colors duration-200 cursor-pointer flex-shrink-0`}
                          onClick={() => startConversationWithUser(user)}
                        >
                          <div className="flex flex-col items-center gap-2 w-16">
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar || "/default.png"} alt={user.name} />
                                <AvatarFallback className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                  {user.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className={`absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 ${onlineStatus} rounded-full`} />
                            </div>
                            <p className={`text-xs font-medium ${textColor} text-center line-clamp-1 w-full`}>
                              {user.name.split(" ")[0]}
                            </p>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                  <Input
                    placeholder="Search by name or message..."
                    className={`pl-9 ${inputBg} ${borderColor} ${textColor} placeholder:${textMuted}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} hover:${textColor}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <ComboboxPopover open={open} onClose={setOpen} onSelect={startConversationWithUser}>
                  <Button variant="outline" size="icon" className={`border ${borderColor} ${hoverBg}`}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </ComboboxPopover>
              </div>
              {searchQuery && (
                <p className={`text-xs ${textMuted} mt-2`}>
                  Found {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1 min-h-0">
              {isLoadingChats ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-12">
                  <Search className={`h-10 w-10 ${textMuted} mx-auto mb-3`} />
                  <p className={textMuted}>
                    {searchQuery ? `No chats found for "${searchQuery}"` : "No conversations yet"}
                  </p>
                  <ComboboxPopover onSelect={startConversationWithUser} open={placeholderOpen} onClose={setPlaceholderOpen}>
                    <Button className="mt-4 bg-green-500 hover:bg-green-600 text-white">
                      Start new conversation
                    </Button>
                  </ComboboxPopover>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredChats.map((chat) => (
                    <Card
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-3 ${hoverBg} transition-all duration-200 cursor-pointer ${cardBg} border ${borderColor} ${
                        selectedChat?.id === chat.id 
                          ? `ring-2 ring-green-500 ring-offset-2 ${isDark ? 'ring-offset-gray-800' : 'ring-offset-white'}` 
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={chat.user.avatar || "/default.png"} alt={chat.user.name} />
                            <AvatarFallback className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                              {chat.type === 'group' ? <Users className="h-6 w-6" /> : chat.user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          {chat.type === 'group' ? (
                            <span className={`absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 ${onlineStatus} rounded-full flex items-center justify-center`}>
                              <Users className="h-2 w-2 text-white" />
                            </span>
                          ) : chat.user.status === "online" && (
                            <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 ${onlineStatus} rounded-full`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <div className="relative inline-block group">
                                    <p className={`text-sm font-semibold ${textColor} truncate cursor-default`}>{chat.user.name}</p>
                                    {chat.isGroup && chat.description && (
                                      <div className="absolute left-0 -top-12 w-64 p-3 bg-white dark:bg-gray-800 border rounded shadow-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
                                        <p className="text-xs text-muted text-gray-700 dark:text-gray-200">{chat.description}</p>
                                      </div>
                                    )}
                                  </div>
                                  {chat.type === 'group' && (
                                    <div className="relative ml-2 inline-block group">
                                      {/* <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full px-2 py-0.5 cursor-pointer">
                                        {chat.user.memberCount} members
                                      </span> */}
                                      <div className="absolute top-0 left-full ml-2 w-48 p-2 bg-white dark:bg-gray-800 border rounded shadow-lg opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50">
                                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                          {chat.user.members && chat.user.members.length > 0 ? (
                                            chat.user.members.slice(0, 20).map((m) => (
                                              <div key={m.id} className="flex items-center gap-2">
                                                <img src={m.avatar} alt={m.name} className="h-6 w-6 rounded-full object-cover" />
                                                <span className="text-xs truncate">{m.name}</span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-xs text-muted">No members</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {searchQuery && chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                                  <Badge className="bg-orange-500 text-white text-xs px-1 py-0 h-4 mt-1">
                                    Name
                                  </Badge>
                                )}
                              </div>
                              {searchQuery && chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                                <Badge className="bg-orange-500 text-white text-xs px-1 py-0 h-4">
                                  Name
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className={`text-xs ${textMuted}`}>{chat.timestamp}</span>
                              {chat.unread > 0 && (
                                <Badge className={`bg-green-500 text-white text-xs px-2 py-0 h-5 min-w-[20px] flex items-center justify-center`}>
                                  {chat.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm ${textMuted} truncate`}>
                            {searchQuery && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                              <>
                                {chat.lastMessage.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                                  part.toLowerCase() === searchQuery.toLowerCase() ? (
                                    <span key={i} className="bg-orange-500 text-white px-1 rounded">
                                      {part}
                                    </span>
                                  ) : (
                                    part
                                  )
                                )}
                              </>
                            ) : (
                              chat.lastMessage
                            )}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </aside>

        {/* Chat Area */}
        <main className={`flex-1 flex ${showConversation ? 'flex' : 'hidden lg:flex'}`}>
          <Card className={`flex-1 ${cardBg} ${borderColor} border flex flex-col`}>
            {!selectedChat ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className={`p-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} inline-block mb-4`}>
                    <MessageSquare className="h-12 w-12 text-green-500" />
                  </div>
                  <h3 className={`text-xl font-semibold ${textColor} mb-2`}>No conversation selected</h3>
                  <p className={`text-sm ${textMuted} mb-6`}>Select a conversation or start a new one to begin messaging.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <ComboboxPopover onSelect={startConversationWithUser} open={placeholderOpen} onClose={setPlaceholderOpen}>
                      <Button className="bg-green-500 hover:bg-green-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Start conversation
                      </Button>
                    </ComboboxPopover>
                    <Button 
                      variant="outline" 
                      className={`border ${borderColor} ${hoverBg}`}
                      onClick={() => setShowConversation(false)}
                    >
                      Browse chats
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-2 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={handleBackToChats}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedChat?.user?.avatar || "/default.png"} alt={selectedChat?.user?.name} />
                          <AvatarFallback className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                            {selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {selectedChat?.user?.status === "online" && (
                          <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 ${onlineStatus} rounded-full`} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <div className="relative inline-block group">
                            <h2 className={`font-semibold ${textColor}`}>{selectedChat?.user?.name}</h2>
                            {selectedChat?.isGroup && selectedChat.description && (
                              <div className="absolute left-0 -top-14 w-72 p-3 bg-white dark:bg-gray-800 border rounded shadow-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 hover:cursor-pointer">
                                <p className="text-sm text-gray-700 dark:text-gray-200">{selectedChat.description}</p>
                              </div>
                            )}
                          </div>

                          {selectedChat?.isGroup && (
                            <div className="relative inline-block group">
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-sm px-2 py-1 hover:cursor-pointer">See your colleage</span>
                              <div className="absolute top-0 left-full ml-2 w-56 p-3 bg-white dark:bg-gray-800 border rounded shadow-lg opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50">
                                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                                  {selectedChat.user.members?.map(m => (
                                    <div key={m.id} className="flex items-center gap-2">
                                      <img src={m.avatar} alt={m.name} className="h-6 w-6 rounded-full object-cover" />
                                      <span className="text-sm truncate">{m.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          {selectedChat?.isGroup ? (selectedChat.user.memberCount + ' members') : (selectedChat?.user?.status === "online" ? "Active now" : "Offline")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      >
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Conversation Search */}
                <div className="px-4 py-1 border-b flex-shrink-0">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                    <Input
                      placeholder="Search in conversation..."
                      className={`pl-9 ${inputBg} ${borderColor} ${textColor} placeholder:${textMuted}`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} hover:${textColor}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {searchQuery && showConversation && (
                    <p className={`text-xs ${textMuted} mt-2 text-center`}>
                      Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} in conversation
                    </p>
                  )}
                </div>

                {/* Messages Area */}
                <ScrollArea 
                  className="flex-1 px-4 min-h-0" 
                  ref={messagesContainerRef}
                >
                  <div className="py-4 space-y-4 max-w-3xl mx-auto">
                    <div className="flex justify-center sticky top-0 z-10">
                      <Badge variant="secondary" className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-600'} backdrop-blur-sm`}>
                        {result}
                      </Badge>
                    </div>

                    {isLoadingMessages ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                      </div>
                    ) : filteredMessages.length === 0 && searchQuery ? (
                      <div className="text-center py-12">
                        <Search className={`h-10 w-10 ${textMuted} mx-auto mb-3`} />
                        <p className={textMuted}>No messages found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <>
                        {(searchQuery ? filteredMessages : messages).map((message) => (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2 ${message.isOwn ? "flex-row-reverse" : ""}`}
                          >
                            {!message.isOwn && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={selectedChat?.user?.avatar || "/default.png"} alt={selectedChat?.user?.name} />
                                <AvatarFallback className={`text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                  {selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 transition-all duration-200 ${
                                message.isOwn
                                  ? `${messageBgOwn} text-white rounded-br-sm`
                                  : `${messageBgOther} ${textColor} rounded-bl-sm border ${borderColor}`
                              }`}
                            >
                              {searchQuery && message.text.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                                <p className="text-sm break-words">
                                  {message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                                      <span key={i} className="bg-orange-500 text-white px-1 rounded">
                                        {part}
                                      </span>
                                    ) : (
                                      part
                                    )
                                  )}
                                </p>
                              ) : (
                                <p className="text-sm break-words">{message.text}</p>
                              )}
                              <p
                                className={`text-xs mt-1 ${message.isOwn ? "text-white/70" : textMuted}`}
                              >
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t flex-shrink-0 relative">
                  {showEmoji && (
                    <div className="absolute bottom-full right-4 mb-2 z-50">
                      <Card className={`${cardBg} ${borderColor} border shadow-lg`}>
                        <EmojiPicker onSelect={handleEmojiSelect} />
                      </Card>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      title="Attach image"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      title="Attach file"
                    >
                      <FileText className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      title="Attach video"
                    >
                      <Film className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      title="Record audio"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className={`pr-10 ${inputBg} ${borderColor} ${textColor} placeholder:${textMuted}`}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && messageInput.trim()) {
                            handleSendMessage()
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute right-1 top-1/2 -translate-y-1/2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        title="Add emoji"
                        onClick={() => setShowEmoji(!showEmoji)}
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </main>
      </div>
    </div>
  )
}