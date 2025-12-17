"use client"
import { Label } from "@/components/ui/label"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useTheme } from '@/lib/theme'
import { io } from "socket.io-client"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Smile,
  ImageIcon,
  FileText,
  Mic,
  Film,
  ArrowLeft,
  X,
  Sun,
  Moon,
  Users,
  Plus,
  MessageSquare,
} from "lucide-react"
import ComboboxPopover from "./combobox"
import { CardHeader } from "@heroui/react"
const onlineUsers = [
  { id: "1", name: "Gafar Usman", avatar: "/professional-man.jpg", status: "online" },
  { id: "2", name: "Hafsoh Sade", avatar: "/professional-woman-diverse.png", status: "online" },
  { id: "3", name: "Gabriel Akande", avatar: "/professional-man-2.png", status: "online" },
  { id: "4", name: "Hassan Akorede", avatar: "/professional-man-3.png", status: "online" },
  { id: "5", name: "Devon Lane", avatar: "/professional-woman-2.png", status: "online" },
  { id: "6", name: "John Doe", avatar: "/professional-man.jpg", status: "online" },
  { id: "7", name: "Jane Smith", avatar: "/professional-woman-diverse.png", status: "online" },
  { id: "8", name: "Robert Johnson", avatar: "/professional-man.jpg", status: "online" },
  { id: "9", name: "Sarah Williams", avatar: "/professional-woman-diverse.png", status: "online" },
  { id: "10", name: "Michael Brown", avatar: "/professional-man-2.png", status: "online" },
]

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [socket, setSocket] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [messageInput, setMessageInput] = useState("")
  const [showConversation, setShowConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  // Use global theme hook so chat follows the app-wide theme toggle
  const { theme, toggle } = useTheme()
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

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

  const mapConversationToChat = useCallback(
    (conversation) => {
      if (!conversation || !currentUser) return null

      const currentUserId = String(currentUser.id)
      const user1Id = String(conversation.user1_id)
      const user2Id = String(conversation.user2_id)
      const otherUserId = conversation.other_user_id ? String(conversation.other_user_id) : (user1Id === currentUserId ? user2Id : user1Id)

      // Build a friendly display name from available fields
      const first = conversation.first_name || conversation.name || conversation.username || null
      const rwandan = conversation.rwandan_name || conversation.last_name || null
      const displayName = first ? (rwandan ? `${first} ${rwandan}` : first) : `User ${otherUserId}`

      const otherUser = {
        id: otherUserId,
        name: displayName,
        avatar: conversation.avatar || conversation.profile_image || "/professional-man.jpg",
        status: conversation.status || "online",
      }

      return {
        id: String(conversation.id),
        user: otherUser,
        lastMessage: conversation.last_message || "",
        timestamp: formatTime(conversation.created_at),
        unread: conversation.unread || 0,
      }
    },
    [currentUser]
  )

  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
    setShowConversation(true)

    if (socket && chat?.id) {
      socket.emit("join_conversation", { conversationId: chat.id })
    }

    if (chat?.id) {
      loadMessagesForConversation(chat.id)
    }
    setSearchQuery("")
    
    // Mark chat as read
    if (chat.unread > 0) {
      setChats(chats.map(c => 
        c.id === chat.id ? { ...c, unread: 0 } : c
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
        const res = await fetch(`/api/privatechat/messages/${conversationId}`)
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

  // No local dark mode state: `useTheme` manages document class and persistence
  const toggleDarkMode = () => toggle()

  // Load current user from localStorage (set during login)
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

  // local open state for the standalone placeholder popover so it doesn't conflict with the header one
  const [placeholderOpen, setPlaceholderOpen] = useState(false)

  const startConversationWithUser = useCallback(async (user) => {
    console.log("Starting conversation with user", user)
    if (!currentUser?.id || !user?.id) return

    try {
        const res = await fetch("/api/privatechat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user1: currentUser.id, user2: user.id }),
        })
        const data = await res.json()
        if (!data?.success || !data.data) {
          console.error("Failed to create conversation via HTTP", data?.error || data?.message)
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
      // }
    } catch (err) {
      console.error("Error starting conversation", err)
    } finally {
      try { setOpen(false) } catch {}
      try { setPlaceholderOpen(false) } catch {}
    }
  }, [socket, currentUser, mapConversationToChat, handleChatSelect])


  useEffect(() => {
    if (!currentUser?.id) return

    const loadConversations = async () => {
      setIsLoadingChats(true)
      try {
        const res = await fetch(`/api/privatechat/userid?userid=${currentUser.id}`)
        const data = await res.json();
console.log("fetched conversation are ",data.data)
        if (data?.success && Array.isArray(data.data)) {
          const mapped = data.data
            .map(mapConversationToChat)
            .filter(Boolean)
          setChats(mapped)

          if (mapped.length > 0 && !selectedChat) {
            const first = mapped[0]
            setSelectedChat(first)
            setShowConversation(true)
            await loadMessagesForConversation(first.id)
          }
        } else {
          setChats([])
        }
      } catch (err) {
        console.error("Error loading conversations", err)
        setChats([])
      } finally {
        setIsLoadingChats(false)
      }
    }

    loadConversations()
  }, [currentUser, mapConversationToChat, loadMessagesForConversation, selectedChat])

  // Set up socket.io connection for real-time updates
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
      setMessages((prev) => {
        if (!selectedChat || String(selectedChat.id) !== convId) {
          return prev
        }
        const mapped = mapMessageToUi(message)
        if (!mapped) return prev
        return [...prev, mapped]
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

    socketInstance.on("disconnect", () => {
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [currentUser, selectedChat, mapConversationToChat, mapMessageToUi])
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

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentUser?.id || !selectedChat?.id || !socket) return

    const content = messageInput.trim()

    socket.emit(
      "send_private_message",
      {
        conversationId: selectedChat.id,
        senderId: currentUser.id,
        content,
        mediaUrl: null,
      },
      (response) => {
        if (!response?.success) {
          console.error("Error sending message via socket:", response?.error)
        }
      }
    )

    setMessageInput("")
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  // Theme classes
  const isDark = theme === 'dark'
  const bgColor = isDark ? "bg-gray-900" : "bg-gray-50"
  const cardBg = isDark ? "bg-gray-800" : "bg-white"
  const borderColor = isDark ? "border-gray-800" : "border-gray-200"
  const textColor = isDark ? "text-white" : "text-gray-900"
  const textMuted = isDark ? "text-gray-100" : "text-gray-900"
  const hoverBg = isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
  const onlineStatus = isDark ? "border-gray-900" : "border-white"
  const messageBgOwn = isDark ? "bg-green-600" : "bg-green-600"
  const messageBgOther = isDark ? "bg-gray-800" : "bg-gray-100"

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-300 mt-20`}>
      {/* Theme Toggle */}
      {/* <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className={`rounded-full ${isDark ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div> */}

      <div className="flex max-h-[650px] pt-4 px-4">
        <aside className="hidden lg:flex w-64 mr-4">
          <Card className={`flex-1 ${cardBg} ${borderColor} border flex flex-col`}>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-green-600" />
                <h2 className={`text-lg font-semibold ${textColor}`}>Online Users</h2>
              </div>
              <p className={`text-sm ${textMuted}`}>{onlineUsers.length} active now</p>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-3 space-y-2">
                {onlineUsers.map((user) => (
                  <Card 
                    key={user.id} 
                    className={`p-3 ${hoverBg} transition-colors duration-200 cursor-pointer ${cardBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-600 border-2 ${onlineStatus} rounded-full`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${textColor}`}>{user.name}</p>
                        <p className="text-xs text-green-600">Active now</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </aside>

        {/* Chat List */}
        <aside
          className={`w-full lg:w-80 mr-0 lg:mr-4 transition-transform duration-300 ${
            showConversation ? "hidden lg:flex" : "flex"
          }`}
        >
          <Card className={`flex-1 ${cardBg} ${borderColor} border flex flex-col`}>
            {/* Mobile Online Users - tap to start a private conversation */}
            <div className="lg:hidden border-b">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <h3 className={`text-sm font-semibold ${textColor}`}>Online Users</h3>
                </div>
                <ScrollArea className="w-full" orientation="horizontal">
                  <div className="flex gap-3 pb-2 min-w-max">
                    {onlineUsers.slice(0, 5).map((user) => (
                      <Card
                        key={user.id}
                        className={`p-3 ${cardBg} ${borderColor} border hover:${hoverBg} transition-colors duration-200 cursor-pointer min-w-[80px]`}
                        onClick={() => startConversationWithUser(user)}
                                              >
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                                {user.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute bottom-0 right-0 w-2 h-2 bg-green-600 border-2 ${onlineStatus} rounded-full`} />
                          </div>
                          <p className={`text-xs font-medium ${textColor} text-center line-clamp-1 w-full`}>
                            {user.name.split(" ")[0]}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <div className="p-4 border-b max-w-[300px]">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by name or message..."
                  className={`pl-9 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'border-gray-600' : 'border-gray-300'} ${textColor} placeholder:${textMuted} max-w-[250px]`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
  <ComboboxPopover open={open} onClose={setOpen} onSelect={startConversationWithUser}>
    <Button variant="outline" className="hover:cursor-pointer">
      <Plus className="h-4 w-4" />
    </Button>
  </ComboboxPopover>
                </div>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} hover:${textColor}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className={`text-xs ${textMuted} mt-2`}>
                  Found {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8 ">
                  <Search className={`h-8 w-8 ${textMuted} mx-auto mb-2`} />
                  <p className={textMuted}>No chats found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredChats.map((chat) => (
                    <Card
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`mb-2 p-3 ${hoverBg} transition-all duration-200 max-w-[300px] cursor-pointer ${cardBg} ${
                        selectedChat.id === chat.id 
                          ? `border-l-4 border-green-600 shadow-sm` 
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={chat.user.avatar || "/default.png"} alt={chat.user.name} />
                            <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                              {chat.user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          {chat.user.status === "online" && (
                            <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-600 border-2 ${onlineStatus} rounded-full`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-semibold ${textColor} truncate`}>
                                {chat.user.name}
                              </p>
                              {searchQuery && chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                                <Badge className="bg-orange-500 text-white text-xs px-1 py-0 h-4">
                                  Name
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs ${textMuted}`}>{chat.timestamp}</span>
                              {chat.unread > 0 && (
                                <Badge className={`bg-green-600 text-white text-xs px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center`}>
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
        <main
          className={`flex-1 flex flex-col transition-transform duration-300 ${
            showConversation ? "flex" : "hidden lg:flex"
          }`}
        >
          <Card className={`flex-1 ${cardBg} ${borderColor} border flex flex-col`}>
            {/* Chat Header */}
            {!selectedChat ? (
              <div className={`flex-1 flex items-center justify-center p-8`}> 
                <div className={`text-center max-w-md `}> 
                  <h3 className={`text-lg font-semibold ${textColor}`}>No conversation selected</h3>
                  <p className={`text-sm ${textMuted} mt-2`}>Start a private conversation with someone or create a new one.</p>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <ComboboxPopover onSelect={startConversationWithUser} open={placeholderOpen} onClose={setPlaceholderOpen}>
                      <Button variant="outline" className="hover:cursor-pointer bg-orange-500 text-white" >Start conversation</Button>
                    </ComboboxPopover>
                    <Button variant="outline" className="bg-green-600 text-white" onClick={() => setShowConversation(false)}>
                      Browse chats
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
     <div className="p-4 border-b">
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
                      <AvatarImage src={selectedChat?.user?.avatar || "/placeholder.svg"} alt={selectedChat?.user?.name} />
                        <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                        {selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChat?.user?.status === "online" && (
                      <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-600 border-2 ${onlineStatus} rounded-full`} />
                    )}
                  </div>
                  <div>
                    <h2 className={`font-semibold ${textColor}`}>{selectedChat?.user?.name}</h2>
                    <p className="text-sm text-green-600">
                      {selectedChat?.user?.status === "online" ? "Active now" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isDark ? 'text-gray-400 hover:text-green-600 hover:bg-gray-800' : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isDark ? 'text-gray-400 hover:text-green-600 hover:bg-gray-800' : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'}
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isDark ? 'text-gray-400 hover:text-green-600 hover:bg-gray-800' : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Conversation Search */}
            <div className="px-4 py-1 border-b">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                <Input
                  placeholder="Search in conversation..."
                  className={`pl-9 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'border-gray-600' : 'border-gray-300'} ${textColor} placeholder:${textMuted}`}
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

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="flex justify-center">
                  <Badge variant="secondary" className={`${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    Today, Jan 24
                  </Badge>
                </div>

                {filteredMessages.length === 0 && searchQuery ? (
                  <div className="text-center py-8">
                    <Search className={`h-8 w-8 ${textMuted} mx-auto mb-2`} />
                    <p className={textMuted}>No messages found for "{searchQuery}"</p>
                  </div>
                ) : (
                  (searchQuery ? filteredMessages : messages).map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${message.isOwn ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!message.isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedChat?.user?.avatar || "/placeholder.svg"} 
                          alt={selectedChat?.user?.name} />
                          <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                            {selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 transition-all duration-200 hover:scale-[1.02] ${
                          message.isOwn
                            ? `${messageBgOwn} text-white rounded-br-sm`
                            : `${messageBgOther} ${textColor} rounded-bl-sm ${isDark ? 'border border-gray-700' : 'border border-gray-200'}`
                        }`}
                      >
                        {searchQuery && message.text.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                          <p className="text-sm">
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
                          <p className="text-sm">{message.text}</p>
                        )}
                        <p
                          className={`text-xs mt-1 ${message.isOwn ? "text-white/70" : textMuted}`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="px-4 py-2 border-t">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className={isDark ? 'text-gray-400 hover:text-green-600 hover:bg-gray-800' : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'}
                  title="Attach image"
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={isDark ? 'text-gray-400 hover:text-green-600 hover:bg-gray-800' : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'}
                  title="Attach file"
                >
                  <FileText className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={isDark ? 'text-gray-400 hover:text-orange-500 hover:bg-gray-800' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-100'}
                  title="Attach video"
                >
                  <Film className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={isDark ? 'text-gray-400 hover:text-orange-500 hover:bg-gray-800' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-100'}
                  title="Record audio"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className={`pr-10 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'border-gray-600' : 'border-gray-300'} ${textColor} placeholder:${textMuted} focus-visible:ring-green-600`}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && messageInput.trim()) {
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute right-1 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-orange-500' : 'text-gray-600 hover:text-orange-600'}`}
                    title="Add emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  size="icon"
                  className="bg-green-600 hover:bg-green-600 text-white transition-all duration-200 hover:scale-105"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
              </div>
            )}
       
          </Card>
        </main>
      </div>
    </div>
  )
}