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
  Download,
  Trash2,
  Play,
  Pause,
} from "lucide-react"
import ComboboxPopover from "./combobox"
import GroupMessageInput from "./GroupMessageInput"
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
  const [typingUsers, setTypingUsers] = useState([]) // Array of { userId, userName } for users currently typing
  
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

      // Handle last message - prioritize content, then media, then placeholder
      let lastMessageText = ""
      if (conversation.last_message) {
        lastMessageText = conversation.last_message
        // Truncate if too long
        if (lastMessageText.length > 50) {
          lastMessageText = lastMessageText.substring(0, 50) + "..."
        }
      } else if (conversation.last_message_media) {
        // Determine media type from URL
        const url = conversation.last_message_media.toLowerCase()
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          lastMessageText = "📷 Photo"
        } else if (url.match(/\.(mp4|webm|mov)$/)) {
          lastMessageText = "🎥 Video"
        } else if (url.match(/\.(mp3|wav|ogg)$/)) {
          lastMessageText = "🎵 Audio"
        } else {
          lastMessageText = "📎 File"
        }
      } else {
        lastMessageText = "No messages yet"
      }

      // Use last message time if exists, else use conversation creation time
      const messageTime = conversation.last_message_time || conversation.created_at

      return {
        id: String(conversation.id),
        type: 'private',
        user: otherUser,
        lastMessage: lastMessageText,
        timestamp: formatTime(messageTime),
        sortTime: messageTime, // Store raw timestamp for sorting
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

      // Handle last message - prioritize content, then media, then placeholder
      let lastMessageText = ""
      if (group.last_message) {
        lastMessageText = group.last_message
        // Truncate if too long
        if (lastMessageText.length > 50) {
          lastMessageText = lastMessageText.substring(0, 50) + "..."
        }
      } else if (group.last_message_media) {
        // Determine media type from URL
        const url = group.last_message_media.toLowerCase()
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          lastMessageText = "📷 Photo"
        } else if (url.match(/\.(mp4|webm|mov)$/)) {
          lastMessageText = "🎥 Video"
        } else if (url.match(/\.(mp3|wav|ogg)$/)) {
          lastMessageText = "🎵 Audio"
        } else {
          lastMessageText = "📎 File"
        }
      } else {
        lastMessageText = "No messages yet"
      }

      // Use last message time if exists, else use group creation time
      const messageTime = group.last_message_time || group.created_at

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
        lastMessage: lastMessageText,
        timestamp: formatTime(messageTime),
        sortTime: messageTime, // Store raw timestamp for sorting
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
      const isGroupChat = chat.isGroup || chat.type === 'group'
      
      if (socket) {
        if (socket.connected) {
          if (isGroupChat) {
            socket.emit("join_group", { groupId: conversationId })
          } else {
            socket.emit("join_conversation", { conversationId })
          }
        } else {
          socket.once("connect", () => {
            if (isGroupChat) {
              socket.emit("join_group", { groupId: conversationId })
            } else {
              socket.emit("join_conversation", { conversationId })
            }
          })
        }
      }

      loadMessagesForConversation(conversationId, isGroupChat)
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
    async (conversationId, isGroupChat = false) => {
      if (!conversationId) return
      setIsLoadingMessages(true)
      try {
        let endpoint
        if (isGroupChat) {
          endpoint = `/api/group-conversation/${conversationId}/messages`
        } else {
          endpoint = `/api/privatechat/messages?conversationId=${conversationId}`
        }
        
        const res = await fetch(endpoint)
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

        // Sort all chats by timestamp (most recent first)
        // This ensures private and group chats are properly interleaved by activity
        allChats.sort((a, b) => {
          // Use sortTime (raw timestamp) for accurate sorting
          const timeA = a.sortTime ? new Date(a.sortTime).getTime() : 0
          const timeB = b.sortTime ? new Date(b.sortTime).getTime() : 0
          
          // If timestamps are same or invalid, maintain original order
          if (timeA === timeB) return 0
          return timeB - timeA // Most recent first
        })

        setChats(allChats)
        // Don't auto-select first chat - let user choose
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
        const isGroupChat = selectedChat.isGroup || selectedChat.type === 'group'
        if (isGroupChat) {
          socketInstance.emit("join_group", { groupId: selectedChat.id })
        } else {
          socketInstance.emit("join_conversation", { conversationId: selectedChat.id })
        }
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
        
        // Skip messages from current user - they're handled by the socket callback
        if (String(message.sender_id) === String(currentUser?.id)) {
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
          
          // Format last message preview with truncation and media handling
          let preview = ""
          if (message.content) {
            preview = message.content
            // Truncate if too long
            if (preview.length > 50) {
              preview = preview.substring(0, 50) + "..."
            }
          } else if (message.media_url) {
            // Determine media type from URL
            const url = message.media_url.toLowerCase()
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
              preview = "📷 Photo"
            } else if (url.match(/\.(mp4|webm|mov)$/)) {
              preview = "🎥 Video"
            } else if (url.match(/\.(mp3|wav|ogg)$/)) {
              preview = "🎵 Audio"
            } else {
              preview = "📎 File"
            }
          } else {
            preview = "No messages yet"
          }
          
          const time = formatTime(message.created_at)
          const isCurrentConversation = selectedChat && String(selectedChat.id) === convId
          return {
            ...chat,
            lastMessage: preview,
            timestamp: time,
            sortTime: message.created_at, // Update sort time for proper ordering
            unread: isCurrentConversation ? 0 : (chat.unread || 0) + 1,
          }
        })
      )
    })

    // Group message listener
    socketInstance.on("group_message", (message) => {
      const groupId = String(message.group_id)
      const msgId = String(message.id)
      
      setMessages((prev) => {
        if (!selectedChat || String(selectedChat.id) !== groupId) {
          return prev
        }
        
        // Skip messages from current user - they're handled by the socket callback
        if (String(message.sender_id) === String(currentUser?.id)) {
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
          if (String(chat.id) !== groupId) return chat
          
          // Format last message preview with truncation and media handling
          let preview = ""
          if (message.content) {
            preview = message.content
            // Truncate if too long
            if (preview.length > 50) {
              preview = preview.substring(0, 50) + "..."
            }
          } else if (message.media_url) {
            // Determine media type from URL
            const url = message.media_url.toLowerCase()
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
              preview = "📷 Photo"
            } else if (url.match(/\.(mp4|webm|mov)$/)) {
              preview = "🎥 Video"
            } else if (url.match(/\.(mp3|wav|ogg)$/)) {
              preview = "🎵 Audio"
            } else {
              preview = "📎 File"
            }
          } else {
            preview = "No messages yet"
          }
          
          const time = formatTime(message.created_at)
          const isCurrentConversation = selectedChat && String(selectedChat.id) === groupId
          return {
            ...chat,
            lastMessage: preview,
            timestamp: time,
            sortTime: message.created_at, // Update sort time for proper ordering
            unread: isCurrentConversation ? 0 : (chat.unread || 0) + 1,
          }
        })
      )
    })

    // Delete message listeners
    socketInstance.on("message_deleted", ({ messageId, conversationId }) => {
      if (String(selectedChat?.id) === String(conversationId)) {
        setMessages((prev) => prev.filter((msg) => String(msg.id) !== String(messageId)))
      }
    })

    socketInstance.on("group_message_deleted", ({ messageId, groupId }) => {
      if (String(selectedChat?.id) === String(groupId)) {
        setMessages((prev) => prev.filter((msg) => String(msg.id) !== String(messageId)))
      }
    })

    // Typing indicator listeners for private chats
    socketInstance.on("typing_private", ({ conversationId, userId, userName, isTyping }) => {
      // Only show typing indicator if it's for the current conversation and not the current user
      if (
        selectedChat && 
        String(selectedChat.id) === String(conversationId) &&
        String(userId) !== String(currentUser?.id)
      ) {
        if (isTyping) {
          setTypingUsers((prev) => {
            // Check if user is already in the list
            const exists = prev.some(u => String(u.userId) === String(userId));
            if (exists) return prev;
            return [...prev, { userId: String(userId), userName: userName || `User ${userId}` }];
          });
        }
      }
    });

    socketInstance.on("user_stopped", ({ conversationId, userId }) => {
      if (
        selectedChat && 
        String(selectedChat.id) === String(conversationId)
      ) {
        setTypingUsers((prev) => prev.filter(u => String(u.userId) !== String(userId)));
      }
    });

    // Typing indicator listeners for group chats
    socketInstance.on("typing_group", ({ groupId, userId, userName, isTyping }) => {
      // Only show typing indicator if it's for the current group and not the current user
      if (
        selectedChat && 
        String(selectedChat.id) === String(groupId) &&
        String(userId) !== String(currentUser?.id)
      ) {
        if (isTyping) {
          setTypingUsers((prev) => {
            // Check if user is already in the list
            const exists = prev.some(u => String(u.userId) === String(userId));
            if (exists) return prev;
            return [...prev, { userId: String(userId), userName: userName || `User ${userId}` }];
          });
        }
      }
    });

    socketInstance.on("group_stopped", ({ groupId, userId }) => {
      if (
        selectedChat && 
        String(selectedChat.id) === String(groupId)
      ) {
        setTypingUsers((prev) => prev.filter(u => String(u.userId) !== String(userId)));
      }
    });

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
      // Clear typing users when component unmounts or chat changes
      setTypingUsers([])
    }
  }, [currentUser, selectedChat, mapConversationToChat, mapMessageToUi, loadOnlineUsers])

  // Clear typing users when chat changes
  useEffect(() => {
    setTypingUsers([])
  }, [selectedChat?.id])

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

  // Upload file to server and return URL
  const uploadFile = async (file, fileType) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', fileType)
      formData.append('groupId', selectedChat?.id)
      
      const res = await fetch('/api/upload/group-message', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      if (data?.success && data.mediaUrl) {
        return { mediaUrl: data.mediaUrl, mediaType: fileType }
      } else {
        throw new Error(data?.error || 'Upload failed')
      }
    } catch (err) {
      console.error('File upload error:', err)
      throw err
    }
  }

  // Handle message send with optional file
  const handleSendMessage = async (messageData = null) => {
    // Support both old API (just calling handleSendMessage()) and new API (with messageData)
    let content = ''
    let file = null
    let fileType = null
    let mediaUrl = null
    let mediaType = null

    if (messageData) {
      // Called from GroupMessageInput with { text, file, fileType }
      content = messageData.text || ''
      file = messageData.file || null
      fileType = messageData.fileType || null
    } else {
      // Called from old input (for backward compatibility)
      content = messageInput.trim()
    }

    if (!content.trim() && !file) {
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

    const chatId = String(selectedChat.id)
    const senderId = String(currentUser.id)
    const isGroupChat = selectedChat.isGroup || selectedChat.type === 'group'

    // Upload file if present
    if (file) {
      try {
        toast.loading('Uploading file...')
        const uploadResult = await uploadFile(file, fileType)
        mediaUrl = uploadResult.mediaUrl
        mediaType = uploadResult.mediaType
        toast.dismiss()
      } catch (err) {
        toast.error(`File upload failed: ${err.message}`)
        return
      }
    }

    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      senderId: senderId,
      text: content.trim(),
      mediaUrl: mediaUrl || null,
      timestamp: formatTime(new Date().toISOString()),
      isOwn: true,
      isPending: true,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setMessageInput("")

    if (socket && socket.connected) {
      if (isGroupChat) {
        socket.emit("join_group", { groupId: chatId })
      } else {
        socket.emit("join_conversation", { conversationId: chatId })
      }
    }

    const sendViaSocket = () => {
      return new Promise((resolve, reject) => {
        if (!socket || !socket.connected) {
          reject(new Error("Socket not connected"))
          return
        }

        const eventName = isGroupChat ? "send_group_message" : "send_private_message"
        const msgContent = content.trim() || ''
        
        const messagePayload = isGroupChat 
          ? {
              groupId: chatId,
              senderId: senderId,
              content: msgContent,
              mediaUrl: mediaUrl || null,
              mediaType: mediaType || null,
            }
          : {
              conversationId: chatId,
              senderId: senderId,
              content: msgContent,
              mediaUrl: mediaUrl || null,
            }

        socket.emit(
          eventName,
          messagePayload,
          (response) => {
            if (response?.success) {
              setMessages((prev) => {
                const filtered = prev.filter((msg) => msg.id !== tempId)
                const realMessage = mapMessageToUi(response.message)
                return realMessage ? [...filtered, realMessage] : filtered
              })
              
              setChats((prev) => {
                // Format last message preview with proper media handling
                let preview = ""
                if (response.message.content) {
                  preview = response.message.content
                  if (preview.length > 50) {
                    preview = preview.substring(0, 50) + "..."
                  }
                } else if (response.message.media_url) {
                  // Determine media type from URL
                  const url = response.message.media_url.toLowerCase()
                  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                    preview = "📷 Photo"
                  } else if (url.match(/\.(mp4|webm|mov)$/)) {
                    preview = "🎥 Video"
                  } else if (url.match(/\.(mp3|wav|ogg)$/)) {
                    preview = "🎵 Audio"
                  } else {
                    preview = "📎 File"
                  }
                } else {
                  preview = "No messages yet"
                }
                
                return prev.map((chat) => {
                  if (String(chat.id) !== chatId) return chat
                  return {
                    ...chat,
                    lastMessage: preview,
                    timestamp: formatTime(response.message.created_at),
                    sortTime: response.message.created_at, // Update sort time
                  }
                }).sort((a, b) => {
                  // Re-sort chats after updating to maintain most recent first
                  const timeA = a.sortTime ? new Date(a.sortTime).getTime() : 0
                  const timeB = b.sortTime ? new Date(b.sortTime).getTime() : 0
                  return timeB - timeA
                })
              })

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
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      if (messageData) {
        // If called from GroupMessageInput, the input is already cleared
        toast.error("Failed to send message. Please try again.")
      } else {
        setMessageInput(content)
        toast.error("Failed to send message. Please try again.")
      }
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const handleDeleteMessage = async (messageId, isGroupChat = false) => {
    if (!socket || !socket.connected) {
      toast.error("Socket not connected")
      return
    }

    try {
      const eventName = isGroupChat ? "delete_group_message" : "delete_private_message"
      const payload = isGroupChat 
        ? { groupId: selectedChat.id, messageId }
        : { conversationId: selectedChat.id, messageId }

      socket.emit(eventName, payload, (response) => {
        if (response?.success) {
          setMessages((prev) => prev.filter((msg) => String(msg.id) !== String(messageId)))
          toast.success("Message deleted")
        } else {
          toast.error(response?.error || "Failed to delete message")
        }
      })
    } catch (err) {
      console.error("Error deleting message:", err)
      toast.error("Failed to delete message")
    }
  }

  const getMediaType = (mediaUrl) => {
    if (!mediaUrl) return null
    const url = mediaUrl.toLowerCase()
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image'
    if (url.match(/\.(mp4|webm|mov|avi)$/)) return 'video'
    if (url.match(/\.(mp3|wav|ogg|m4a)$/)) return 'audio'
    if (url.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/)) return 'document'
    return 'file'
  }

  const MediaMessage = ({ mediaUrl, mediaType, message, isOwn }) => {
    const type = getMediaType(mediaUrl)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef(null)

    if (!mediaUrl) return null

    if (type === 'image') {
      return (
        <div className="mb-2">
          <img 
            src={mediaUrl} 
            alt="shared" 
            className="max-w-xs max-h-96 rounded-lg object-cover cursor-pointer hover:opacity-90 transition"
            onError={(e) => {
              e.target.src = '/default.png'
            }}
          />
        </div>
      )
    }

    if (type === 'video') {
      return (
        <div className="mb-2 max-w-xs">
          <video 
            controls 
            className="w-full rounded-lg bg-black"
            controlsList="nodownload"
          >
            <source src={mediaUrl} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (type === 'audio') {
      return (
        <div className="mb-2 min-w-[250px]">
          <div className={`flex items-center gap-2 ${isOwn ? 'bg-green-700' : isDark ? 'bg-gray-600' : 'bg-gray-200'} p-3 rounded-lg`}>
            <button
              onClick={() => {
                if (audioRef.current) {
                  if (isPlaying) {
                    audioRef.current.pause()
                  } else {
                    audioRef.current.play()
                  }
                  setIsPlaying(!isPlaying)
                }
              }}
              className={`flex-shrink-0 ${isOwn ? 'text-white' : 'text-gray-700'}`}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <audio 
              ref={audioRef}
              src={mediaUrl}
              onEnded={() => setIsPlaying(false)}
              className="flex-1"
            />
            <span className={`text-sm ${isOwn ? 'text-white/70' : 'text-gray-600'}`}>
              Voice message
            </span>
            <a
              href={mediaUrl}
              download
              className={`flex-shrink-0 ${isOwn ? 'text-white hover:text-green-200' : 'text-gray-700 hover:text-gray-900'}`}
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        </div>
      )
    }

    if (type === 'document') {
      const fileName = mediaUrl.split('/').pop()
      return (
        <div className="mb-2">
          <a
            href={mediaUrl}
            download
            className={`flex items-center gap-2 ${isOwn ? 'bg-green-700 hover:bg-green-800 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} p-3 rounded-lg max-w-xs`}
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm truncate flex-1">{fileName}</span>
            <Download className="h-4 w-4 flex-shrink-0" />
          </a>
        </div>
      )
    }

    return (
      <div className="mb-2">
        <a
          href={mediaUrl}
          download
          className={`flex items-center gap-2 ${isOwn ? 'bg-green-700 hover:bg-green-800 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} p-3 rounded-lg max-w-xs`}
        >
          <FileText className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm truncate flex-1">File</span>
          <Download className="h-4 w-4 flex-shrink-0" />
        </a>
      </div>
    )
  }

  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji)
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
        <div className="flex flex gap-16 max-w-full">
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
                          ? `ring-1 ring-green-500 ring-offset-2 ${isDark ? 'ring-offset-gray-800' : 'ring-offset-white'}` 
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
                            <span className={`absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 ${onlineStatus} rounded-full flex items-center justify-center`}>
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
                                  </div>
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
        <main className={`flex-1 flex ${showConversation ? 'flex' : 'hidden lg:flex'} w-[850px]`}>
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
                    {/* <div className="flex justify-center sticky top-0 z-10">
                      <Badge variant="secondary" className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-600'} backdrop-blur-sm`}>
                        {result}
                      </Badge>
                    </div> */}

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
                            className={`flex items-end gap-2 group ${message.isOwn ? "flex-row-reverse" : ""}`}
                          >
                            {!message.isOwn && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={selectedChat?.user?.avatar || "/default.png"} alt={selectedChat?.user?.name} />
                                <AvatarFallback className={`text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                  {selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex flex-col gap-1 relative max-w-lg">
                              <div
                                className={`rounded-2xl px-4 py-3 transition-all duration-200 break-words word-break ${
                                  message.isOwn
                                    ? `${messageBgOwn} text-white rounded-br-sm`
                                    : `${messageBgOther} ${textColor} rounded-bl-sm border ${borderColor}`
                                }`}
                              >
                                {/* Media Display */}
                                {message.mediaUrl && (
                                  <MediaMessage 
                                    mediaUrl={message.mediaUrl} 
                                    mediaType={message.mediaType}
                                    message={message}
                                    isOwn={message.isOwn}
                                  />
                                )}
                                
                                {/* Text Content */}
                                {message.text && (
                                  <>
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
                                  </>
                                )}
                                <p
                                  className={`text-xs mt-1 ${message.isOwn ? "text-white/70" : textMuted}`}
                                >
                                  {message.timestamp}
                                </p>
                              </div>
                              
                              {/* Delete Button - Only for own messages */}
                              {message.isOwn && !message.isPending && (
                                <button
                                  onClick={() => handleDeleteMessage(message.id, selectedChat.isGroup || selectedChat.type === 'group')}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-end"
                                  title="Delete message"
                                >
                                  <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Typing Indicator */}
                        {typingUsers.length > 0 && (
                          <div className="flex items-center gap-2">
                            {selectedChat?.isGroup || selectedChat?.type === 'group' ? (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className={`text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                  <Users className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={selectedChat?.user?.avatar || "/default.png"} alt={selectedChat?.user?.name} />
                                <AvatarFallback className={`text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                  {selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`rounded-2xl px-4 py-3 ${messageBgOther} ${textColor} rounded-bl-sm border ${borderColor}`}>
                              <div className="flex items-center gap-1">
                                <span className={`text-sm italic ${textMuted}`}>
                                  {typingUsers.length === 1 
                                    ? `${typingUsers[0].userName} is typing...`
                                    : typingUsers.length === 2
                                    ? `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`
                                    : `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing...`
                                  }
                                </span>
                                <div className="flex gap-1 ml-2">
                                  <span className={`w-2 h-2 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                                  <span className={`w-2 h-2 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                                  <span className={`w-2 h-2 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
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
                  <GroupMessageInput
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    onSendMessage={handleSendMessage}
                    disabled={isLoadingMessages}
                    isDark={isDark}
                    inputBg={inputBg}
                    borderColor={borderColor}
                    textColor={textColor}
                    textMuted={textMuted}
                    showEmoji={showEmoji}
                    setShowEmoji={setShowEmoji}
                    onEmojiSelect={handleEmojiSelect}
                    socket={socket}
                    currentUserId={currentUser?.id}
                    selectedChat={selectedChat}
                  />
                </div>
              </>
            )}
          </Card>
        </main>
        </div>
      </div>
    </div>
  )
}