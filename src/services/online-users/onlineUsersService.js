import redisClient from '../redis/redisClient';
import pool from '../../connection/databaseConnection';

/**
 * Online Users Service
 * 
 * This service handles all Redis operations for tracking online users.
 * It manages user sessions, online status, and provides methods to query
 * online users with their profile information.
 */

// Redis key prefixes for better organization
const REDIS_KEYS = {
  USER_SOCKET: 'online:user:socket:',      // user:socket:userId -> socketId
  SOCKET_USER: 'online:socket:user:',      // socket:user:socketId -> userId
  USER_PRESENCE: 'online:presence:',       // presence:userId -> user data JSON
  ONLINE_SET: 'online:users:set',          // Set of all online user IDs
};

/**
 * Set user as online
 * @param {string} userId - User ID
 * @param {string} socketId - Socket ID
 * @param {Object} userData - User profile data (optional)
 */
export async function setUserOnline(userId, socketId, userData = null) {
  try {
    const client = await redisClient.getClient();
    
    // Store mapping: userId -> socketId
    await client.setEx(
      `${REDIS_KEYS.USER_SOCKET}${userId}`,
      3600, // 1 hour TTL (refresh on activity)
      socketId
    );

    // Store mapping: socketId -> userId (for quick lookup on disconnect)
    await client.setEx(
      `${REDIS_KEYS.SOCKET_USER}${socketId}`,
      3600,
      userId
    );

    // Add user to online set
    await client.sAdd(REDIS_KEYS.ONLINE_SET, userId);

    // Store user presence data if provided
    if (userData) {
      await client.setEx(
        `${REDIS_KEYS.USER_PRESENCE}${userId}`,
        3600,
        JSON.stringify(userData)
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting user online:', error);
    throw error;
  }
}

/**
 * Set user as offline
 * @param {string} userId - User ID
 * @param {string} socketId - Socket ID
 */
export async function setUserOffline(userId, socketId) {
  try {
    const client = await redisClient.getClient();
    
    // Remove socket mappings
    await client.del(`${REDIS_KEYS.USER_SOCKET}${userId}`);
    await client.del(`${REDIS_KEYS.SOCKET_USER}${socketId}`);
    
    // Remove from online set
    await client.sRem(REDIS_KEYS.ONLINE_SET, userId);
    
    // Remove presence data
    await client.del(`${REDIS_KEYS.USER_PRESENCE}${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Error setting user offline:', error);
    throw error;
  }
}

/**
 * Get user ID by socket ID
 * @param {string} socketId - Socket ID
 * @returns {string|null} User ID or null
 */
export async function getUserIdBySocket(socketId) {
  try {
    const client = await redisClient.getClient();
    const userId = await client.get(`${REDIS_KEYS.SOCKET_USER}${socketId}`);
    return userId;
  } catch (error) {
    console.error('Error getting user ID by socket:', error);
    return null;
  }
}

/**
 * Refresh user online status (extends TTL)
 * @param {string} userId - User ID
 * @param {string} socketId - Socket ID
 */
export async function refreshUserOnline(userId, socketId) {
  try {
    const client = await redisClient.getClient();
    
    // Refresh TTL for both mappings
    await client.expire(`${REDIS_KEYS.USER_SOCKET}${userId}`, 3600);
    await client.expire(`${REDIS_KEYS.SOCKET_USER}${socketId}`, 3600);
    
    // Refresh presence data if it exists
    const presenceExists = await client.exists(`${REDIS_KEYS.USER_PRESENCE}${userId}`);
    if (presenceExists) {
      await client.expire(`${REDIS_KEYS.USER_PRESENCE}${userId}`, 3600);
    }

    return { success: true };
  } catch (error) {
    console.error('Error refreshing user online status:', error);
    throw error;
  }
}

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean} True if user is online
 */
export async function isUserOnline(userId) {
  try {
    const client = await redisClient.getClient();
    const exists = await client.exists(`${REDIS_KEYS.USER_SOCKET}${userId}`);
    return exists === 1;
  } catch (error) {
    console.error('Error checking if user is online:', error);
    return false;
  }
}

/**
 * Get all online user IDs
 * @returns {string[]} Array of user IDs
 */
export async function getAllOnlineUserIds() {
  try {
    const client = await redisClient.getClient();
    const userIds = await client.sMembers(REDIS_KEYS.ONLINE_SET);
    return userIds || [];
  } catch (error) {
    console.error('Error getting all online user IDs:', error);
    return [];
  }
}

/**
 * Get online users with full profile data from database
 * @param {string} excludeUserId - User ID to exclude from results (optional)
 * @returns {Array} Array of online user objects with profile data
 */
export async function getOnlineUsersWithProfile(excludeUserId = null) {
  try {
    // Get all online user IDs from Redis
    const onlineUserIds = await getAllOnlineUserIds();
    
    if (onlineUserIds.length === 0) {
      return [];
    }

    // Filter out excluded user if provided
    const userIdsToFetch = excludeUserId 
      ? onlineUserIds.filter(id => String(id) !== String(excludeUserId))
      : onlineUserIds;

    if (userIdsToFetch.length === 0) {
      return [];
    }
    // Fetch user profile data from database
    // Using a query that matches the structure used in conversations
    const placeholders = userIdsToFetch.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT DISTINCT
        u.id,
        u.first_name,
        u.rwandan_name,
        u.username,
        u.email,
        COALESCE(up.profile_image, '/default.png') as avatar,
        'online' as status
      FROM api_user u
      LEFT JOIN user_profile up ON up.created_by = u.id
      WHERE u.id IN (${placeholders})
      ORDER BY u.first_name ASC
    `;

    const result = await pool.query(query, userIdsToFetch);
    
    // Format the results to match the expected structure
    const onlineUsers = result.rows.map(user => ({
      id: String(user.id),
      name: user.rwandan_name 
        ? `${user.first_name || ''} ${user.rwandan_name}`.trim()
        : user.first_name || user.username || `User ${user.id}`,
      username: user.username,
      email: user.email,
      avatar: user.avatar || '/default.png',
      status: 'online',
    }));

    return onlineUsers;
  } catch (error) {
    console.error('Error getting online users with profile:', error);
    return [];
  }
}

/**
 * Get count of online users
 * @param {string} excludeUserId - User ID to exclude from count (optional)
 * @returns {number} Count of online users
 */
export async function getOnlineUsersCount(excludeUserId = null) {
  try {
    const onlineUserIds = await getAllOnlineUserIds();
    
    if (excludeUserId) {
      return onlineUserIds.filter(id => String(id) !== String(excludeUserId)).length;
    }
    
    return onlineUserIds.length;
  } catch (error) {
    console.error('Error getting online users count:', error);
    return 0;
  }
}

/**
 * Clean up expired entries (can be called periodically)
 * This removes users from the online set if their socket mapping has expired
 */
export async function cleanupExpiredUsers() {
  try {
    const client = await redisClient.getClient();
    const onlineUserIds = await getAllOnlineUserIds();
    
    let cleanedCount = 0;
    
    for (const userId of onlineUserIds) {
      const exists = await client.exists(`${REDIS_KEYS.USER_SOCKET}${userId}`);
      if (!exists) {
        // Socket mapping expired, remove from set
        await client.sRem(REDIS_KEYS.ONLINE_SET, userId);
        await client.del(`${REDIS_KEYS.USER_PRESENCE}${userId}`);
        cleanedCount++;
      }
    }
    
    return { cleanedCount };
  } catch (error) {
    console.error('Error cleaning up expired users:', error);
    return { cleanedCount: 0 };
  }
}
