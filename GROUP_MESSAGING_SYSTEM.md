# Group Messaging System Documentation

## Overview
This document describes the group messaging system implementation, including file uploads, typing indicators, and real-time message delivery.

## System Architecture

### Database Schema
**Table: `group_message`**
- `id` (Primary Key)
- `sender_id` (Foreign Key to api_user.id)
- `group_id` (Foreign Key to group_conversation.id)
- `content` (TEXT) - Text content of the message
- `media_url` (TEXT) - URL path to uploaded media file
- `media_type` (TEXT) - Type of media: 'image', 'video', 'audio', 'document'
- `created_at` (TIMESTAMP)

### File Structure

```
src/
├── app/
│   ├── api/
│   │   └── (chat)/
│   │       └── group-conversation/
│   │           └── [groupId]/
│   │               └── messages/
│   │                   └── route.js          # GET/POST endpoints for group messages
│   └── chat/
│       ├── page.js                           # Main chat interface
│       └── GroupMessageInput.js              # File upload component
├── services/
│   └── group-messages/
│       └── groupMessagesSocket.js            # Socket.io handlers for groups
└── pages/
    └── api/
        └── socketio.js                        # Socket.io server setup

GROUP_MESSAGING_SYSTEM.md                     # This documentation file
```

---

## API Endpoints

### 1. Get Group Messages
**GET** `/api/group-conversation/[groupId]/messages`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "group_id": "456",
      "sender_id": "789",
      "content": "Hello everyone!",
      "media_url": null,
      "media_type": null,
      "created_at": "2024-01-01T12:00:00Z",
      "sender_name": "John Doe",
      "sender_avatar": "/uploads/profile/user.jpg"
    }
  ]
}
```

### 2. Send Group Message (HTTP Fallback)
**POST** `/api/group-conversation/[groupId]/messages`

**Body (FormData):**
- `senderId` (string, required)
- `content` (string, optional if media provided)
- `media` (File, optional)
- `mediaType` (string, optional: 'image', 'video', 'audio', 'document')

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "group_id": "456",
    "sender_id": "789",
    "content": "Hello!",
    "media_url": "/uploads/group-messages/group-msg-456-1234567890.jpg",
    "media_type": "image",
    "created_at": "2024-01-01T12:00:00Z",
    "sender_name": "John Doe",
    "sender_avatar": "/uploads/profile/user.jpg"
  }
}
```

---

## Socket.io Events

### Client → Server Events

#### Join Group Room
```javascript
socket.emit("join_group", { groupId: "123" })
```
Joins the socket room `group_123` to receive group messages.

#### Leave Group Room
```javascript
socket.emit("leave_group", { groupId: "123" })
```
Leaves the socket room for the group.

#### Send Group Message
```javascript
socket.emit("send_group_message", {
  groupId: "123",
  senderId: "789",
  content: "Hello!",
  mediaUrl: "/uploads/group-messages/file.jpg", // optional
  mediaType: "image" // optional
}, (response) => {
  if (response.success) {
    console.log("Message sent:", response.message)
  }
})
```

#### Typing Indicator - Start
```javascript
socket.emit("group_typing_start", {
  groupId: "123",
  senderId: "789",
  senderName: "John Doe"
})
```

#### Typing Indicator - Stop
```javascript
socket.emit("group_typing_stop", {
  groupId: "123",
  senderId: "789"
})
```

### Server → Client Events

#### Group Message Received
```javascript
socket.on("group_message", (message) => {
  // message structure:
  // {
  //   id, group_id, sender_id, content, media_url, media_type, created_at,
  //   sender_name, sender_avatar
  // }
})
```
Broadcasted to all members in the group room.

#### Group Last Message Update
```javascript
socket.on("group_last_message", ({ groupId, lastMessage, timestamp }) => {
  // Update last message in conversation list
})
```

#### Typing Indicator
```javascript
socket.on("group_typing", ({ groupId, senderId, senderName, isTyping: true }) => {
  // Show typing indicator for senderName
})
```

#### Typing Indicator Stop
```javascript
socket.on("group_typing_stop", ({ groupId, senderId }) => {
  // Hide typing indicator for senderId
})
```

---

## Frontend Implementation

### Component: GroupMessageInput

**Location:** `src/app/chat/GroupMessageInput.js`

**Features:**
- File upload support (images, videos, audio, documents)
- File preview for images and videos
- File size validation (50MB max)
- Integration with message input

**Props:**
- `messageInput` - Current message text
- `setMessageInput` - Setter for message text
- `onSendMessage` - Callback when sending message
- `disabled` - Disable input
- `isDark` - Dark mode flag
- Theme props (inputBg, borderColor, textColor, textMuted)
- `showEmoji`, `setShowEmoji`, `onEmojiSelect` - Emoji picker props

**Usage:**
```javascript
<GroupMessageInput
  messageInput={messageInput}
  setMessageInput={setMessageInput}
  onSendMessage={handleSendGroupMessage}
  disabled={isLoading}
  isDark={theme === 'dark'}
  // ... other props
/>
```

### Chat Page Integration

**Key Functions:**

#### 1. Load Group Messages
```javascript
const loadGroupMessages = async (groupId) => {
  const res = await fetch(`/api/group-conversation/${groupId}/messages`)
  const data = await res.json()
  // Process and display messages
}
```

#### 2. Send Group Message
```javascript
const handleSendGroupMessage = async ({ text, file, fileType }) => {
  // If socket connected, use socket
  if (socket && socket.connected) {
    socket.emit("send_group_message", {
      groupId: selectedChat.id,
      senderId: currentUser.id,
      content: text,
      mediaUrl: uploadedFileUrl, // if file uploaded
      mediaType: fileType
    }, (response) => {
      // Handle response
    })
  } else {
    // HTTP fallback
    const formData = new FormData()
    formData.append("senderId", currentUser.id)
    formData.append("content", text)
    if (file) {
      formData.append("media", file)
      formData.append("mediaType", fileType)
    }
    await fetch(`/api/group-conversation/${selectedChat.id}/messages`, {
      method: "POST",
      body: formData
    })
  }
}
```

#### 3. Typing Indicator Logic
```javascript
const typingTimeoutRef = useRef(null)

const handleTyping = () => {
  if (!socket || !selectedChat?.isGroup) return
  
  // Clear existing timeout
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current)
  }
  
  // Emit typing start
  socket.emit("group_typing_start", {
    groupId: selectedChat.id,
    senderId: currentUser.id,
    senderName: currentUser.name
  })
  
  // Set timeout to stop typing
  typingTimeoutRef.current = setTimeout(() => {
    socket.emit("group_typing_stop", {
      groupId: selectedChat.id,
      senderId: currentUser.id
    })
  }, 3000) // Stop after 3 seconds of inactivity
}
```

#### 4. Socket Event Listeners
```javascript
// Listen for group messages
socket.on("group_message", (message) => {
  if (selectedChat?.isGroup && String(selectedChat.id) === String(message.group_id)) {
    // Add message to UI
    setMessages(prev => [...prev, mapGroupMessageToUi(message)])
    
    // Update last message in chat list
    setChats(prev => prev.map(chat => 
      String(chat.id) === String(message.group_id)
        ? { ...chat, lastMessage: message.content || '[Media]', timestamp: formatTime(message.created_at) }
        : chat
    ))
  }
})

// Listen for typing indicators
socket.on("group_typing", ({ groupId, senderId, senderName }) => {
  if (selectedChat?.isGroup && String(selectedChat.id) === String(groupId)) {
    setTypingUsers(prev => {
      if (!prev.find(u => u.id === senderId)) {
        return [...prev, { id: senderId, name: senderName }]
      }
      return prev
    })
  }
})

socket.on("group_typing_stop", ({ groupId, senderId }) => {
  if (selectedChat?.isGroup && String(selectedChat.id) === String(groupId)) {
    setTypingUsers(prev => prev.filter(u => u.id !== senderId))
  }
})
```

---

## Media Upload Handling

### Supported Media Types
1. **Images**: JPG, PNG, GIF, WebP
2. **Videos**: MP4, MOV, AVI, WebM (max 50MB)
3. **Audio**: MP3, WAV, OGG, M4A
4. **Documents**: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX

### Upload Flow
1. User selects file via file input
2. File is validated (size, type)
3. Preview is shown (for images/videos)
4. On send:
   - If socket: File is uploaded via HTTP, then socket emits with mediaUrl
   - If HTTP fallback: File is sent via FormData
5. Server saves file to `/public/uploads/group-messages/`
6. File path is stored in database

### File Storage
- **Location**: `public/uploads/group-messages/`
- **Naming**: `group-msg-{groupId}-{timestamp}.{ext}`
- **Size Limit**: 50MB per file

---

## Typing Indicators

### Implementation Details

1. **Start Typing**: Emitted when user starts typing in group input
2. **Stop Typing**: Automatically emitted after 3 seconds of inactivity
3. **Display**: Shows "X is typing..." below message input
4. **Scope**: Only visible to other members in the same group

### State Management
```javascript
const [typingUsers, setTypingUsers] = useState([]) // Array of { id, name }
```

### Display Component
```jsx
{typingUsers.length > 0 && (
  <div className="px-4 py-2 text-sm text-gray-500 italic">
    {typingUsers.map(u => u.name).join(", ")} {typingUsers.length === 1 ? 'is' : 'are'} typing...
  </div>
)}
```

---

## Last Message Display

### In Chat List
- Shows last message content (text) or "[Media]" for media messages
- Updated in real-time via socket events
- Sorted by timestamp (most recent first)

### Implementation
```javascript
// Update on new message
setChats(prev => prev.map(chat => 
  String(chat.id) === String(groupId)
    ? { 
        ...chat, 
        lastMessage: message.content || `[${message.media_type || 'Media'}]`,
        timestamp: formatTime(message.created_at)
      }
    : chat
))
```

---

## Error Handling

### Common Errors

1. **File Too Large**
   - Error: "File size must be less than 50MB"
   - Action: User must select smaller file

2. **Not a Group Member**
   - Error: "You are not a member of this group"
   - Action: User cannot send messages to groups they're not in

3. **Socket Connection Failed**
   - Fallback: Uses HTTP POST endpoint
   - User experience: Slight delay, but message still sends

4. **Upload Failed**
   - Error: "Failed to upload file"
   - Action: User can retry

---

## Debugging Guide

### Check Socket Connection
```javascript
console.log("Socket connected:", socket?.connected)
console.log("Socket ID:", socket?.id)
```

### Check Group Room Membership
- Server logs: "Socket {id} joined group room: group_{groupId}"
- Client: Verify `join_group` event is emitted

### Verify Message Flow
1. Check browser Network tab for API calls
2. Check browser Console for socket events
3. Check server logs for socket events
4. Verify database records in `group_message` table

### Common Issues

**Messages not appearing:**
- Check if socket room is joined correctly
- Verify `group_message` event listener is set up
- Check if message is being filtered out

**Typing indicators not working:**
- Verify `group_typing_start` and `group_typing_stop` events are emitted
- Check if typing timeout is cleared properly
- Verify socket connection

**Files not uploading:**
- Check file size (must be < 50MB)
- Verify upload directory exists: `public/uploads/group-messages/`
- Check server logs for file system errors
- Verify file permissions

---

## Future Enhancements

1. **Message Reactions** - Add emoji reactions to messages
2. **Message Editing** - Edit sent messages
3. **Message Deletion** - Delete messages (soft delete)
4. **Read Receipts** - Show who has read messages
5. **Message Search** - Search within group messages
6. **File Compression** - Compress images/videos before upload
7. **Media Gallery** - View all media in a group
8. **Voice Messages** - Record and send voice messages directly

---

## Testing Checklist

- [ ] Send text message in group
- [ ] Send image in group
- [ ] Send video in group
- [ ] Send audio file in group
- [ ] Send document in group
- [ ] Typing indicator appears for other users
- [ ] Typing indicator disappears after timeout
- [ ] Last message updates in chat list
- [ ] Messages appear in real-time via socket
- [ ] HTTP fallback works when socket disconnected
- [ ] File upload fails gracefully (size limit)
- [ ] Non-members cannot send messages
- [ ] Messages load correctly on page refresh
- [ ] Multiple file types work correctly
- [ ] File previews display correctly

---

## Contact & Support

For issues or questions about the group messaging system, refer to this documentation or check the code comments in the relevant files.
