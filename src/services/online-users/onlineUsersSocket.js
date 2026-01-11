/**
 * Online Users Socket Handlers
 * 
 * This module contains all socket.io event handlers related to online users tracking.
 * Import and use these handlers in your socket.io setup.
 */

import {
  setUserOnline,
  setUserOffline,
  getUserIdBySocket,
  refreshUserOnline,
  getOnlineUsersWithProfile,
  isUserOnline,
} from './onlineUsersService';

/**
 * Handle user going online
 * @param {Socket} socket - Socket.io socket instance
 * @param {string} userId - User ID
 * @param {Object} userData - Optional user profile data
 */
export async function handleUserOnline(socket, userId, userData = null) {
  try {
    if (!userId) {
      console.warn('handleUserOnline: userId is required');
      return;
    }

    // Set user as online in Redis
    await setUserOnline(userId, socket.id, userData);

    // Join user's personal room
    socket.join(`user_${userId}`);

    // Notify other users that this user came online
    socket.broadcast.emit('user_online', {
      userId: String(userId),
      timestamp: new Date().toISOString(),
    });

    // Send current online users list to the newly connected user
    const onlineUsers = await getOnlineUsersWithProfile(userId);
    socket.emit('online_users_list', {
      users: onlineUsers,
      count: onlineUsers.length,
    });

    // Notify all other users to update their online users list
    const allOnlineUsers = await getOnlineUsersWithProfile();
    socket.broadcast.emit('online_users_list', {
      users: allOnlineUsers,
      count: allOnlineUsers.length,
    });

    console.log(`User ${userId} is now online (socket: ${socket.id})`);
  } catch (error) {
    console.error('Error handling user online:', error);
  }
}

/**
 * Handle user going offline
 * @param {Socket} socket - Socket.io socket instance
 */
export async function handleUserOffline(socket) {
  try {
    // Get user ID from socket
    const userId = await getUserIdBySocket(socket.id);

    if (!userId) {
      console.warn('handleUserOffline: Could not find userId for socket', socket.id);
      return;
    }

    // Set user as offline in Redis
    await setUserOffline(userId, socket.id);

    // Leave user's personal room
    socket.leave(`user_${userId}`);

    // Notify other users that this user went offline
    socket.broadcast.emit('user_offline', {
      userId: String(userId),
      timestamp: new Date().toISOString(),
    });

    // Update online users list for remaining users
    const onlineUsers = await getOnlineUsersWithProfile();
    socket.broadcast.emit('online_users_list', {
      users: onlineUsers,
      count: onlineUsers.length,
    });

    console.log(`User ${userId} is now offline (socket: ${socket.id})`);
  } catch (error) {
    console.error('Error handling user offline:', error);
  }
}

/**
 * Handle user activity (heartbeat/ping)
 * Used to keep user's online status active
 * @param {Socket} socket - Socket.io socket instance
 */
export async function handleUserActivity(socket) {
  try {
    const userId = await getUserIdBySocket(socket.id);
    
    if (userId) {
      await refreshUserOnline(userId, socket.id);
    }
  } catch (error) {
    console.error('Error handling user activity:', error);
  }
}

/**
 * Handle request for online users list
 * @param {Socket} socket - Socket.io socket instance
 */
export async function handleGetOnlineUsers(socket) {
  try {
    const userId = await getUserIdBySocket(socket.id);
    const onlineUsers = await getOnlineUsersWithProfile(userId);
    
    socket.emit('online_users_list', {
      users: onlineUsers,
      count: onlineUsers.length,
    });
  } catch (error) {
    console.error('Error handling get online users:', error);
    socket.emit('online_users_list', {
      users: [],
      count: 0,
      error: 'Failed to fetch online users',
    });
  }
}

/**
 * Handle request to check if specific user is online
 * @param {Socket} socket - Socket.io socket instance
 * @param {string} targetUserId - User ID to check
 */
export async function handleCheckUserOnline(socket, targetUserId) {
  try {
    if (!targetUserId) {
      socket.emit('user_online_status', {
        userId: targetUserId,
        isOnline: false,
        error: 'userId is required',
      });
      return;
    }

    const online = await isUserOnline(targetUserId);
    
    socket.emit('user_online_status', {
      userId: String(targetUserId),
      isOnline: online,
    });
  } catch (error) {
    console.error('Error checking user online status:', error);
    socket.emit('user_online_status', {
      userId: targetUserId,
      isOnline: false,
      error: 'Failed to check user status',
    });
  }
}

/**
 * Setup all online users socket handlers
 * Call this function in your socket.io connection handler
 * @param {Socket} socket - Socket.io socket instance
 * @param {Server} io - Socket.io server instance
 */
export function setupOnlineUsersHandlers(socket, io) {
  // User joins and goes online
  socket.on('user_online', async ({ userId, userData }) => {
    await handleUserOnline(socket, userId, userData);
  });

  // Request current online users list
  socket.on('get_online_users', async () => {
    await handleGetOnlineUsers(socket);
  });

  // Check if specific user is online
  socket.on('check_user_online', async ({ userId }) => {
    await handleCheckUserOnline(socket, userId);
  });

  // User activity heartbeat (refresh online status)
  socket.on('user_activity', async () => {
    await handleUserActivity(socket);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    await handleUserOffline(socket);
  });
}
