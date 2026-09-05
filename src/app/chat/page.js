"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"

import { useTheme } from '@/lib/theme'

import { createAppSocket, joinUserRoom } from "@/lib/socket/client"
import { CALL_SIGNALING_EVENTS } from "@/lib/videocall/callConstants"
import { getStoredUser } from "@/lib/videocall/callUser"
import { useIncomingCallStore } from "@/stores/incomingCallStore"

// import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks"

import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';

import { Card } from "@/components/ui/card"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Button } from "@/components/ui/button"

import UserSearchDialog from "./userSearchBox"

import { Input } from "@/components/ui/input"

import { ScrollArea } from "@/components/ui/scroll-area"

import { Badge } from "@/components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog'


import toast from "react-hot-toast"

import {

  Send,

  Phone,

  Video,

  MoreVertical,

  Search,

  PartyPopper,

  ImageIcon,

  MessageSquare,

  FileText,

  Mic,

  Lightbulb,

  ArrowLeft,

  X,

  Users,

  Plus,

  Loader2,

  Download,

  Trash2,
  UserRound,
  Play,

  Pause,
  Reply,

  Paperclip,

  ChevronUp,

  Camera,

  Music,
  User,
  Crown,

} from "lucide-react"

import GroupMessageInput from "./GroupMessageInput"

import dynamic from 'next/dynamic';

import { useMessageStore } from '@/stores/messageStore';



const EmojiPicker = dynamic(

  () => import('@/components/emojiPicker'),

  { ssr: false }

);



// ─────────────────────────────────────────────

// Slide animation styles injected once

// ─────────────────────────────────────────────

const slideStyles = `

  @keyframes slideInFromRight {

    from { transform: translateX(100%); opacity: 0; }

    to   { transform: translateX(0);    opacity: 1; }

  }

  @keyframes slideOutToLeft {

    from { transform: translateX(0);    opacity: 1; }

    to   { transform: translateX(-100%); opacity: 0; }

  }

  @keyframes slideInFromLeft {

    from { transform: translateX(-100%); opacity: 0; }

    to   { transform: translateX(0);     opacity: 1; }

  }

  @keyframes slideOutToRight {

    from { transform: translateX(0);     opacity: 1; }

    to   { transform: translateX(100%);  opacity: 0; }

  }



  .slide-in-right  { animation: slideInFromRight  0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }

  .slide-out-left  { animation: slideOutToLeft    0.28s cubic-bezier(0.55, 0, 1, 0.45) both; }

  .slide-in-left   { animation: slideInFromLeft   0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }

  .slide-out-right { animation: slideOutToRight   0.28s cubic-bezier(0.55, 0, 1, 0.45) both; }



  /* Mobile panel wrapper */

  .mobile-panel {

    position: absolute;

    inset: 0;

    will-change: transform, opacity;

    overflow: hidden;

    max-height: calc(100vh - 144px);

  }



  /* Media picker dropdown */

  .media-picker-enter {

    animation: mediaPickerIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;

  }

  @keyframes mediaPickerIn {

    from { opacity: 0; transform: translateY(8px) scale(0.96); }

    to   { opacity: 1; transform: translateY(0)   scale(1); }

  }



  /* Bounce dots */

  @keyframes typingDot {

    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }

    30%           { transform: translateY(-5px); opacity: 1; }

  }

  .typing-dot { animation: typingDot 1.2s infinite; }

`;



function StyleInjector() {

  useEffect(() => {

    const id = "chat-slide-styles";

    if (!document.getElementById(id)) {

      const style = document.createElement("style");

      style.id = id;

      style.textContent = slideStyles;

      document.head.appendChild(style);

    }

  }, []);

  return null;

}



// ─────────────────────────────────────────────

// Media attachment picker (replaces 4 icon buttons)

// ─────────────────────────────────────────────

function MediaPickerButton({ onSelect, isDark, borderColor }) {

  const [open, setOpen] = useState(false);

  const ref = useRef(null);



  useEffect(() => {

    const handler = (e) => {

      if (ref.current && !ref.current.contains(e.target)) setOpen(false);

    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);

  }, []);



  const options = [

    { icon: ImageIcon, label: "Image / Video", accept: "image/*,video/*", type: "image" },

    { icon: Music, label: "Audio", accept: "audio/*", type: "audio" },

    { icon: Mic, label: "Voice note", accept: "audio/*", type: "audio" },

    { icon: FileText, label: "Document", accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt", type: "document" },

  ];



  const triggerFileInput = (accept, type) => {

    const input = document.createElement("input");

    input.type = "file";

    input.accept = accept;

    input.onchange = (e) => {

      const file = e.target.files?.[0];

      if (file) onSelect(file, type);

      setOpen(false);

    };

    input.click();

  };



  return (

    <div className="relative" ref={ref}>

      <button

        type="button"

        onClick={() => setOpen((v) => !v)}

        title="Attach media"

        className={`

          flex items-center justify-center w-9 h-9 rounded-xl

          transition-all duration-200

          ${isDark

            ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"

            : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700"}

          ${open ? (isDark ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700") : ""}

        `}

      >

        <Paperclip className="w-4 h-4" />

      </button>



      {open && (

        <div className={`

          media-picker-enter

          absolute bottom-full left-0 mb-2 z-50

          rounded-2xl border shadow-2xl overflow-hidden

          ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}

          min-w-[180px]

        `}>

          {options.map(({ icon: Icon, label, accept, type }) => (

            <button

              key={label}

              type="button"

              onClick={() => triggerFileInput(accept, type)}

              className={`

                flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium

                transition-colors duration-150

                ${isDark

                  ? "text-gray-200 hover:bg-gray-700"

                  : "text-gray-700 hover:bg-gray-50"}

              `}

            >

              <Icon className="w-4 h-4 flex-shrink-0 text-green-500" />

              {label}

            </button>

          ))}

        </div>

      )}

    </div>

  );

}



export default function ChatPage() {

  const [currentUser, setCurrentUser] = useState(null)

  const [socket, setSocket] = useState(null)

  const [selectedChat, setSelectedChat] = useState(null)

  const [messageInput, setMessageInput] = useState("")

  const [showConversation, setShowConversation] = useState(false)

  // Animation state: "list" | "entering-chat" | "chat" | "leaving-chat"

  const [mobileView, setMobileView] = useState("list")

  const [searchQuery, setSearchQuery] = useState("")

  const [chats, setChats] = useState([])

  const [messages, setMessages] = useState([])

  const [onlineUsers, setOnlineUsers] = useState([])

  const [isLoadingOnlineUsers, setIsLoadingOnlineUsers] = useState(false)

  const { theme } = useTheme()

  const [isLoadingChats, setIsLoadingChats] = useState(false)

  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const [showEmoji, setShowEmoji] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [confirm, confirmDialog] = useConfirmDialog()
  const setIncomingCall = useIncomingCallStore((s) => s.setIncomingCall)
  const clearIncomingCall = useIncomingCallStore((s) => s.clearIncomingCall)

  const [typingMap, setTypingMap] = useState({})

  // Derived list of typing users for the currently selected chat
  const typingUsers = selectedChat ? (typingMap[String(selectedChat.id)] || []) : []

  const { resolvedTheme } = useTheme();



  const {

    unreadCounts,

    totalUnreadCount,

    setUnreadCounts,

    updateUnreadCount,

    markAsRead,

    incrementUnreadCount,

    addParticipant,

    removeParticipant

  } = useMessageStore();



  const messagesEndRef = useRef(null)

  const messagesContainerRef = useRef(null)

  const [controlOpen, setControlOpen] = useState(false)

  const today = new Date();

  const formatted = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const result = `Today, ${formatted}`;



  const formatTime = (dateString) => {

    if (!dateString) return ""

    try {

      const date = new Date(dateString)

      if (Number.isNaN(date.getTime())) return ""

      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    } catch { return "" }

  }

  const buildReplyPreview = useCallback((message) => {
    if (!message) return null
    const rawText = (message.text || "").trim()
    const previewText = rawText
      ? rawText.slice(0, 120)
      : message.mediaUrl
        ? "Media attachment"
        : "Message"
    return {
      id: String(message.id),
      senderId: String(message.senderId || ""),
      senderName: message.isOwn ? "You" : (selectedChat?.user?.name || "User"),
      text: previewText,
    }
  }, [selectedChat?.user?.name])

  const parseReplyFromContent = useCallback((content) => {
    const text = (content || "").trim()
    const marker = "\n\n↪ Reply to: "
    const idx = text.lastIndexOf(marker)
    if (idx === -1) return { text, replyToText: null }
    const mainText = text.slice(0, idx).trim()
    const replyToText = text.slice(idx + marker.length).trim()
    return {
      text: mainText,
      replyToText: replyToText || null,
    }
  }, [])



  const scrollToBottom = () => {

    if (messagesEndRef.current) {

      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })

    }

  }



  useEffect(() => { scrollToBottom() }, [messages])



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

      let lastMessageText = ""

      if (conversation.last_message) {

        lastMessageText = parseReplyFromContent(conversation.last_message).text

        if (lastMessageText.length > 50) lastMessageText = lastMessageText.substring(0, 50) + "..."

      } else if (conversation.last_message_media) {

        const url = conversation.last_message_media.toLowerCase()

        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) lastMessageText = "📷 Photo"

        else if (url.match(/\.(mp4|webm|mov)$/)) lastMessageText = "🎥 Video"

        else if (url.match(/\.(mp3|wav|ogg)$/)) lastMessageText = "🎵 Audio"

        else lastMessageText = "📎 File"

      } else { lastMessageText = "No messages yet" }

      const messageTime = conversation.last_message_time || conversation.created_at
      return {

        id: String(conversation.id),

        type: 'private',

        user: otherUser,

        lastMessage: lastMessageText,

        timestamp: formatTime(messageTime),

        sortTime: messageTime,

        unread: conversation.unread || 0,

      }

    },

    [currentUser, parseReplyFromContent]

  )



  const mapGroupToChat = useCallback(

    (group, profileLookup = {}) => {

      if (!group || !currentUser) return null

      const members = typeof group.members === 'string' ? JSON.parse(group.members) : group.members

      const memberArray = Array.isArray(members) ? members : []

      const memberObjs = memberArray.map((id) => {

        const key = String(id)

        const profile = profileLookup[key]

        const firstName = profile?.first_name || ''
        const rwandanName = profile?.rwandan_name || ''
        const displayName = [firstName, rwandanName].filter(Boolean).join(' ') || profile?.username || `User ${key}`

        return {

          id: key,

          name: displayName,

          avatar: profile?.profile_image || '/default.png',

        }

      })

      let lastMessageText = ""

      if (group.last_message) {

        lastMessageText = parseReplyFromContent(group.last_message).text

        if (lastMessageText.length > 50) lastMessageText = lastMessageText.substring(0, 50) + "..."

      } else if (group.last_message_media) {

        const url = group.last_message_media.toLowerCase()

        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) lastMessageText = "📷 Photo"

        else if (url.match(/\.(mp4|webm|mov)$/)) lastMessageText = "🎥 Video"

        else if (url.match(/\.(mp3|wav|ogg)$/)) lastMessageText = "🎵 Audio"

        else lastMessageText = "📎 File"

      } else { lastMessageText = "No messages yet" }

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

          adminId: String(group.created_by ?? ""),

        },

        lastMessage: lastMessageText,

        timestamp: formatTime(messageTime),

        sortTime: messageTime,

        unread: group.unread || 0,

        isGroup: true,

        description: group.description || '',

      }

    },

    [currentUser, parseReplyFromContent]

  )



  // ─── Navigate to chat with smooth slide ───

  const handleChatSelect = (chat) => {

    setSelectedChat(chat)

    setShowConversation(true)

    setMobileView("chat")



    if (chat?.id) {

      const conversationId = String(chat.id)

      const isGroupChat = chat.isGroup || chat.type === 'group'

      // Update store optimistically and persist to DB

      markAsRead(conversationId)

      if (currentUser?.id) {

        fetch("/api/chat/mark-read", {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

            userId: currentUser.id,

            conversationId,

            conversationType: isGroupChat ? "group" : "private",

          }),

        }).catch((err) => console.error("Failed to mark conversation as read:", err))

      }

      if (socket) {

        if (socket.connected) {

          if (isGroupChat) socket.emit("join_group", { groupId: conversationId })

          else socket.emit("join_conversation", { conversationId })

        } else {

          socket.once("connect", () => {

            if (isGroupChat) socket.emit("join_group", { groupId: conversationId })

            else socket.emit("join_conversation", { conversationId })

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
      const parsed = parseReplyFromContent(message.content || "")
      return {

        id: String(message.id),

        senderId: String(message.sender_id),

        text: parsed.text,
        replyToText: parsed.replyToText,

        mediaUrl: message.media_url || null,

        timestamp: formatTime(message.created_at),

        isOwn: String(message.sender_id) === String(currentUser.id),

      }

    },

    [currentUser, parseReplyFromContent]

  )



  const loadMessagesForConversation = useCallback(

    async (conversationId, isGroupChat = false) => {

      if (!conversationId) return

      setIsLoadingMessages(true)

      try {

        const endpoint = isGroupChat

          ? `/api/group-conversation/${conversationId}/messages`

          : `/api/privatechat/messages?conversationId=${conversationId}`

        const res = await fetch(endpoint)

        const data = await res.json()

        if (data?.success && Array.isArray(data.data)) {

          setMessages(data.data.map(mapMessageToUi).filter(Boolean))

        } else { setMessages([]) }

      } catch (err) {

        console.error("Error loading messages", err)

        setMessages([])

      } finally { setIsLoadingMessages(false) }

    },

    [mapMessageToUi]

  )



  useEffect(() => {

    setCurrentUser(getStoredUser())

  }, [])



  const startConversationWithUser = useCallback(async (user) => {

    if (!currentUser?.id || !user?.id) return

    try {

      const res = await fetch("/api/privatechat", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ user1: currentUser.id, user2: user.id }),

      })

      const data = await res.json()

      if (!data?.success || !data.data) { toast.error("Failed to create conversation."); return }

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

      try { setControlOpen(false) } catch { }

    }

  }, [currentUser, mapConversationToChat, handleChatSelect])



  useEffect(() => {

    if (!currentUser?.id) return

    const loadConversations = async () => {

      setIsLoadingChats(true)

      try {

        const privateRes = await fetch(`/api/privatechat/userid?userid=${currentUser.id}`)

        const privateData = await privateRes.json();

        const groupRes = await fetch(`/api/group-conversation?userId=${currentUser.id}`)

        const groupData = await groupRes.json();

        const allChats = []

        if (privateData?.success && Array.isArray(privateData.data)) {

          allChats.push(...privateData.data.map(mapConversationToChat).filter(Boolean))

        }

        let profileLookup = {}

        try {

          const usersRes = await fetch('/api/users/all')

          const usersJson = await usersRes.json()

          if (usersJson?.users && Array.isArray(usersJson.users)) {

            usersJson.users.forEach(u => { if (u.id) profileLookup[String(u.id)] = u })

          }

        } catch (e) { console.error('Error fetching user profiles for groups:', e) }

        if (groupData?.success && Array.isArray(groupData.data)) {

          allChats.push(...groupData.data.map((g) => mapGroupToChat(g, profileLookup)).filter(Boolean))

        }

        allChats.sort((a, b) => {

          const timeA = a.sortTime ? new Date(a.sortTime).getTime() : 0

          const timeB = b.sortTime ? new Date(b.sortTime).getTime() : 0

          if (timeA === timeB) return 0

          return timeB - timeA

        })

        setChats(allChats)

        // Sync unread counts from API into store for badge display

        const counts = {}

        allChats.forEach((c) => {

          const n = parseInt(c.unread || 0, 10)

          if (n > 0) counts[c.id] = n

        })

        setUnreadCounts(counts)

      } catch (err) {

        console.error("Error loading conversations", err)

        setChats([])

      } finally { setIsLoadingChats(false) }

    }

    loadConversations()

  }, [currentUser, mapConversationToChat, mapGroupToChat])//this were once in this dependency  loadMessagesForConversation, selectedChat



  const loadOnlineUsers = useCallback(async () => {

    if (!currentUser?.id) return

    setIsLoadingOnlineUsers(true)

    try {

      const res = await fetch(`/api/online-users?excludeUserId=${currentUser.id}`)

      const data = await res.json()

      if (data?.success && Array.isArray(data.data)) setOnlineUsers(data.data)

      else setOnlineUsers([])

    } catch (err) {

      console.error("Error loading online users", err)

      setOnlineUsers([])

    } finally { setIsLoadingOnlineUsers(false) }

  }, [currentUser])



  useEffect(() => { loadOnlineUsers() }, [loadOnlineUsers])



  useEffect(() => {

    if (onlineUsers.length === 0 && chats.length === 0) return

    setChats((prev) =>

      prev.map((chat) => {

        const isOnline = onlineUsers.some(user => String(user.id) === String(chat.user.id))

        return { ...chat, user: { ...chat.user, status: isOnline ? "online" : (chat.user.status || "offline") } }

      })

    )

  }, [onlineUsers])



  useEffect(() => {

    if (!currentUser?.id) return

    const socketInstance = createAppSocket()

    setSocket(socketInstance)

    const joinChatRooms = () => {
      joinUserRoom(socketInstance, currentUser.id)
      socketInstance.emit("join_notifications", { userId: currentUser.id })

      if (selectedChat?.id) {

        const isGroupChat = selectedChat.isGroup || selectedChat.type === 'group'

        if (isGroupChat) socketInstance.emit("join_group", { groupId: selectedChat.id })

        else socketInstance.emit("join_conversation", { conversationId: selectedChat.id })

      }

      socketInstance.emit("get_online_users")
    }

    const onIncomingCall = (payload) => {
      if (!payload?.callId) return
      setIncomingCall(payload)
    }

    const onIncomingCallExpired = (payload) => {
      const current = useIncomingCallStore.getState().incomingCall
      if (!current || String(current.callId) !== String(payload?.callId)) return
      toast.error("Call timed out")
      clearIncomingCall()
    }

    const onIncomingCallCancelled = (payload) => {
      const current = useIncomingCallStore.getState().incomingCall
      if (!current || String(current.callId) !== String(payload?.callId)) return
      toast.error("Caller cancelled the call")
      clearIncomingCall()
    }

    socketInstance.on("connect", () => {
      console.log("Chat Socket connected successfully")
      joinChatRooms()
    })

    socketInstance.on("reconnect", () => {
      joinChatRooms()
    })
    socketInstance.on("connect_error", (err) => {
      console.error("Chat Socket connect_error:", err)
    })

    socketInstance.on(CALL_SIGNALING_EVENTS.incoming, onIncomingCall)
    socketInstance.on(CALL_SIGNALING_EVENTS.expired, onIncomingCallExpired)
    socketInstance.on(CALL_SIGNALING_EVENTS.cancelled, onIncomingCallCancelled)

    socketInstance.on("online_users_list", (data) => {

      if (data?.users && Array.isArray(data.users)) {

        setOnlineUsers(data.users.filter(user => String(user.id) !== String(currentUser.id)))

      }

    })



    socketInstance.on("user_online", ({ userId }) => {

      if (String(userId) !== String(currentUser.id)) {

        loadOnlineUsers()

        setChats((prev) => prev.map((chat) =>

          String(chat.user.id) === String(userId)

            ? { ...chat, user: { ...chat.user, status: "online" } } : chat

        ))

      }

    })



    socketInstance.on("user_offline", ({ userId }) => {

      if (String(userId) !== String(currentUser.id)) {

        setOnlineUsers((prev) => prev.filter(user => String(user.id) !== String(userId)))

        setChats((prev) => prev.map((chat) =>

          String(chat.user.id) === String(userId)

            ? { ...chat, user: { ...chat.user, status: "offline" } } : chat

        ))

      }

    })



    socketInstance.on("private_conversation_created", (conversation) => {

      setChats((prev) => {

        const exists = prev.some((c) => String(c.id) === String(conversation.id))

        const mapped = mapConversationToChat(conversation)

        if (!mapped) return prev

        if (exists) return prev.map((c) => (String(c.id) === String(conversation.id) ? mapped : c))

        return [mapped, ...prev]

      })

    })



    socketInstance.on("private_message", (message) => {

      console.log("Received private message:", message);

      const convId = String(message.conversation_id)

      const msgId = String(message.id)

      if (String(message.sender_id) !== String(currentUser?.id)) {
        console.log(`Message from ${message || 'Someone'} in conversation ${convId}`)

        toast.success(`New message from ${message.sender_name || 'Someone'}`);

        if (!selectedChat || String(selectedChat.id) !== convId) {

          incrementUnreadCount(convId);

        }

      }

      setMessages((prev) => {

        if (!selectedChat || String(selectedChat.id) !== convId) return prev

        if (String(message.sender_id) === String(currentUser?.id)) return prev

        const exists = prev.some((msg) =>

          String(msg.id) === msgId ||

          (msg.isPending && msg.text === message.content && String(msg.senderId) === String(message.sender_id))

        )

        if (exists) {

          return prev.map((msg) => {

            if (msg.isPending && msg.text === message.content && String(msg.senderId) === String(message.sender_id)) {

              const mapped = mapMessageToUi(message)

              return mapped || msg

            }

            return msg

          })

        }

        const mapped = mapMessageToUi(message)

        if (!mapped) return prev

        const filtered = prev.filter((msg) =>

          !(msg.isPending && msg.text === message.content && String(msg.senderId) === String(message.sender_id))

        )

        return [...filtered, mapped]

      })

      setChats((prev) =>

        prev.map((chat) => {

          if (String(chat.id) !== convId) return chat

          let preview = ""

          if (message.content) {
            const parsedPreview = parseReplyFromContent(message.content).text
            preview = parsedPreview.length > 50 ? parsedPreview.substring(0, 50) + "..." : parsedPreview

          } else if (message.media_url) {

            const url = message.media_url.toLowerCase()

            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) preview = "📷 Photo"

            else if (url.match(/\.(mp4|webm|mov)$/)) preview = "🎥 Video"

            else if (url.match(/\.(mp3|wav|ogg)$/)) preview = "🎵 Audio"

            else preview = "📎 File"

          } else { preview = "No messages yet" }

          const isCurrentConversation = selectedChat && String(selectedChat.id) === convId

          return {

            ...chat,

            lastMessage: preview,

            timestamp: formatTime(message.created_at),

            sortTime: message.created_at,

            unread: isCurrentConversation ? 0 : (chat.unread || 0) + 1,

          }

        })

      )

    })



    socketInstance.on("group_message", (message) => {

      console.log("Received group message:", message);

      const groupId = String(message.group_id)

      const msgId = String(message.id)

      if (String(message.sender_id) !== String(currentUser?.id)) {

        toast.success(`New message in ${message.group_name || 'group'}`);

        if (!selectedChat || String(selectedChat.id) !== groupId) {

          incrementUnreadCount(groupId);

        }

      }

      setMessages((prev) => {

        if (!selectedChat || String(selectedChat.id) !== groupId) return prev

        if (String(message.sender_id) === String(currentUser?.id)) return prev

        const exists = prev.some((msg) =>

          String(msg.id) === msgId ||

          (msg.isPending && msg.text === message.content && String(msg.senderId) === String(message.sender_id))

        )

        if (exists) {

          return prev.map((msg) => {

            if (msg.isPending && msg.text === message.content && String(msg.senderId) === String(message.sender_id)) {

              const mapped = mapMessageToUi(message)

              return mapped || msg

            }

            return msg

          })

        }

        const mapped = mapMessageToUi(message)

        if (!mapped) return prev

        const filtered = prev.filter((msg) =>

          !(msg.isPending && msg.text === message.content && String(msg.senderId) === String(message.sender_id))

        )

        return [...filtered, mapped]

      })

      setChats((prev) =>

        prev.map((chat) => {

          if (String(chat.id) !== groupId) return chat

          let preview = ""

          if (message.content) {
            const parsedPreview = parseReplyFromContent(message.content).text
            preview = parsedPreview.length > 50 ? parsedPreview.substring(0, 50) + "..." : parsedPreview

          } else if (message.media_url) {

            const url = message.media_url.toLowerCase()

            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) preview = "📷 Photo"

            else if (url.match(/\.(mp4|webm|mov)$/)) preview = "🎥 Video"

            else if (url.match(/\.(mp3|wav|ogg)$/)) preview = "🎵 Audio"

            else preview = "📎 File"

          } else { preview = "No messages yet" }

          const isCurrentConversation = selectedChat && String(selectedChat.id) === groupId

          return {

            ...chat,

            lastMessage: preview,

            timestamp: formatTime(message.created_at),

            sortTime: message.created_at,

            unread: isCurrentConversation ? 0 : (chat.unread || 0) + 1,

          }

        })

      )

    })



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



    // Track typing per conversation/group so we can show indicators in lists and headers
    socketInstance.on("typing_private", ({ conversationId, userId, userName, isTyping }) => {
      try {
        const key = String(conversationId)
        if (String(userId) === String(currentUser?.id)) return
        if (isTyping) {
          setTypingMap((prev) => {
            const list = Array.isArray(prev[key]) ? [...prev[key]] : []
            const exists = list.some(u => String(u.userId) === String(userId))
            if (exists) return prev
            list.push({ userId: String(userId), userName: userName || `User ${userId}` })
            return { ...prev, [key]: list }
          })
        }
      } catch (e) { console.error('typing_private handler error', e) }
    });

    socketInstance.on("user_stopped", ({ conversationId, userId }) => {
      try {
        const key = String(conversationId)
        setTypingMap((prev) => {
          const list = Array.isArray(prev[key]) ? prev[key].filter(u => String(u.userId) !== String(userId)) : []
          if (list.length === 0) {
            const copy = { ...prev }
            delete copy[key]
            return copy
          }
          return { ...prev, [key]: list }
        })
      } catch (e) { console.error('user_stopped handler error', e) }
    });

    socketInstance.on("typing_group", ({ groupId, userId, userName, isTyping }) => {
      try {
        const key = String(groupId)
        if (String(userId) === String(currentUser?.id)) return
        if (isTyping) {
          setTypingMap((prev) => {
            const list = Array.isArray(prev[key]) ? [...prev[key]] : []
            const exists = list.some(u => String(u.userId) === String(userId))
            if (exists) return prev
            list.push({ userId: String(userId), userName: userName || `User ${userId}` })
            return { ...prev, [key]: list }
          })
        }
      } catch (e) { console.error('typing_group handler error', e) }
    });

    socketInstance.on("group_stopped", ({ groupId, userId }) => {
      try {
        const key = String(groupId)
        setTypingMap((prev) => {
          const list = Array.isArray(prev[key]) ? prev[key].filter(u => String(u.userId) !== String(userId)) : []
          if (list.length === 0) {
            const copy = { ...prev }
            delete copy[key]
            return copy
          }
          return { ...prev, [key]: list }
        })
      } catch (e) { console.error('group_stopped handler error', e) }
    });



    socketInstance.on("new_notification", (notification) => {

      if (notification.type === 'message') toast.success(notification.title);

    });



    socketInstance.on("notification_count_updated", ({ unreadCount: count }) => {

      console.log("Notification count updated:", count);

    });



    const activityInterval = setInterval(() => {

      if (socketInstance.connected) socketInstance.emit("user_activity")

    }, 30000)



    socketInstance.on("disconnect", () => {

      console.log("Chat socket disconnected");

      clearInterval(activityInterval)

    })



    return () => {

      clearInterval(activityInterval)

      socketInstance.off(CALL_SIGNALING_EVENTS.incoming, onIncomingCall)
      socketInstance.off(CALL_SIGNALING_EVENTS.expired, onIncomingCallExpired)
      socketInstance.off(CALL_SIGNALING_EVENTS.cancelled, onIncomingCallCancelled)

      socketInstance.disconnect()

      setTypingMap({})

    }

  }, [currentUser, selectedChat, mapConversationToChat, mapMessageToUi, loadOnlineUsers, parseReplyFromContent, setIncomingCall, clearIncomingCall])



  useEffect(() => {
    setReplyToMessage(null)
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

    return messages.filter(message => message.text.toLowerCase().includes(query))

  }, [messages, searchQuery, showConversation])



  // ─── Back navigation with slide ───

  const handleBackToChats = () => {

    setMobileView("list")

    setShowConversation(false)

    setSearchQuery("")

  }



  const [open, setOpen] = useState(false)

  const [status, setStatus] = useState(null)



  const uploadFile = async (file, fileType) => {

    try {

      const formData = new FormData()

      formData.append('file', file)

      formData.append('fileType', fileType)

      formData.append('groupId', selectedChat?.id)

      const res = await fetch('/api/upload/group-message', { method: 'POST', body: formData })

      const data = await res.json()

      if (data?.success && data.mediaUrl) return { mediaUrl: data.mediaUrl, mediaType: fileType }

      else throw new Error(data?.error || 'Upload failed')

    } catch (err) {

      console.error('File upload error:', err)

      throw err

    }

  }



  const handleSendMessage = async (messageData = null) => {

    let content = ''

    let file = null

    let fileType = null

    let mediaUrl = null

    let mediaType = null
    let replyMeta = null



    if (messageData) {

      content = messageData.text || ''

      file = messageData.file || null

      fileType = messageData.fileType || null
      replyMeta = messageData.replyTo || null

    } else {

      content = messageInput.trim()
      replyMeta = replyToMessage

    }



    if (!content.trim() && !file) { toast.error("Message cannot be empty"); return }

    if (!currentUser?.id) { toast.error("You must be logged in to send messages"); return }

    if (!selectedChat?.id) { toast.error("No conversation selected"); return }



    const chatId = String(selectedChat.id)

    const senderId = String(currentUser.id)

    const isGroupChat = selectedChat.isGroup || selectedChat.type === 'group'



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



    const textContent = content.trim()
    const replySuffix = replyMeta?.text && textContent ? `\n\n↪ Reply to: ${replyMeta.text}` : ""
    const finalContent = `${textContent}${replySuffix}`.trim()
    const tempId = `temp-${Date.now()}`

    const optimisticMessage = {

      id: tempId,

      senderId: senderId,

      text: textContent,
      replyToText: replyMeta?.text || null,

      mediaUrl: mediaUrl || null,

      timestamp: formatTime(new Date().toISOString()),

      isOwn: true,

      isPending: true,

    }



    setMessages((prev) => [...prev, optimisticMessage])

    setMessageInput("")
    setReplyToMessage(null)



    if (socket && socket.connected) {

      if (isGroupChat) socket.emit("join_group", { groupId: chatId })

      else socket.emit("join_conversation", { conversationId: chatId })

    }



    const sendViaSocket = () => {

      const waitForConnect = (sock, timeout = 5000) => {
        return new Promise((res, rej) => {
          if (!sock) return rej(new Error('No socket'))
          if (sock.connected) return res()
          const onConnect = () => { cleanup(); res() }
          const onError = (err) => { cleanup(); rej(err || new Error('connect_error')) }
          const timer = setTimeout(() => { cleanup(); rej(new Error('Socket connect timeout')) }, timeout)
          const cleanup = () => {
            clearTimeout(timer)
            try { sock.off('connect', onConnect); sock.off('connect_error', onError); sock.off('connect_timeout', onError) } catch (_) {}
          }
          sock.on('connect', onConnect)
          sock.on('connect_error', onError)
          sock.on('connect_timeout', onError)
        })
      }

      return new Promise(async (resolve, reject) => {

        if (!socket) { reject(new Error("Socket not connected")); return }

        try {
          if (!socket.connected) {
            await waitForConnect(socket, 5000)
          }
        } catch (e) {
          return reject(new Error("Socket not connected"))
        }

        const eventName = isGroupChat ? "send_group_message" : "send_private_message"

        const msgContent = finalContent || ''

        const messagePayload = isGroupChat

          ? { groupId: chatId, senderId, content: msgContent, mediaUrl: mediaUrl || null, mediaType: mediaType || null, replyToMessageId: replyMeta?.id || null }

          : { conversationId: chatId, senderId, content: msgContent, mediaUrl: mediaUrl || null, replyToMessageId: replyMeta?.id || null }

        let responded = false
        socket.emit(eventName, messagePayload, (response) => {
          responded = true
          if (response?.success) {
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== tempId)
              const realMessage = mapMessageToUi(response.message)
              if (!realMessage) return filtered
              return [...filtered, { ...realMessage, replyToText: realMessage.replyToText || replyMeta?.text || null }]
            })

            setChats((prev) => {
              let preview = ""
              if (response.message.content) {
                const parsedPreview = parseReplyFromContent(response.message.content).text
                preview = parsedPreview.length > 50
                  ? parsedPreview.substring(0, 50) + "..." : parsedPreview
              } else if (response.message.media_url) {
                const url = response.message.media_url.toLowerCase()
                if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) preview = "📷 Photo"
                else if (url.match(/\.(mp4|webm|mov)$/)) preview = "🎥 Video"
                else if (url.match(/\.(mp3|wav|ogg)$/)) preview = "🎵 Audio"
                else preview = "📎 File"
              } else { preview = "No messages yet" }

              return prev.map((chat) => {
                if (String(chat.id) !== chatId) return chat
                return { ...chat, lastMessage: preview, timestamp: formatTime(response.message.created_at), sortTime: response.message.created_at }
              }).sort((a, b) => {
                const timeA = a.sortTime ? new Date(a.sortTime).getTime() : 0
                const timeB = b.sortTime ? new Date(b.sortTime).getTime() : 0
                return timeB - timeA
              })
            })

            resolve(response)
          } else { reject(new Error(response?.error || "Failed to send message")) }
        })

        // Fallback timeout if the server callback isn't called
        setTimeout(() => {
          if (!responded) reject(new Error("Socket timeout"))
        }, 5000)

      })

    }



    try {

      await sendViaSocket()

    } catch (socketError) {

      console.warn("Socket send failed:", socketError)

      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))

      if (messageData) {

        if (socketError.message === "Socket not connected") {
          toast.error("Connection lost. Reconnecting...")
          // Attempt to reconnect
          if (socket && !socket.connected) {
            socket.connect()
          }
        } else {
          toast.error("Failed to send message. Please try again.")
        }
        console.log("Message data that failed to send:", messageData)

      } else {

        setMessageInput(content)
        setReplyToMessage(replyMeta || null)
        console.log("Message content that failed to send:", content, "Reply meta:", replyMeta)

        if (socketError.message === "Socket not connected") {
          toast.error("Connection lost. Reconnecting...")
          // Attempt to reconnect
          if (socket && !socket.connected) {
            socket.connect()
          }
        } else {
          toast.error("Failed to send message. Please try again.")
        }

      }

    }

  }



  const clearSearch = () => { setSearchQuery("") }

  const handleStartCall = useCallback(async (mode = "video") => {
    if (!selectedChat?.id) {
      toast.error("Select a conversation first")
      return
    }

    if (!currentUser?.id) {
      toast.error("You must be logged in to start a call")
      return
    }

    const isGroupChat = selectedChat.isGroup || selectedChat.type === "group"
    if (isGroupChat) {
      toast.error("Calls are currently available for private chats only")
      return
    }

    const targetUserId = selectedChat?.user?.id
    if (!targetUserId) {
      toast.error("Could not find the person to call")
      return
    }

    const targetName = selectedChat?.user?.name || "Friend"
    const callId = crypto.randomUUID()
    const params = new URLSearchParams({
      role: "caller",
      callId,
      targetUserId: String(targetUserId),
      conversationId: String(selectedChat.id),
      targetName,
      mode,
      auto: "1",
    })

    window.open(`/videocall?${params.toString()}`, "_blank", "noopener,noreferrer")
  }, [currentUser, selectedChat])



  const handleDeleteMessage = async (messageId, isGroupChat = false) => {

    if (!socket || !socket.connected) { toast.error("Socket not connected"); return }

    try {

      const eventName = isGroupChat ? "delete_group_message" : "delete_private_message"

      const payload = isGroupChat

        ? { groupId: selectedChat.id, messageId }

        : { conversationId: selectedChat.id, messageId }

      socket.emit(eventName, payload, (response) => {

        if (response?.success) {

          setMessages((prev) => prev.filter((msg) => String(msg.id) !== String(messageId)))

          toast.success("Message deleted")

        } else { toast.error(response?.error || "Failed to delete message") }

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

          <img src={mediaUrl} alt="shared"

            className="max-w-xs max-h-96 rounded-lg object-cover cursor-pointer hover:opacity-90 transition"

            onError={(e) => { e.target.src = '/default.png' }} />

        </div>

      )

    }

    if (type === 'video') {

      return (

        <div className="mb-2 max-w-xs">

          <video controls className="w-full rounded-lg bg-black" controlsList="nodownload">

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

            <button onClick={() => {

              if (audioRef.current) {

                if (isPlaying) audioRef.current.pause()

                else audioRef.current.play()

                setIsPlaying(!isPlaying)

              }

            }} className={`flex-shrink-0 ${isOwn ? 'text-white' : 'text-gray-700'}`}>

              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}

            </button>

            <audio ref={audioRef} src={mediaUrl} onEnded={() => setIsPlaying(false)} className="flex-1" />

            <span className={`text-sm ${isOwn ? 'text-white/70' : 'text-gray-600'}`}>Voice message</span>

            <a href={mediaUrl} download className={`flex-shrink-0 ${isOwn ? 'text-white hover:text-green-200' : 'text-gray-700 hover:text-gray-900'}`}>

              <Download className="h-4 w-4" />

            </a>

          </div>

        </div>

      )

    }

    const fileName = mediaUrl.split('/').pop()

    return (

      <div className="mb-2">

        <a href={mediaUrl} download

          className={`flex items-center gap-2 ${isOwn ? 'bg-green-700 hover:bg-green-800 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} p-3 rounded-lg max-w-xs`}>

          <FileText className="h-5 w-5 flex-shrink-0" />

          <span className="text-sm truncate flex-1">{fileName || "File"}</span>

          <Download className="h-4 w-4 flex-shrink-0" />

        </a>

      </div>

    )

  }



  const handleEmojiSelect = (emoji) => { setMessageInput(prev => prev + emoji) }



  // Theme

  const isDark = theme === 'dark'

  const bgColor = isDark ? "bg-gray-900" : "bg-gray-50"

  const cardBg = isDark ? "bg-gray-800" : "bg-white"

  const borderColor = isDark ? "border-gray-700" : "border-gray-200"

  const textColor = isDark ? "text-white" : "text-gray-900"

  const textMuted = isDark ? "text-gray-400" : "text-gray-500"

  const hoverBg = isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-100/50"

  const onlineStatus = isDark ? "border-gray-800" : "border-white"

  const messageBgOwn = isDark ? "bg-green-600" : "bg-green-500"

  const messageBgOther = isDark ? "bg-gray-700" : "bg-gray-100"

  const inputBg = isDark ? "bg-gray-700" : "bg-gray-50"



  return (

    <>

      <StyleInjector />

      {/* <StarsBackground starColor={resolvedTheme === 'orange' ? '#FFA500' : '#FFA500'} className="absolute bg-white inset-0 flex items-center justify-center rounded-xl" /> */}

      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-300 pt-16`}>



        <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row gap-4 p-4">



          {/* ── Desktop: Online users sidebar ── */}

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

                      <Card key={user.id}

                        className={`p-3 ${hoverBg} transition-colors duration-200 cursor-pointer ${cardBg} border ${borderColor}`}

                        onClick={() => startConversationWithUser(user)}>

                        <div className="flex items-center gap-3">

                          <div className="relative">

                            <Avatar className="h-10 w-10">

                              <AvatarImage src={user.avatar || "/default.png"} alt={user.name} />

                              <AvatarFallback className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>

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



          {/* ── Main two-panel area ── */}

          <div className="flex flex-1 gap-4 min-w-0 overflow-hidden relative">



            {/* ════════════════════════════════════════

                MOBILE: Sliding panels with animations

                ════════════════════════════════════════ */}



            {/* MOBILE Chat List panel */}

            <div

              className={`

                lg:hidden mobile-panel

                ${mobileView === "list" ? "slide-in-left" : "slide-out-left pointer-events-none"}

              `}

            >

              <Card className={`h-full ${cardBg} ${borderColor} border flex flex-col`}>

                {/* Mobile online users strip */}

                <div className="border-b">

                  <div className="p-3 pb-0">

                    <div className="flex items-center justify-between mb-2">

                      <div className="flex items-center gap-2">

                        <Users className="h-4 w-4 text-green-500" />

                        <h3 className={`text-sm font-semibold ${textColor}`}>Online</h3>

                      </div>

                      <Badge className={`text-xs ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>

                        {onlineUsers.length}

                      </Badge>

                    </div>

                  </div>

                  <ScrollArea className="w-full" orientation="horizontal">

                    <div className="flex gap-2 px-3 pb-3 min-w-max">

                      {isLoadingOnlineUsers ? (

                        <div className="flex items-center justify-center w-16 h-16">

                          <Loader2 className="h-4 w-4 animate-spin text-green-500" />

                        </div>

                      ) : onlineUsers.length === 0 ? (

                        <div className={`text-xs ${textMuted} py-3 px-4`}>No users online</div>

                      ) : (

                        onlineUsers.slice(0, 8).map((user) => (

                          <button key={user.id}

                            onClick={() => startConversationWithUser(user)}

                            className="flex flex-col items-center gap-1 w-14 flex-shrink-0">

                            <div className="relative">

                              <Avatar className="h-11 w-11">

                                <AvatarImage src={user.avatar || "/default.png"} alt={user.name} />

                                <AvatarFallback className={`text-xs ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>

                                  {user.name.split(" ").map((n) => n[0]).join("")}

                                </AvatarFallback>

                              </Avatar>

                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 ${onlineStatus} rounded-full`} />

                            </div>

                            <p className={`text-[10px] font-medium ${textColor} text-center truncate w-full`}>

                              {user.name.split(" ")[0]}

                            </p>

                          </button>

                        ))

                      )}

                    </div>

                  </ScrollArea>

                </div>



                {/* Search + new chat */}

                <div className="p-3 border-b">

                  <div className="flex items-center gap-2">

                    <div className="relative flex-1">

                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />

                      <Input placeholder="Search chats..."

                        className={`pl-9 h-9 text-sm ${inputBg} ${borderColor} ${textColor}`}

                        value={searchQuery}

                        onChange={(e) => setSearchQuery(e.target.value)} />

                      {searchQuery && (

                        <button onClick={clearSearch}

                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}>

                          <X className="h-4 w-4" />

                        </button>

                      )}

                    </div>

                    <Button variant="outline" className={`h-9 border ${borderColor} ${hoverBg} ${bgColor} flex-shrink-0`} onClick={() => setControlOpen(!controlOpen)}>

                      <Plus className="h-4 w-4 mr-2" />

                    </Button>

                  </div>

                </div>



                {/* Mobile chat list */}

                <ScrollArea className="flex-1 min-h-0">

                  {isLoadingChats ? (

                    <div className="flex justify-center items-center py-12">

                      <Loader2 className="h-8 w-8 animate-spin text-green-500" />

                    </div>

                  ) : filteredChats.length === 0 ? (

                    <div className="text-center py-12 px-4">

                      <Search className={`h-10 w-10 ${textMuted} mx-auto mb-3`} />

                      <p className={`text-sm ${textMuted}`}>

                        {searchQuery ? `No chats for "${searchQuery}"` : "No conversations yet"}

                      </p>

                      <Button className="mt-4 bg-orange-400 hover:bg-orange-500 text-white text-sm" onClick={() => setControlOpen(!controlOpen)}>

                        Start Conversation

                      </Button>

                    </div>

                  ) : (

                    <div className={`p-2 space-y-1`}>

                      {filteredChats.map((chat) => (

                        <button key={`${chat.type}-${chat.id}`}

                          onClick={() => handleChatSelect(chat)}

                          className={`

                            w-full text-left p-3 rounded-xl flex items-center gap-3

                            transition-all duration-150 

                            ${selectedChat?.id === chat.id

                              ? `${isDark ? 'bg-green-900/40 ring-1 ring-green-500' : 'bg-green-50 ring-1 ring-green-400'}`

                              : `${isDark ? 'hover:bg-gray-700/60' : 'hover:bg-gray-50'}`}

                          `}>

                          <div className="relative flex-shrink-0">

                            <Avatar className="h-12 w-12">

                              <AvatarImage src={chat.user.avatar || "/default.png"} alt={chat.user.name} />

                              <AvatarFallback className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>

                                {chat.type === 'group'

                                  ? <Users className="h-5 w-5" />

                                  : chat.user.name.split(" ").map((n) => n[0]).join("")}

                              </AvatarFallback>

                            </Avatar>

                            {onlineUsers.some(user => user.id === chat.user.id) && (

                              <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 ${onlineStatus} rounded-full`} />

                            )}

                          </div>

                          <div className="flex-1 min-w-0">

                            <div className="flex items-center justify-between mb-0.5">

                              <div className="flex items-center gap-2 min-w-0">

                                <div className="min-w-0">
                                  <p className={`text-sm font-semibold ${textColor} truncate`}>{chat.user.name}</p>
                                  {Array.isArray(typingMap[String(chat.id)]) && typingMap[String(chat.id)].length > 0 && (
                                    <p className="text-xs text-green-500 truncate">
                                      {typingMap[String(chat.id)].slice(0,2).map(u => u.userName).join(', ')} {typingMap[String(chat.id)].length > 1 ? 'are typing...' : 'is typing...'}
                                    </p>
                                  )}
                                </div>

                                {chat.type === 'group' && (

                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex-shrink-0">

                                    <Users className="w-3 h-3 mr-1" />

                                    Group

                                  </span>

                                )}

                              </div>

                              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">

                                <span className={`text-[11px] ${textMuted}`}>{chat.timestamp}</span>

                                {(() => {

                                  const storeUnread = unreadCounts[chat.id] || 0;

                                  const display = storeUnread > 0 ? storeUnread : chat.unread || 0;

                                  return display > 0 ? (

                                    <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">

                                      {display}

                                    </span>

                                  ) : null;

                                })()}

                              </div>

                            </div>

                            <p className={`text-xs ${textMuted} truncate`}>{chat.lastMessage}</p>

                          </div>

                        </button>

                      ))}

                    </div>

                  )}

                </ScrollArea>

              </Card>

            </div>



            {/* MOBILE Chat view panel */}

            <div

              className={`

                lg:hidden mobile-panel

                ${mobileView === "chat" ? "slide-in-right" : "slide-out-right pointer-events-none"}

              `}

            >

              <Card className={`h-[calc(100vh-144px)] ${cardBg} ${borderColor} border flex flex-col overflow-hidden`}>

                {!selectedChat ? (

                  <div className="flex-1 flex flex-col items-center justify-center p-8">

                    <div className={`p-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} inline-block mb-4`}>

                      <MessageSquare className="h-12 w-12 text-green-500" />

                    </div>

                    <h3 className={`text-xl font-semibold  mb-2`}>No conversation selected</h3>

                    <p className={`text-sm ${textMuted} mb-4 text-center`}>Select a conversation to begin.</p>

                    <Button onClick={handleBackToChats} className="bg-orange-400 hover:bg-orange-500 text-white">

                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to chats

                    </Button>

                  </div>

                ) : (

                  <MobileChatContent

                    selectedChat={selectedChat}

                    messages={messages}

                    filteredMessages={filteredMessages}

                    isLoadingMessages={isLoadingMessages}

                    typingUsers={typingUsers}

                    searchQuery={searchQuery}

                    setSearchQuery={setSearchQuery}

                    clearSearch={clearSearch}

                    showConversation={showConversation}

                    handleBackToChats={handleBackToChats}

                    handleDeleteMessage={handleDeleteMessage}
                    onReplyToMessage={(message) => setReplyToMessage(buildReplyPreview(message))}

                    handleSendMessage={handleSendMessage}
                    onStartCall={handleStartCall}

                    messageInput={messageInput}

                    setMessageInput={setMessageInput}

                    showEmoji={showEmoji}

                    setShowEmoji={setShowEmoji}
                    replyToMessage={replyToMessage}
                    clearReplyToMessage={() => setReplyToMessage(null)}

                    handleEmojiSelect={handleEmojiSelect}

                    socket={socket}

                    currentUser={currentUser}

                    isDark={isDark}

                    cardBg={cardBg}

                    borderColor={borderColor}

                    textColor={textColor}

                    textMuted={textMuted}

                    hoverBg={hoverBg}

                    onlineStatus={onlineStatus}

                    messageBgOwn={messageBgOwn}

                    messageBgOther={messageBgOther}

                    inputBg={inputBg}

                    messagesEndRef={messagesEndRef}

                    messagesContainerRef={messagesContainerRef}

                    MediaMessage={MediaMessage}

                    onlineUsers={onlineUsers}

                    EmojiPicker={EmojiPicker}

                    confirm={confirm}

                  />

                )}

              </Card>

            </div>



            {/* ════════════════════════════

                DESKTOP: side-by-side layout

                ════════════════════════════ */}

            <aside className="hidden lg:flex w-80 flex-shrink-0">

              <Card className={`flex-1 ${cardBg} ${borderColor} border flex flex-col`}>

                {/* Search */}

                <div className="p-4 border-b">

                  <div className="flex items-center gap-2">

                    <div className="relative flex-1">

                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />

                      <Input placeholder="Search by name or message..."

                        className={`pl-9 ${inputBg} ${borderColor} ${textColor}`}

                        value={searchQuery}

                        onChange={(e) => setSearchQuery(e.target.value)} />

                      {searchQuery && (

                        <button onClick={clearSearch}

                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}>

                          <X className="h-4 w-4" />

                        </button>

                      )}

                    </div>

                    <Button variant="outline" className={`border ${borderColor} ${hoverBg} ${bgColor} hover:cursor-pointer`} onClick={() => setControlOpen(!controlOpen)}>

                      <Plus className="h-4 w-4 mr-2" />

                    </Button>

                  </div>

                  {searchQuery && (

                    <p className={`text-xs ${textMuted} mt-2`}>

                      Found {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''}

                    </p>

                  )}

                </div>



                {/* Desktop chat list */}

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

                      <Button className="mt-4 bg-green-500 hover:bg-green-600 text-white" onClick={() => setControlOpen(!controlOpen)}>

                        Start Conversation

                      </Button>

                    </div>

                  ) : (

                    <div className="p-2 space-y-2 max-w-[330px]">

                      {filteredChats.map((chat) => (

                        <Card key={`${chat.type}-${chat.id}`}

                          onClick={() => handleChatSelect(chat)}

                          className={`p-3 ${hoverBg} transition-all duration-200 cursor-pointer ${cardBg} border ${borderColor} ${selectedChat?.id === chat.id

                            ? `ring-1 ring-orange-500 ring-offset-2 ${isDark ? 'ring-offset-gray-800' : 'ring-offset-white'}`

                            : ''}`}>

                          <div className="flex items-start gap-3">

                            <div className="relative flex-shrink-0">

                              <Avatar className="h-12 w-12">

                                <AvatarImage src={chat.user.avatar || "/default.png"} alt={chat.user.name} />

                                <AvatarFallback className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>

                                  {chat.type === 'group' ? <Users className="h-6 w-6" /> : chat.user.name.split(" ").map((n) => n[0]).join("")}

                                </AvatarFallback>

                              </Avatar>

                              {onlineUsers.some(user => user.id === chat.user.id) && (

                                <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 ${onlineStatus} rounded-full`} />

                              )}

                            </div>

                            <div className="flex-1 min-w-0">

                              <div className="flex items-start justify-between mb-1">

                                <div className="flex items-center gap-2 min-w-0">

                                  <div className="min-w-0">
                                    <p className={`text-sm font-semibold truncate`}>{chat.user.name}</p>
                                    {Array.isArray(typingMap[String(chat.id)]) && typingMap[String(chat.id)].length > 0 && (
                                      <p className="text-xs text-green-500 truncate">
                                        {typingMap[String(chat.id)].slice(0,2).map(u => u.userName).join(', ')} {typingMap[String(chat.id)].length > 1 ? 'are typing...' : 'is typing...'}
                                      </p>
                                    )}
                                  </div>

                                  {chat.type === 'group' && (

                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex-shrink-0">

                                      <Users className="w-3 h-3 mr-1" />

                                      Group

                                    </span>

                                  )}

                                </div>

                                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">

                                  <span className={`text-xs ${textMuted}`}>{chat.timestamp}</span>

                                  {(() => {

                                    const storeUnread = unreadCounts[chat.id] || 0;

                                    const display = storeUnread > 0 ? storeUnread : chat.unread || 0;

                                    return display > 0 ? (

                                      <Badge className="bg-orange-500 text-white text-xs px-2 py-0 h-5 min-w-[20px] flex items-center justify-center">

                                        {display}

                                      </Badge>

                                    ) : null;

                                  })()}

                                </div>

                              </div>

                              <p className={`text-sm ${textMuted} truncate`}>{chat.lastMessage}</p>

                            </div>

                          </div>

                        </Card>

                      ))}

                    </div>

                  )}

                </ScrollArea>

              </Card>

            </aside>



            {/* Desktop chat area */}

            <main className="hidden lg:flex flex-1 min-w-0">

              <Card className={`flex-1 ${cardBg} ${borderColor} border flex flex-col`}>

                {!selectedChat ? (

                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className={`p-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} inline-block mb-4`}>
                      <MessageSquare className="h-12 w-12 text-orange-500" />
                    </div>
                    <h3 className={`text-xl font-semibold ${textColor} mb-2`}>No conversation selected</h3>
                    <p className={`text-sm ${textMuted} mb-6`}>Select a conversation or start a new one to begin messaging.</p>
                    <Button className="bg-orange-400 hover:bg-orange-500 text-white"
                      onClick={() => {
                        setControlOpen(!controlOpen)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Conversation
                    </Button>
                  </div>
                ) : (
                  <MobileChatContent
                    selectedChat={selectedChat}
                    messages={messages}
                    filteredMessages={filteredMessages}
                    isLoadingMessages={isLoadingMessages}
                    typingUsers={typingUsers}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    clearSearch={clearSearch}
                    showConversation={showConversation}
                    handleBackToChats={handleBackToChats}
                    handleDeleteMessage={handleDeleteMessage}
                    onReplyToMessage={(message) => setReplyToMessage(buildReplyPreview(message))}
                    handleSendMessage={handleSendMessage}
                    onStartCall={handleStartCall}
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    showEmoji={showEmoji}
                    setShowEmoji={setShowEmoji}
                    replyToMessage={replyToMessage}
                    clearReplyToMessage={() => setReplyToMessage(null)}
                    handleEmojiSelect={handleEmojiSelect}
                    socket={socket}
                    currentUser={currentUser}
                    isDark={isDark}
                    cardBg={cardBg}
                    borderColor={borderColor}
                    textColor={textColor}
                    textMuted={textMuted}
                    hoverBg={hoverBg}
                    onlineStatus={onlineStatus}
                    messageBgOwn={messageBgOwn}
                    messageBgOther={messageBgOther}
                    inputBg={inputBg}
                    messagesEndRef={messagesEndRef}
                    messagesContainerRef={messagesContainerRef}
                    MediaMessage={MediaMessage}
                    onlineUsers={onlineUsers}
                    EmojiPicker={EmojiPicker}
                    isDesktop
                    confirm={confirm}
                  />
                )}
              </Card>
            </main>

          </div>
        </div>
      </div>
      {confirmDialog}
      <UserSearchDialog
        open={controlOpen}
        onOpenChange={setControlOpen}
        onSelect={startConversationWithUser}
      />

    </>

  )
}


// ─────────────────────────────────────────────────────────────────────────────

// Shared Chat Content component (used by both mobile panel and desktop area)

// ─────────────────────────────────────────────────────────────────────────────

function MobileChatContent({

  selectedChat, messages, filteredMessages, isLoadingMessages, typingUsers,

  searchQuery, setSearchQuery, clearSearch, showConversation,

  handleBackToChats, handleDeleteMessage, onReplyToMessage, handleSendMessage,
  onStartCall,

  messageInput, setMessageInput, showEmoji, setShowEmoji, replyToMessage, clearReplyToMessage, handleEmojiSelect,

  socket, currentUser, isDark, cardBg, borderColor, textColor, textMuted,

  hoverBg, onlineStatus, messageBgOwn, messageBgOther, inputBg,

  messagesEndRef, messagesContainerRef, MediaMessage, onlineUsers, EmojiPicker,

  isDesktop = false,

  confirm,

}) {

  const isGroup = selectedChat?.isGroup || selectedChat?.type === 'group'
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)


  return (

    <>

      {/* Chat header */}

      <div className={`px-3 py-2 border-b flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 min-w-0">

            {!isDesktop && (

              <button onClick={handleBackToChats}

                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>

                <ArrowLeft className="h-5 w-5" />

              </button>

            )}

            <div className="relative flex-shrink-0">

              <Avatar className="h-9 w-9">

                <AvatarImage src={selectedChat?.user?.avatar || "/default.png"} alt={selectedChat?.user?.name} />

                <AvatarFallback className={`text-xs ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>

                  {selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}

                </AvatarFallback>

              </Avatar>

              {selectedChat?.user?.status === "online" && (

                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 ${onlineStatus} rounded-full`} />

              )}

            </div>

            <div className="flex flex-col min-w-0">

              <h2 className={`font-semibold text-sm  truncate`}>{selectedChat?.user?.name}</h2>

              <div className="flex items-center gap-2 min-w-0">
                {typingUsers && typingUsers.length > 0 ? (
                  <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'} truncate`}>
                    {typingUsers.slice(0, 2).map(u => u.userName).join(', ')}{typingUsers.length > 1 ? ' are typing...' : ' is typing...'}
                  </p>
                ) : (
                  <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'} truncate`}>

                    {isGroup

                      ? `${selectedChat.user.memberCount} members`

                      : (onlineUsers.some(user => String(user.id) === String(selectedChat?.user?.id)) ? "Active now" : "Offline")}

                  </p>
                )}

                {isGroup && (
                  <button
                    type="button"
                    onClick={() => setIsMembersDialogOpen(true)}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap ${isDark
                      ? "bg-gray-700/60 text-gray-200 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    aria-label="View group members"
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    Members
                  </button>
                )}
              </div>

            </div>

          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">

            <Button variant="ghost" size="icon" className={`h-9 w-9 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => onStartCall?.("audio")}
            //        onClick={async () => {
            //   await confirm({
            //     title: 'Feature unavailable',
            //     description: 'This feature is coming soon!',
            //     confirmText: 'Okay',
            //     cancelText: 'Close',
            //   })
            // }}
            >

              <Phone className="h-4 w-4" />

            </Button>

            <Button variant="ghost" size="icon" className={`h-9 w-9 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => onStartCall?.("video")}
            >
              <Video className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className={`h-9 w-9 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={async () => {
                await confirm({
                  title: 'Feature unavailable',
                  description: 'This feature is coming soon!',
                  confirmText: 'Okay',
                  cancelText: 'Close',
                })
              }}
            >

              <MoreVertical className="h-4 w-4" />

            </Button>

          </div>

        </div>

      </div>

      {isGroup && (
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <DialogContent className={`max-w-md ${isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Group members
                <span className={`${isDark ? "text-gray-400" : "text-gray-500"} text-sm font-normal`}>
                  ({selectedChat?.user?.memberCount || 0})
                </span>
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[55vh] pr-3">
              <div className="space-y-2">{console.log("Members list: ", selectedChat?.user?.members) || null}
                {(selectedChat?.user?.members || [])
                  .slice()
                  .sort((a, b) => {
                    const adminId = String(selectedChat?.user?.adminId || "")
                    const aIsAdmin = String(a?.id) === adminId
                    const bIsAdmin = String(b?.id) === adminId
                    if (aIsAdmin === bIsAdmin) return 0
                    return aIsAdmin ? -1 : 1
                  })
                  .map((m) => {
                    const adminId = String(selectedChat?.user?.adminId || "")
                    const isAdmin = String(m?.id) === adminId
                    console.log("This is the list of members: ", m)
                    return (
                      <div
                        key={String(m?.id)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isDark ? "border-gray-800" : "border-gray-200"
                          } ${isAdmin ? (isDark ? "bg-yellow-500/10" : "bg-yellow-50") : ""}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={m?.avatar || "/default.png"} alt={m?.name || "Member"} />
                            <AvatarFallback className={`text-[10px] ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
                              {(m?.name || "U").split(" ").map((n) => n?.[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="text-sm font-medium truncate">{m?.name || `User ${m?.id}`}</p>
                              {isAdmin && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-yellow-500/20 text-yellow-200" : "bg-yellow-100 text-yellow-800"
                                  }`}>
                                  <Crown className="h-3.5 w-3.5" />
                                  Admin
                                </span>
                              )}
                            </div>

                          </div>
                        </div>

                        <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} ${onlineUsers.some((u) => String(u.id) === String(m?.id)) ? "text-orange-400 font-bold" : "text-gray-500"}`}>
                          {onlineUsers.some((u) => String(u.id) === String(m?.id)) ? "Online" : "Offline"}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}



      {/* In-conversation search */}

      <div className="px-3 py-2 border-b flex-shrink-0 ">

        <div className="relative">

          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${textMuted}`} />

          <Input placeholder="Search in conversation..."

            className={`pl-8 h-8 text-xs ${inputBg} ${borderColor} ${textColor}`}

            value={searchQuery}

            onChange={(e) => setSearchQuery(e.target.value)} />

          {searchQuery && (

            <button onClick={clearSearch}

              className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}>

              <X className="h-3.5 w-3.5" />

            </button>

          )}

        </div>

        {searchQuery && showConversation && (

          <p className={`text-[10px] ${textMuted} mt-1 text-center`}>

            {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} found

          </p>

        )}

      </div>



      {/* Messages */}

      <ScrollArea className="flex-1 min-h-0 px-3 overflow-y-auto" ref={messagesContainerRef}>

        <div className="py-4 space-y-3 max-w-3xl mx-auto">

          {isLoadingMessages ? (

            <div className="flex justify-center py-12">

              <Loader2 className="h-8 w-8 animate-spin text-green-500" />

            </div>

          ) : filteredMessages.length === 0 && searchQuery ? (

            <div className="text-center py-12">

              <Search className={`h-10 w-10 ${textMuted} mx-auto mb-3`} />

              <p className={textMuted}>No messages found for &quot;{searchQuery}&quot;</p>

            </div>

          ) : messages.length === 0 ? (

            <div className="text-center py-12">

              <MessageSquare className={`h-12 w-12 ${textMuted} mx-auto mb-4`} />

              <h3 className={`text-lg font-semibold ${textColor} mb-2`}>No messages yet</h3>

              <p className={`text-sm ${textMuted} mb-6`}>

                Start the conversation with {isGroup ? 'the group' : selectedChat?.user?.name || 'this person'}

              </p>

              <div className={`flex flex-col items-center gap-3 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-xl p-4 max-w-sm mx-auto`}>

                <div className={`text-xs ${textMuted} text-center`}>

                  <p className="mb-2 flex items-center gap-1"><Lightbulb className="w-4 h-4 text-yellow-500" /> <span>Tips for starting a great conversation:</span></p>

                  <ul className="text-left space-y-1">

                    <li>• Ask about their day or interests</li>

                    <li>• Share something interesting you learned</li>

                    <li>• Send a friendly greeting</li>

                    <li className="flex gap-1">• <span>Use emojis to express yourself </span><PartyPopper className="w-4 h-4 text-purple-500" /></li>

                  </ul>

                </div>

              </div>

            </div>

          ) : (

            <>

              {(searchQuery ? filteredMessages : messages).map((message) => (

                <div

                  key={message.id}

                  data-conversation-id={selectedChat?.id}

                  data-message-id={message.id}

                  data-is-own={message.isOwn}

                  className={`flex items-end gap-2 group ${message.isOwn ? "flex-row-reverse" : ""}`}

                >

                  {!message.isOwn && (

                    <Avatar className="h-7 w-7 flex-shrink-0">

                      <AvatarImage src={selectedChat?.user?.avatar || "/default.png"} alt={selectedChat?.user?.name} />

                      <AvatarFallback className={`text-[10px] ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>

                        {selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}

                      </AvatarFallback>

                    </Avatar>

                  )}

                  <div className="flex flex-col gap-1 relative max-w-[75%] sm:max-w-lg">

                    <div className={`

                      rounded-2xl px-3 py-2 break-words transition-all duration-200

                      ${message.isOwn

                        ? `${messageBgOwn} text-white rounded-br-sm`

                        : `${messageBgOther} ${textColor} rounded-bl-sm border ${borderColor}`

                      }

                    `}>

                      {message.replyToText && (
                        <div className={`mb-2 px-2 py-1.5 rounded-lg border-l-2 ${message.isOwn ? 'bg-white/15 border-white/70' : isDark ? 'bg-gray-800 border-orange-400' : 'bg-gray-50 border-orange-500'}`}>
                          <p className={`text-[10px] font-semibold ${message.isOwn ? 'text-white/90' : isDark ? 'text-orange-300' : 'text-orange-600'}`}>Replying to</p>
                          <p className={`text-xs truncate ${message.isOwn ? 'text-white/85' : textMuted}`}>{message.replyToText}</p>
                        </div>
                      )}
                      {message.mediaUrl && (

                        <MediaMessage mediaUrl={message.mediaUrl} mediaType={message.mediaType}

                          message={message} isOwn={message.isOwn} />

                      )}

                      {message.text && (

                        searchQuery && message.text.toLowerCase().includes(searchQuery.toLowerCase()) ? (

                          <p className="text-sm break-words">

                            {message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>

                              part.toLowerCase() === searchQuery.toLowerCase() ? (

                                <span key={i} className="bg-orange-500 text-white px-0.5 rounded">{part}</span>

                              ) : part

                            )}

                          </p>

                        ) : (

                          <p className="text-sm break-words">{message.text}</p>

                        )

                      )}
                      <p className={`text-[11px] ${textMuted}`}>{message.timestamp}</p>

                    </div>

                    {!message.isPending && (
                      <button
                        type="button"
                        onClick={() => onReplyToMessage?.(message)}
                        className={`opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 ${message.isOwn ? "self-start" : "self-end"}`}
                        title="Reply to message"
                      >
                        <Reply className="h-3.5 w-3.5 text-orange-400 hover:text-orange-500" />
                      </button>
                    )}
                    {message.isOwn && !message.isPending && (

                      <button

                        onClick={async () => {
                          const confirmed = await confirm({
                            title: 'Delete message',
                            description: 'Are you sure you want to delete this message?',
                            confirmText: 'Delete',
                            cancelText: 'Cancel',
                            destructive: true,
                          })
                          if (!confirmed) return
                          handleDeleteMessage(message.id, isGroup)
                        }}

                        className="opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 self-end"

                        title="Delete message">

                        <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />

                      </button>

                    )}

                  </div>

                </div>

              ))}



              {/* Typing indicator */}

              {typingUsers.length > 0 && (

                <div className="flex items-center gap-2">

                  <Avatar className="h-7 w-7 flex-shrink-0">

                    <AvatarImage src={selectedChat?.user?.avatar || "/default.png"} />

                    <AvatarFallback className={`text-[10px] ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>

                      {isGroup ? <Users className="h-3 w-3" /> : selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")}

                    </AvatarFallback>

                  </Avatar>

                  <div className={`rounded-2xl px-3 py-2 ${messageBgOther} ${textColor} rounded-bl-sm border ${borderColor} flex items-center gap-2`}>

                    <span className={`text-xs italic ${textMuted}`}>

                      {typingUsers.length === 1

                        ? `${typingUsers[0].userName} is typing`

                        : `${typingUsers[0].userName} and ${typingUsers.length - 1} other${typingUsers.length > 2 ? 's' : ''} are typing`}

                    </span>

                    <div className="flex gap-0.5">

                      {[0, 150, 300].map((delay) => (

                        <span key={delay}

                          className={`w-1.5 h-1.5 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} rounded-full typing-dot`}

                          style={{ animationDelay: `${delay}ms` }} />

                      ))}

                    </div>

                  </div>

                </div>

              )}

              <div ref={messagesEndRef} />

            </>

          )}

        </div>

      </ScrollArea>



      {/* Message input */}

      <div className={`p-3 pb-6 border-t flex-shrink-0 relative ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

        {showEmoji && (

          <div className="absolute bottom-full right-3 mb-2 z-50">

            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-xl`}>

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
          replyToMessage={replyToMessage}
          onClearReply={clearReplyToMessage}

          onEmojiSelect={handleEmojiSelect}

          socket={socket}

          currentUserId={currentUser?.id}

          selectedChat={selectedChat}

        />

      </div>

    </>

  )

}