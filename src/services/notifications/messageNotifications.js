/**
 * Message Notification Service
 * Handles notifications for private messages and group messages
 */

import { emitNotificationToUser, emitNotificationToUsers } from './notificationSocket';

/**
 * Send notification for new private message
 * @param {number} senderId - ID of the user sending the message
 * @param {number} recipientId - ID of the user receiving the message
 * @param {string} senderName - Name of the sender
 * @param {string} messageContent - Content of the message (truncated)
 * @param {string} conversationId - ID of the conversation
 */
export async function sendPrivateMessageNotification(senderId, recipientId, senderName, messageContent, conversationId) {
  try {
    // Truncate message content for notification
    const truncatedMessage = messageContent.length > 50 
      ? messageContent.substring(0, 50) + '...' 
      : messageContent;

    const notification = {  
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'message',
      title: 'New Message',
      message: `${senderName}: ${truncatedMessage}`,
      link: `/chat?private=${conversationId}`,
    };

    // Store notification in database
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });

    if (response.ok) {
      const result = await response.json();
      
      // Emit real-time notification
      emitNotificationToUser(recipientId, {
        ...notification,
        id: result.data?.[0]?.id,
        created_at: new Date().toISOString(),
        is_read: false,
      });

      return { success: true, notificationId: result.data?.[0]?.id };
    }

    return { success: false, error: 'Failed to create notification' };
  } catch (error) {
    console.error('Error sending private message notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification for new group message
 * @param {number} senderId - ID of the user sending the message
 * @param {number[]} memberIds - Array of group member IDs (excluding sender)
 * @param {string} senderName - Name of the sender
 * @param {string} groupName - Name of the group
 * @param {string} messageContent - Content of the message (truncated)
 * @param {string} groupId - ID of the group
 */
export async function sendGroupMessageNotification(senderId, memberIds, senderName, groupName, messageContent, groupId) {
  try {
    // Truncate message content for notification
    const truncatedMessage = messageContent.length > 50 
      ? messageContent.substring(0, 50) + '...' 
      : messageContent;

    const notification = {
      sender_id: senderId,
      type: 'message',
      title: `New message in ${groupName}`,
      message: `${senderName}: ${truncatedMessage}`,
      link: `/chat?group=${groupId}`,
    };

    // Create notifications for all members
    const notificationPromises = memberIds.map(async (memberId) => {
      const memberNotification = {
        ...notification,
        recipient_id: memberId,
      };

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberNotification),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          memberId,
          notificationId: result.data?.[0]?.id,
          notification: {
            ...memberNotification,
            id: result.data?.[0]?.id,
            created_at: new Date().toISOString(),
            is_read: false,
          },
        };
      }

      return { success: false, memberId, error: 'Failed to create notification' };
    });

    const results = await Promise.all(notificationPromises);
    
    // Emit real-time notifications for successful ones
    const successfulNotifications = results.filter(r => r.success);
    if (successfulNotifications.length > 0) {
      successfulNotifications.forEach(({ notification }) => {
        emitNotificationToUser(notification.recipient_id, notification);
      });
    }

    return { 
      success: true, 
      results,
      successfulCount: successfulNotifications.length,
      totalCount: memberIds.length 
    };
  } catch (error) {
    console.error('Error sending group message notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send group invitation notification with accept/reject options
 * @param {number} senderId - ID of the user creating the group
 * @param {number[]} memberIds - Array of member IDs to invite
 * @param {string} senderName - Name of the sender
 * @param {string} groupName - Name of the group
 * @param {string} groupId - ID of the group
 * @param {string} groupDescription - Description of the group
 */
export async function sendGroupInvitationNotification(senderId, memberIds, senderName, groupName, groupId, groupDescription = '') {
  try {
    const notification = {
      sender_id: senderId,
      type: 'group_invitation',
      title: 'Group Invitation',
      message: `${senderName} invited you to join the group "${groupName}"${groupDescription ? ': ' + groupDescription : ''}`,
      link: `/chat?group=${groupId}`,
      // Add metadata for invitation handling
      metadata: JSON.stringify({
        type: 'group_invitation',
        groupId,
        groupName,
        senderId,
        senderName,
      }),
    };

    // Create notifications for all members
    const notificationPromises = memberIds.map(async (memberId) => {
      const memberNotification = {
        ...notification,
        recipient_id: memberId,
      };

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberNotification),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          memberId,
          notificationId: result.data?.[0]?.id,
          notification: {
            ...memberNotification,
            id: result.data?.[0]?.id,
            created_at: new Date().toISOString(),
            is_read: false,
          },
        };
      }

      return { success: false, memberId, error: 'Failed to create notification' };
    });

    const results = await Promise.all(notificationPromises);
    
    // Emit real-time notifications for successful ones
    const successfulNotifications = results.filter(r => r.success);
    if (successfulNotifications.length > 0) {
      successfulNotifications.forEach(({ notification }) => {
        emitNotificationToUser(notification.recipient_id, notification);
      });
    }

    return { 
      success: true, 
      results,
      successfulCount: successfulNotifications.length,
      totalCount: memberIds.length 
    };
  } catch (error) {
    console.error('Error sending group invitation notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle group invitation response (accept/reject)
 * @param {number} notificationId - ID of the notification
 * @param {number} userId - ID of the user responding
 * @param {number} groupId - ID of the group
 * @param {string} action - 'accept' or 'reject'
 * @param {number} inviterId - ID of the user who sent the invitation
 */
export async function handleGroupInvitationResponse(notificationId, userId, groupId, action, inviterId) {
  try {
    if (action === 'accept') {
      // Add user to group members
      const groupResponse = await fetch(`/api/group-conversation/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'add',
        }),
      });

      if (!groupResponse.ok) {
        throw new Error('Failed to add user to group');
      }

      // Send confirmation notification to inviter
      const userResponse = await fetch('/api/users');
      const userData = await userResponse.json();
      const user = userData.users?.find(u => u.id === userId);
      const userName = user ? (user.first_name || user.username) : 'Someone';

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: inviterId,
          sender_id: userId,
          type: 'group_update',
          title: 'Invitation Accepted',
          message: `${userName} accepted your invitation to join the group`,
          link: `/chat?group=${groupId}`,
        }),
      });
    }

    // Mark the original notification as read/processed
    await fetch(`/api/notifications/${notificationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_read: true,
        userId,
        metadata: JSON.stringify({
          type: 'group_invitation',
          groupId,
          response: action,
          respondedAt: new Date().toISOString(),
        }),
      }),
    });

    return { success: true, action };
  } catch (error) {
    console.error('Error handling group invitation response:', error);
    return { success: false, error: error.message };
  }
}
