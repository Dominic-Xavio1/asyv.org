# Online Users Tracking System

This directory contains all the functionality for tracking online users using Redis and Socket.io.

## Structure

```
src/services/online-users/
├── onlineUsersService.js    # Redis operations and business logic
├── onlineUsersSocket.js     # Socket.io event handlers
└── README.md                # This file

src/services/redis/
└── redisClient.js           # Redis connection singleton

src/app/api/online-users/
└── route.js                 # HTTP API endpoint for fetching online users
```

## Features

- **Real-time Online Status**: Track when users come online or go offline
- **Redis-based Storage**: Fast, scalable storage for online user data
- **Automatic Cleanup**: Expired sessions are automatically removed
- **Socket.io Integration**: Real-time updates via WebSocket connections
- **Profile Integration**: Fetches user profile data from database

## How It Works

### 1. User Comes Online

When a user connects via Socket.io:
- User emits `join_user` event with their `userId`
- Server marks user as online in Redis with 1-hour TTL
- All other users are notified via `user_online` event
- Online users list is broadcast to all connected clients

### 2. User Goes Offline

When a user disconnects:
- Server detects disconnect event
- User is removed from Redis
- All other users are notified via `user_offline` event
- Online users list is updated for all clients

### 3. Heartbeat/Activity

Users send periodic activity pings to keep their online status active:
- Emitted every 30 seconds from client
- Refreshes TTL in Redis (extends online status)

## API Endpoints

### GET /api/online-users

Fetches list of currently online users.

**Query Parameters:**
- `excludeUserId` (optional): User ID to exclude from results
- `countOnly` (optional): If `true`, returns only the count

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": "/uploads/profiles/user123.jpg",
      "status": "online"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Socket Events

### Client → Server Events

- `user_online`: Notify server that user is online (automatically sent on `join_user`)
- `get_online_users`: Request current list of online users
- `check_user_online`: Check if a specific user is online
- `user_activity`: Heartbeat to keep online status active

### Server → Client Events

- `user_online`: User came online (broadcast to all except the user)
- `user_offline`: User went offline (broadcast to all except the user)
- `online_users_list`: Current list of online users
- `user_online_status`: Response to `check_user_online` request

## Usage in Components

### Fetching Online Users

```javascript
const [onlineUsers, setOnlineUsers] = useState([])

useEffect(() => {
  const fetchOnlineUsers = async () => {
    const res = await fetch('/api/online-users?excludeUserId=123')
    const data = await res.json()
    if (data.success) {
      setOnlineUsers(data.data)
    }
  }
  fetchOnlineUsers()
}, [])
```

### Listening to Socket Events

```javascript
useEffect(() => {
  if (!socket) return

  socket.on('online_users_list', (data) => {
    setOnlineUsers(data.users)
  })

  socket.on('user_online', ({ userId }) => {
    // User came online
    // Update your UI accordingly
  })

  socket.on('user_offline', ({ userId }) => {
    // User went offline
    // Update your UI accordingly
  })
}, [socket])
```

## Redis Keys Structure

- `online:user:socket:{userId}` → socketId (TTL: 1 hour)
- `online:socket:user:{socketId}` → userId (TTL: 1 hour)
- `online:presence:{userId}` → user data JSON (TTL: 1 hour)
- `online:users:set` → Set of all online user IDs

## Environment Variables

Add to your `.env` file:

```env
REDIS_URL=redis://localhost:6379
```

For production with Redis Cloud or similar:
```env
REDIS_URL=redis://:password@host:port
```

## Error Handling

The system gracefully handles Redis connection failures:
- If Redis is unavailable, the app continues to work
- Online status tracking will be disabled, but other features remain functional
- Error messages are logged to console for debugging

## Performance Considerations

- TTL of 1 hour prevents stale data accumulation
- Activity heartbeat extends TTL automatically
- Set-based storage for efficient online user lookups
- Database queries are batched when fetching user profiles

## Future Enhancements

- [ ] User status types (online, away, busy, offline)
- [ ] Last seen timestamp
- [ ] Typing indicators
- [ ] Read receipts tracking
- [ ] User presence subscriptions (notify when specific users come online)
