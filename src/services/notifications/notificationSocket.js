/**
 * Notification Socket.IO handlers
 * This service handles real-time notification events
 */

let ioInstance = null;

export function setIOInstance(io) {
  ioInstance = io;
}

export function getIOInstance() {
  return ioInstance;
}

/**
 * Emit notification to a specific user via Socket.IO
 * @param {number} userId - The recipient user ID
 * @param {object} notification - The notification object
 */
export function emitNotificationToUser(userId, notification) {
  if (!ioInstance) {
    console.warn("Socket.IO instance not set, notification will not be sent in real-time");
    return;
  }

  try {
    ioInstance.to(`notifications_${userId}`).emit("new_notification", notification);

    // Also update the unread count
    ioInstance.to(`notifications_${userId}`).emit("notification_count_updated", {
      unreadCount: null, // Will be fetched by client
    });
  } catch (error) {
    console.error("Error emitting notification to user:", error);
  }
}

/**
 * Emit notification to multiple users
 * @param {Array<number>} userIds - Array of recipient user IDs
 * @param {object} notification - The notification object
 */
export function emitNotificationToUsers(userIds, notification) {
  userIds.forEach((userId) => {
    emitNotificationToUser(userId, notification);
  });
}
