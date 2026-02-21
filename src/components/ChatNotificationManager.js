"use client"

import { useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useMessageStore } from "@/stores/messageStore"
import toast from "react-hot-toast"
import { usePathname } from "next/navigation"

export default function ChatNotificationManager() {
    const { user } = useAuth()
    const { incrementUnreadCount, setUnreadCounts } = useMessageStore()
    const socketRef = useRef(null)
    const pathname = usePathname()

    // Also try to get user from localStorage if AuthProvider doesn't provide it immediately
    const currentUser = user || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("fullInfo") || "{}") : null)

    useEffect(() => {
        if (!currentUser?.id) return

        // 1. Fetch initial unread counts
        const fetchUnreadCounts = async () => {
            try {
                // Fetch private chat unread counts
                const privateRes = await fetch(`/api/privatechat/userid?userid=${currentUser.id}`)
                const privateData = await privateRes.json()

                // Fetch group chat unread counts
                const groupRes = await fetch(`/api/group-conversation?userId=${currentUser.id}`)
                const groupData = await groupRes.json()

                const counts = {}

                if (privateData?.success && Array.isArray(privateData.data)) {
                    privateData.data.forEach(chat => {
                        const count = parseInt(chat.unread || chat.unread_count || 0, 10)
                        if (count > 0) {
                            counts[chat.id] = count
                        }
                    })
                }

                if (groupData?.success && Array.isArray(groupData.data)) {
                    groupData.data.forEach(chat => {
                        const count = parseInt(chat.unread || chat.unread_count || 0, 10)
                        if (count > 0) {
                            counts[chat.id] = count
                        }
                    })
                }

                setUnreadCounts(counts)
            } catch (error) {
                console.error("Error fetching unread message counts:", error)
            }
        }

        fetchUnreadCounts()

        // 2. Setup Socket.IO
        if (!socketRef.current) {
            try {
                const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
                    path: "/api/socketio",
                    transports: ["websocket", "polling"],
                })

                socketInstance.on("connect", () => {
                    // console.log("Chat Notification Manager Connected")
                    socketInstance.emit("join_user", { userId: currentUser.id })
                })

                // Listen for private messages
                socketInstance.on("private_message", (message) => {
                    // Only show notification if we are NOT on the chat page OR if we are on chat page but not in this conversation
                    // However, since this is a global manager, we mainly care if the user is NOT in the chat flow
                    // The ChatPage component itself handles the "current conversation" logic better.
                    // So, simplistic approach: If pathname is NOT /chat, show toast. 
                    // If pathname IS /chat, the ChatPage will handle the toast/UI update? 
                    // Actually, robust approach: Always increment store. ChatPage will clear it if active.

                    // Increment unread count globally
                    incrementUnreadCount(String(message.conversation_id))

                    // Show toast if not on chat page
                    // Note: We check pathname to avoid duplicate toasts if ChatPage also shows them.
                    // If ChatPage shows toasts, we should suppress this one. 
                    // Logic: If !pathname.startsWith('/chat'), show toast.

                    if (!pathname?.startsWith('/chat')) {
                        const senderName = message.sender_name || "Someone"
                        toast.success(`New message from ${senderName}`, {
                            id: `msg-${message.id}`,
                            duration: 4000,
                            icon: '💬'
                        })
                    }
                })

                // Listen for group messages
                socketInstance.on("group_message", (message) => {
                    incrementUnreadCount(String(message.group_id))

                    if (!pathname?.startsWith('/chat')) {
                        const groupName = message.group_name || "Group"
                        const senderName = message.sender_name || "Someone"
                        toast.success(`${senderName} in ${groupName}: ${message.content}`, {
                            id: `group-msg-${message.id}`,
                            duration: 4000,
                            icon: '👥'
                        })
                    }
                })

                socketRef.current = socketInstance
            } catch (error) {
                console.error("Error initializing chat notification socket:", error)
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
        }
    }, [currentUser?.id, setUnreadCounts, incrementUnreadCount, pathname])

    return null
}
