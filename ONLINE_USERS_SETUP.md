# Online Users Tracking - Setup Guide

This guide will help you set up and use the online users tracking system that has been implemented in your project.

## What Was Created

A complete, professional online users tracking system using Redis and Socket.io with the following structure:

```
src/
├── services/
│   ├── redis/
│   │   └── redisClient.js              # Redis connection singleton
│   └── online-users/
│       ├── onlineUsersService.js       # Redis operations & business logic
│       ├── onlineUsersSocket.js        # Socket.io event handlers
│       └── README.md                   # Detailed documentation
├── app/
│   ├── api/
│   │   └── online-users/
│   │       └── route.js                # HTTP API endpoint
│   └── chat/
│       └── page.js                     # Updated to use real online users
└── pages/
    └── api/
        └── socketio.js                 # Updated with online users integration
```

## Prerequisites

1. **Redis Server**: You need Redis installed and running on your system
   - Download from: https://redis.io/download
   - Or use Docker: `docker run -d -p 6379:6379 redis:latest`
   - Or use a cloud service like Redis Cloud, Upstash, etc.

2. **Environment Variables**: Add to your `.env` file:
   ```env
   REDIS_URL=redis://localhost:6379
   ```
   
   For Redis with password:
   ```env
   REDIS_URL=redis://:password@localhost:6379
   ```
   
   For cloud Redis (example):
   ```env
   REDIS_URL=redis://default:your-password@redis-xxx.upstash.io:6379
   ```

## How It Works

### 1. When a User Connects

- User opens the chat page
- Socket.io connection is established
- User emits `join_user` event with their `userId`
- System:
  - Marks user as online in Redis (with 1-hour TTL)
  - Fetches user profile from database
  - Notifies all other users via `user_online` event
  - Broadcasts updated online users list to all clients

### 2. Real-time Updates

- When any user comes online → all clients receive `user_online` event
- When any user goes offline → all clients receive `user_offline` event
- Online users list updates automatically for everyone

### 3. Activity Heartbeat

- Every 30 seconds, clients send `user_activity` event
- This refreshes the TTL in Redis (extends online status)
- Prevents users from being marked offline due to inactivity

### 4. When a User Disconnects

- Socket.io disconnect event is detected
- User is removed from Redis
- All other users are notified via `user_offline` event
- Online users list is updated

## Features

✅ **Real-time online status tracking**
✅ **Automatic cleanup of expired sessions**
✅ **Profile data integration**
✅ **Scalable Redis-based storage**
✅ **Socket.io real-time updates**
✅ **HTTP API endpoint for fetching online users**
✅ **Chat list shows online/offline status**

## API Usage

### Get Online Users

```javascript
// Get all online users (excluding current user)
fetch('/api/online-users?excludeUserId=123')
  .then(res => res.json())
  .then(data => {
    console.log('Online users:', data.data)
    console.log('Count:', data.count)
  })

// Get only count
fetch('/api/online-users?countOnly=true')
  .then(res => res.json())
  .then(data => {
    console.log('Online count:', data.count)
  })
```

## Testing

1. **Start Redis** (if not already running):
   ```bash
   redis-server
   # or with Docker
   docker run -d -p 6379:6379 redis:latest
   ```

2. **Start your Next.js app**:
   ```bash
   npm run dev
   ```

3. **Test the system**:
   - Open chat page in multiple browser tabs/windows
   - Login as different users in each tab
   - You should see users appear in the "Online Users" sidebar
   - When you close a tab, that user should disappear from the list

## Troubleshooting

### Redis Connection Errors

If you see errors about Redis connection:
1. Verify Redis is running: `redis-cli ping` (should return `PONG`)
2. Check `REDIS_URL` in your `.env` file
3. The app will continue to work without Redis, but online tracking will be disabled

### Users Not Appearing Online

1. Check browser console for socket connection errors
2. Verify `join_user` event is being emitted with correct `userId`
3. Check Redis is accessible and keys are being created
4. Verify user profile data exists in database

### Socket Events Not Firing

1. Check socket.io connection is established
2. Verify `path: "/api/socketio"` matches your socket configuration
3. Check browser Network tab for WebSocket connection

## File Locations for Easy Debugging

All online users functionality is in these locations:
- **Redis operations**: `src/services/online-users/onlineUsersService.js`
- **Socket handlers**: `src/services/online-users/onlineUsersSocket.js`
- **Redis client**: `src/services/redis/redisClient.js`
- **API endpoint**: `src/app/api/online-users/route.js`
- **Socket setup**: `src/pages/api/socketio.js`
- **Chat UI**: `src/app/chat/page.js`

## Next Steps (Future Features)

The system is designed to be extensible. You can easily add:
- User status types (away, busy, etc.)
- Last seen timestamps
- Typing indicators
- Video call presence
- File sharing status

All related code will be in the `src/services/online-users/` directory for easy maintenance.



## Private Messaging System - Troubleshooting & Fixes

### Issues Fixed (2024)

#### 1. **Syntax Error in Messages Route** ✅ FIXED
**Problem:** Invalid JavaScript code (`com`) on line 23 of `messages/[conversationId]/route.js` causing 400 errors.
**Fix:** Removed the invalid code.

**File:** `src/app/api/(chat)/privatechat/messages/[conversationId]/route.js`

---

#### 2. **Missing Socket Connection Validation** ✅ FIXED
**Problem:** Messages were sent without checking if socket was connected, causing silent failures.

**Fix:**
- Added connection status check before sending via socket
- Added automatic HTTP fallback if socket is not connected
- Added timeout handling (5 seconds) for socket responses

**File:** `src/app/chat/page.js` - `handleSendMessage` function

**Key Changes:**
```javascript
// Now checks socket.connected before sending
if (!socket || !socket.connected) {
  // Automatically falls back to HTTP
}
```

---

#### 3. **Poor Error Handling & User Feedback** ✅ FIXED
**Problem:** Errors were only logged to console, users had no feedback.

**Fix:**
- Added comprehensive validation with user-friendly error messages
- Added toast notifications for all error states
- Added proper error recovery (restores message on failure)

**Validation Added:**
- Empty message check
- User authentication check
- Conversation selection check
- Clear error messages for each scenario

---

#### 4. **No Optimistic UI Updates** ✅ FIXED
**Problem:** Messages didn't appear immediately, making chat feel slow.

**Fix:**
- Added optimistic message rendering
- Messages appear instantly in UI
- Real message replaces optimistic one when confirmed
- Handles duplicates and conflicts gracefully

**Implementation:**
```javascript
// Creates temporary message for immediate feedback
const tempId = `temp-${Date.now()}`
const optimisticMessage = {
  id: tempId,
  isPending: true, // Marks as pending
  // ... message data
}
```

---

#### 5. **Conversation Room Not Joined** ✅ FIXED
**Problem:** Users weren't always in conversation room when sending, causing delivery issues.

**Fix:**
- Automatically joins conversation room before sending
- Ensures room is joined on chat selection
- Handles connection delays gracefully

**File:** `src/app/chat/page.js` - `handleChatSelect` and `handleSendMessage`

---

#### 6. **No HTTP Fallback** ✅ FIXED
**Problem:** If socket failed, entire messaging system broke.

**Fix:**
- Created dedicated HTTP route: `/api/privatechat/message`
- Automatic fallback when socket fails
- Same validation and security checks
- Seamless user experience

**New Route:** `src/app/api/(chat)/privatechat/message/route.js`

**Features:**
- Validates conversation exists
- Checks user is participant (authorization)
- Same database operations as socket handler
- Returns same response format

---

#### 7. **Data Type Inconsistencies** ✅ FIXED
**Problem:** IDs were sometimes strings, sometimes numbers, causing comparison failures.

**Fix:**
- All IDs converted to strings consistently
- Server-side validation ensures string format
- Client-side comparisons use String() conversion

**Files Updated:**
- `src/app/chat/page.js` - All ID comparisons
- `src/pages/api/socketio.js` - Server-side validation

---

#### 8. **Message Duplication** ✅ FIXED
**Problem:** Optimistic messages and real messages could duplicate.

**Fix:**
- Smart duplicate detection
- Replaces optimistic messages with real ones
- Prevents duplicate rendering
- Handles edge cases (network delays, reconnections)

---

### Message Sending Flow (Current Implementation)

```
User clicks Send
    ↓
1. Validate input & permissions
    ↓
2. Add optimistic message to UI (instant feedback)
    ↓
3. Clear input field
    ↓
4. Try Socket.IO (preferred method)
    ├─ Success → Replace optimistic with real message
    └─ Failure → Try HTTP fallback
        ├─ Success → Replace optimistic with real message
        └─ Failure → Remove optimistic, show error, restore input
```

### Error Handling Flow

```
Socket Error
    ↓
Try HTTP Fallback
    ↓
HTTP Error
    ↓
Remove optimistic message
Restore message to input
Show error toast to user
```

### Key Files for Messaging

**Client Side:**
- `src/app/chat/page.js` - Main chat UI and message sending logic

**Server Side:**
- `src/pages/api/socketio.js` - Socket.IO message handler
- `src/app/api/(chat)/privatechat/message/route.js` - HTTP fallback route
- `src/app/api/(chat)/privatechat/messages/[conversationId]/route.js` - Message fetching

### Testing Messaging

1. **Test Socket Sending:**
   - Send message when socket is connected
   - Should appear immediately (optimistic)
   - Should update with real ID when confirmed

2. **Test HTTP Fallback:**
   - Disconnect socket (close browser tab briefly)
   - Try sending message
   - Should automatically use HTTP
   - Should still work seamlessly

3. **Test Error Handling:**
   - Try sending without conversation selected
   - Try sending empty message
   - Should show appropriate error messages

4. **Test Duplicates:**
   - Send message quickly multiple times
   - Should not create duplicates
   - Optimistic messages should be replaced correctly

### Common Issues & Solutions

#### Issue: "Failed to send message" error
**Possible Causes:**
1. Socket not connected and HTTP fallback failed
2. User not participant in conversation
3. Conversation doesn't exist
4. Database connection issue

**Solutions:**
- Check browser console for detailed error
- Verify conversation exists
- Verify user is logged in
- Check database connection

#### Issue: Messages not appearing
**Possible Causes:**
1. Not in conversation room
2. Socket not receiving broadcasts
3. Message filtering issue

**Solutions:**
- Check if `join_conversation` event fired
- Verify socket connection status
- Check server logs for broadcast errors

#### Issue: Messages appear twice
**Possible Causes:**
1. Optimistic message not being replaced
2. Both socket and HTTP succeeding
3. Socket receiving own message twice

**Solutions:**
- Check duplicate detection logic
- Verify message ID matching
- Check socket room membership

### Debugging Tips

1. **Enable Console Logging:**
   - All errors are logged with context
   - Check browser console for detailed info

2. **Check Socket Status:**
   ```javascript
   // In browser console
   socket.connected // Should be true
   socket.id // Should have socket ID
   ```

3. **Verify Room Membership:**
   - Check server logs for join events
   - Verify conversation ID matches

4. **Test Both Paths:**
   - Test with socket connected
   - Test with socket disconnected (HTTP fallback)

### Code Structure for Easy Debugging

**Message Sending:**
- `handleSendMessage()` - Main function in `src/app/chat/page.js`
- All validation at the start
- Clear separation: Socket → HTTP fallback
- Error recovery at each step

**Socket Handler:**
- `send_private_message` event in `src/pages/api/socketio.js`
- Comprehensive validation
- Authorization checks
- Detailed error logging

**HTTP Route:**
- POST `/api/privatechat/message` in `src/app/api/(chat)/privatechat/message/route.js`
- Same validation as socket
- Same security checks
- Same response format

## Support

If you encounter issues:
1. Check the README in `src/services/online-users/README.md`
2. Review console logs for error messages (both browser and server)
3. Verify Redis connection and environment variables
4. Check socket.io connection status in browser DevTools
5. For messaging issues, check the "Private Messaging System" section above
6. Verify database connection and table structure
7. Check that conversation exists and user is participant