/**
 * Message Notification Service
 * Integrates with chat system to send notifications for new messages
 */

import { sendPrivateMessageNotification, sendGroupMessageNotification } from './notifications/messageNotifications';

/**
 * Send notification when a private message is sent
 * @param {Object} messageData - Message data
 * @param {Object} senderData - Sender information
 * @param {Object} recipientData - Recipient information
 */
export async function notifyPrivateMessage(messageData, senderData, recipientData) {
  try {
    const senderName = senderData.first_name || senderData.username || 'Someone';
    
    await sendPrivateMessageNotification(
      senderData.id,
      recipientData.id,
      senderName,
      messageData.content,
      messageData.conversation_id
    );
    
    console.log('Private message notification sent successfully');
  } catch (error) {
    console.error('Error sending private message notification:', error);
  }
}

/**
 * Send notification when a group message is sent
 * @param {Object} messageData - Message data
 * @param {Object} senderData - Sender information
 * @param {Array} groupMembers - Group members array
 * @param {Object} groupData - Group information
 */
export async function notifyGroupMessage(messageData, senderData, groupMembers, groupData) {
  try {
    const senderName = senderData.first_name || senderData.username || 'Someone';
    
    // Filter out the sender from notification recipients
    const recipientIds = groupMembers
      .filter(member => String(member.id) !== String(senderData.id))
      .map(member => member.id);
    
    if (recipientIds.length > 0) {
      await sendGroupMessageNotification(
        senderData.id,
        recipientIds,
        senderName,
        groupData.name,
        messageData.content,
        groupData.id
      );
      
      console.log('Group message notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending group message notification:', error);
  }
}

/**
 * Get unread message count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Unread message count
 */
export async function getUnreadMessageCount(userId) {
  try {
    // This would typically query your database for unread messages
    // For now, return 0 as placeholder
    return 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}

/**
 * Mark messages as read for a conversation
 * @param {number} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {boolean} isGroup - Whether it's a group conversation
 */
export async function markMessagesAsRead(userId, conversationId, isGroup = false) {
  try {
    // This would typically update your database to mark messages as read
    console.log(`Marked messages as read for user ${userId} in conversation ${conversationId}`);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}
