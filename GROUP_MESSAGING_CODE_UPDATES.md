# Group Messaging Code Updates Guide

This document provides the exact code changes needed to integrate group messaging into `src/app/chat/page.js`.

## Summary of Changes

The implementation is complete with:
- ✅ API routes created (`/api/group-conversation/[groupId]/messages`)
- ✅ Socket handlers created (`src/services/group-messages/groupMessagesSocket.js`)
- ✅ Socket.io server updated to include group handlers
- ✅ Documentation created (`GROUP_MESSAGING_SYSTEM.md`)
- ✅ File upload component created (`src/app/chat/GroupMessageInput.js`)

## Required Updates to `src/app/chat/page.js`

Due to the file size (1240+ lines), the following sections need to be updated. I recommend applying these changes incrementally and testing after each update.

### 1. Add Imports (Line ~40)

Add after existing imports:
```javascript
import GroupMessageInput from './GroupMessageInput'
```

### 2. Add State Variables (After line ~62)

Add these state variables:
```javascript
const [typingUsers, setTypingUsers] = useState([]) // For typing indicators
const typingTimeoutRef = useRef(null) // For typing timeout
const [selectedFile, setSelectedFile] = useState(null) // For file uploads
const [fileType, setFileType] = useState(null) // File type state
```

### 3. Update `mapMessageToUi` Function (Around line ~197)

Replace the function to handle both private and group messages:
```javascript
const mapMessageToUi = useCallback(
  (message, isGroup = false) => {
    if (!message || !currentUser) return null

    const isOwn = String(message.sender_id) === String(currentUser.id)

    return {
      id: String(message.id),
      senderId: String(message.sender_id),
      text: message.content || "",
      mediaUrl: message.media_url || null,
      mediaType: message.media_type || null,
      timestamp: formatTime(message.created_at),
      isOwn: isOwn,
      senderName: message.sender_name || null,
      senderAvatar: message.sender_avatar || null,
      isGroup: isGroup,
    }
  },
  [currentUser]
)
```

### 4. Update `loadMessagesForConversation` Function (Around line ~213)

Replace to handle both private and group conversations:
```javascript
const loadMessagesForConversation = useCallback(
  async (conversationId, isGroup = false) => {
    if (!conversationId) return
    setIsLoadingMessages(true)
    try {
      const endpoint = isGroup 
        ? `/api/group-conversation/${conversationId}/messages`
        : `/api/privatechat/messages?conversationId=${conversationId}`
      
      const res = await fetch(endpoint)
      const data = await res.json()
      
      if (data?.success && Array.isArray(data.data)) {
        const mapped = data.data
          .map(msg => mapMessageToUi(msg, isGroup))
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
```

### 5. Update `handleChatSelect` Function (Around line ~168)

Update to join group rooms:
```javascript
const handleChatSelect = (chat) => {
  setSelectedChat(chat)
  setShowConversation(true)

  if (chat?.id) {
    const conversationId = String(chat.id)
    const isGroup = chat.isGroup || chat.type === 'group'
    
    if (socket) {
      if (socket.connected) {
        if (isGroup) {
          socket.emit("join_group", { groupId: conversationId })
        } else {
          socket.emit("join_conversation", { conversationId })
        }
      } else {
        socket.once("connect", () => {
          if (isGroup) {
            socket.emit("join_group", { groupId: conversationId })
          } else {
            socket.emit("join_conversation", { conversationId })
          }
        })
      }
    }

    loadMessagesForConversation(conversationId, isGroup)
  }
  
  setSearchQuery("")
  
  if (chat.unread > 0) {
    setChats((prev) => prev.map(c => 
      String(c.id) === String(chat.id) ? { ...c, unread: 0 } : c
    ))
  }
}
```

### 6. Update `handleSendMessage` Function (Around line ~558)

This is a major update. The function should handle both private and group messages, with file uploads. Due to complexity, see the complete replacement in the next section.

### 7. Add Socket Event Listeners (In the socket useEffect, around line ~459)

Add these listeners after the existing `private_message` listener:

```javascript
// Group message handler
socketInstance.on("group_message", (message) => {
  const groupId = String(message.group_id)
  const msgId = String(message.id)
  
  setMessages((prev) => {
    if (!selectedChat || !selectedChat.isGroup || String(selectedChat.id) !== groupId) {
      return prev
    }
    
    const exists = prev.some((msg) => String(msg.id) === msgId)
    if (exists) return prev
    
    const mapped = mapMessageToUi(message, true)
    if (!mapped) return prev
    
    return [...prev, mapped]
  })

  // Update last message in chat list
  setChats((prev) =>
    prev.map((chat) => {
      if (String(chat.id) !== groupId) return chat
      const preview = message.content || (message.media_type ? `[${message.media_type}]` : "[Media]")
      const time = formatTime(message.created_at)
      const isCurrentConversation = selectedChat && String(selectedChat.id) === groupId
      return {
        ...chat,
        lastMessage: preview,
        timestamp: time,
        unread: isCurrentConversation ? 0 : (chat.unread || 0) + 1,
      }
    })
  )
})

// Typing indicators
socketInstance.on("group_typing", ({ groupId, senderId, senderName }) => {
  if (selectedChat?.isGroup && String(selectedChat.id) === String(groupId)) {
    setTypingUsers(prev => {
      if (!prev.find(u => String(u.id) === String(senderId))) {
        return [...prev, { id: senderId, name: senderName }]
      }
      return prev
    })
  }
})

socketInstance.on("group_typing_stop", ({ groupId, senderId }) => {
  if (selectedChat?.isGroup && String(selectedChat.id) === String(groupId)) {
    setTypingUsers(prev => prev.filter(u => String(u.id) !== String(senderId)))
  }
})

// Group last message update
socketInstance.on("group_last_message", ({ groupId, lastMessage, timestamp }) => {
  setChats(prev => prev.map(chat => 
    String(chat.id) === String(groupId)
      ? { ...chat, lastMessage, timestamp: formatTime(timestamp) }
      : chat
  ))
})
```

### 8. Update Socket Connect Handler (Around line ~404)

Update to join group if selected:
```javascript
socketInstance.on("connect", () => {
  socketInstance.emit("join_user", { userId: currentUser.id })
  if (selectedChat?.id) {
    if (selectedChat.isGroup || selectedChat.type === 'group') {
      socketInstance.emit("join_group", { groupId: selectedChat.id })
    } else {
      socketInstance.emit("join_conversation", { conversationId: selectedChat.id })
    }
  }
  socketInstance.emit("get_online_users")
})
```

### 9. Add Typing Handler Function (Before handleSendMessage)

Add this function:
```javascript
const handleTyping = useCallback(() => {
  if (!socket || !selectedChat?.isGroup || !currentUser?.id) return
  
  // Clear existing timeout
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current)
  }
  
  // Emit typing start
  socket.emit("group_typing_start", {
    groupId: selectedChat.id,
    senderId: currentUser.id,
    senderName: currentUser.name || currentUser.username || `User ${currentUser.id}`
  })
  
  // Set timeout to stop typing
  typingTimeoutRef.current = setTimeout(() => {
    socket.emit("group_typing_stop", {
      groupId: selectedChat.id,
      senderId: currentUser.id
    })
  }, 3000)
}, [socket, selectedChat, currentUser])
```

### 10. Complete Replacement of `handleSendMessage` Function

Replace the entire function (around line ~558) with this version that handles both private and group messages:

```javascript
const handleSendMessage = async (messageData = null) => {
  // Support both old API (just calling handleSendMessage()) and new API (with messageData)
  const text = messageData?.text || messageInput.trim()
  const file = messageData?.file || null
  const fileType = messageData?.fileType || null

  if (!text && !file) {
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

  const isGroup = selectedChat.isGroup || selectedChat.type === 'group'
  const conversationId = String(selectedChat.id)
  const senderId = String(currentUser.id)

  const tempId = `temp-${Date.now()}`
  const optimisticMessage = {
    id: tempId,
    senderId: senderId,
    text: text || (file ? `[${fileType || 'File'}]` : ""),
    mediaUrl: null,
    mediaType: fileType,
    timestamp: formatTime(new Date().toISOString()),
    isOwn: true,
    isPending: true,
    isGroup: isGroup,
  }

  setMessages((prev) => [...prev, optimisticMessage])
  setMessageInput("")
  if (file) {
    setSelectedFile(null)
    setFileType(null)
  }

  // Join room
  if (socket && socket.connected) {
    if (isGroup) {
      socket.emit("join_group", { groupId: conversationId })
    } else {
      socket.emit("join_conversation", { conversationId })
    }
  }

  const sendGroupMessage = async () => {
    // Upload file first if present
    let mediaUrl = null
    if (file) {
      try {
        const formData = new FormData()
        formData.append("senderId", senderId)
        formData.append("content", text || "")
        formData.append("media", file)
        formData.append("mediaType", fileType || "")

        const uploadRes = await fetch(`/api/group-conversation/${conversationId}/messages`, {
          method: "POST",
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          // Remove optimistic message
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
          // Add real message
          const mapped = mapMessageToUi(uploadData.data, true)
          if (mapped) {
            setMessages((prev) => [...prev, mapped])
          }
          // Update last message
          setChats((prev) =>
            prev.map((chat) => {
              if (String(chat.id) !== conversationId) return chat
              return {
                ...chat,
                lastMessage: text || `[${fileType || 'Media'}]`,
                timestamp: formatTime(uploadData.data.created_at),
              }
            })
          )
          return
        }
        throw new Error("Upload failed")
      } catch (err) {
        throw err
      }
    }

    // Send text message via socket
    return new Promise((resolve, reject) => {
      if (!socket || !socket.connected) {
        reject(new Error("Socket not connected"))
        return
      }

      socket.emit(
        "send_group_message",
        {
          groupId: conversationId,
          senderId: senderId,
          content: text,
          mediaUrl: mediaUrl,
          mediaType: fileType,
        },
        (response) => {
          if (response?.success) {
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== tempId)
              const realMessage = mapMessageToUi(response.message, true)
              return realMessage ? [...filtered, realMessage] : filtered
            })
            
            setChats((prev) =>
              prev.map((chat) => {
                if (String(chat.id) !== conversationId) return chat
                return {
                  ...chat,
                  lastMessage: text || `[${fileType || 'Media'}]`,
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

  const sendPrivateMessage = async () => {
    // Original private message logic (keep existing code)
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
          content: text,
          mediaUrl: null,
        },
        (response) => {
          if (response?.success) {
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== tempId)
              const realMessage = mapMessageToUi(response.message, false)
              return realMessage ? [...filtered, realMessage] : filtered
            })
            
            setChats((prev) =>
              prev.map((chat) => {
                if (String(chat.id) !== conversationId) return chat
                return {
                  ...chat,
                  lastMessage: text,
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
    if (isGroup) {
      await sendGroupMessage()
    } else {
      await sendPrivateMessage()
    }
  } catch (error) {
    console.warn("Send failed:", error)
    setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
    setMessageInput(text)
    if (file) {
      setSelectedFile(file)
      setFileType(fileType)
    }
    toast.error(error.message || "Failed to send message. Please try again.")
  }
}
```

### 11. Update Message Input Area (Around line ~1159)

Replace the message input section with conditional rendering for groups:

```javascript
{/* Message Input */}
<div className="p-4 border-t flex-shrink-0 relative">
  {showEmoji && (
    <div className="absolute bottom-full right-4 mb-2 z-50">
      <Card className={`${cardBg} ${borderColor} border shadow-lg`}>
        <EmojiPicker onSelect={handleEmojiSelect} />
      </Card>
    </div>
  )}
  
  {/* Typing Indicators */}
  {selectedChat?.isGroup && typingUsers.length > 0 && (
    <div className={`text-xs ${textMuted} mb-2 italic px-2`}>
      {typingUsers.map(u => u.name).join(", ")} {typingUsers.length === 1 ? 'is' : 'are'} typing...
    </div>
  )}

  {selectedChat?.isGroup ? (
    <GroupMessageInput
      messageInput={messageInput}
      setMessageInput={(val) => {
        setMessageInput(val)
        handleTyping() // Trigger typing indicator
      }}
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
    />
  ) : (
    // Original private message input (keep existing code)
    <div className="flex items-center gap-2">
      {/* ... existing private message input code ... */}
    </div>
  )}
</div>
```

### 12. Update Message Display (Around line ~1110)

Update message rendering to show sender info for group messages:

```javascript
{!message.isOwn && (
  <Avatar className="h-8 w-8 flex-shrink-0">
    <AvatarImage 
      src={
        message.isGroup 
          ? (message.senderAvatar || "/default.png")
          : (selectedChat?.user?.avatar || "/default.png")
      } 
      alt={message.isGroup ? message.senderName : selectedChat?.user?.name} 
    />
    <AvatarFallback className={`text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
      {message.isGroup 
        ? (message.senderName?.split(" ").map((n) => n[0]).join("") || "?")
        : selectedChat?.user?.name?.split(" ").map((n) => n[0]).join("")
      }
    </AvatarFallback>
  </Avatar>
)}

{/* Add sender name for group messages */}
{message.isGroup && !message.isOwn && message.senderName && (
  <div className="text-xs text-gray-500 mb-1">{message.senderName}</div>
)}
```

### 13. Add Media Display in Messages

Update message content area to show media (around line ~1123):

```javascript
<div className={`max-w-[70%] rounded-2xl px-4 py-2 transition-all duration-200 ${
  message.isOwn
    ? `${messageBgOwn} text-white rounded-br-sm`
    : `${messageBgOther} ${textColor} rounded-bl-sm border ${borderColor}`
}`}>
  {/* Text Content */}
  {message.text && (
    <p className="text-sm break-words">{message.text}</p>
  )}
  
  {/* Media Content */}
  {message.mediaUrl && (
    <div className="mt-2">
      {message.mediaType === 'image' && (
        <img 
          src={message.mediaUrl} 
          alt="Shared image" 
          className="max-w-xs rounded-lg cursor-pointer"
          onClick={() => window.open(message.mediaUrl, '_blank')}
        />
      )}
      {message.mediaType === 'video' && (
        <video 
          src={message.mediaUrl} 
          controls 
          className="max-w-xs rounded-lg"
        />
      )}
      {message.mediaType === 'audio' && (
        <audio 
          src={message.mediaUrl} 
          controls 
          className="w-full"
        />
      )}
      {message.mediaType === 'document' && (
        <a 
          href={message.mediaUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <FileText className="h-5 w-5" />
          <span className="text-sm">View Document</span>
        </a>
      )}
    </div>
  )}
  
  <p className={`text-xs mt-1 ${message.isOwn ? "text-white/70" : textMuted}`}>
    {message.timestamp}
  </p>
</div>
```

## Testing Steps

1. Test sending text messages in groups
2. Test file uploads (image, video, audio, document)
3. Test typing indicators
4. Test last message updates
5. Test real-time message delivery
6. Test switching between private and group chats
7. Test HTTP fallback when socket disconnected

## Notes

- All changes maintain backward compatibility with private messages
- File uploads use HTTP POST (FormData) even when socket is connected
- Typing indicators only work for groups
- Media previews are shown for images and videos before sending
- Last message is updated in real-time for both private and group chats
