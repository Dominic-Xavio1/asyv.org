/**
 * Group Messages Socket Handlers
 * 
 * This module contains socket.io event handlers for group messaging functionality.
 * Handles sending messages, typing indicators, and real-time updates.
 */

import pool from '../../connection/databaseConnection';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "group-messages");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

/**
 * Handle sending a group message via socket
 * @param {Socket} socket - Socket.io socket instance
 * @param {Server} io - Socket.io server instance
 * @param {Object} messageData - Message data { groupId, senderId, content, mediaUrl?, mediaType? }
 * @param {Function} callback - Callback function
 */
export async function handleSendGroupMessage(socket, io, messageData, callback) {
  try {
    const { groupId, senderId, content, mediaUrl, mediaType } = messageData;

    // Validation
    if (!groupId || !senderId || (!content && !mediaUrl)) {
      const error = "groupId, senderId and content or mediaUrl are required";
      callback?.({ success: false, error });
      return;
    }

    // Verify user is a member of the group
    const groupCheck = await pool.query(
      `SELECT id, members FROM group_conversation WHERE id = $1`,
      [groupId]
    );

    if (groupCheck.rows.length === 0) {
      callback?.({ success: false, error: "Group not found" });
      return;
    }

    const group = groupCheck.rows[0];
    const members = typeof group.members === 'string' 
      ? JSON.parse(group.members) 
      : group.members;

    if (!Array.isArray(members) || !members.includes(String(senderId))) {
      callback?.({ success: false, error: "You are not a member of this group" });
      return;
    }

    // Insert message
    const result = await pool.query(
      `INSERT INTO group_message (group_id, sender_id, content, media_url, media_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, group_id, sender_id, content, media_url, media_type, created_at`,
      [groupId, senderId, content || null, mediaUrl || null, mediaType || null]
    );

    const message = result.rows[0];

    // Get sender info
    const senderResult = await pool.query(
      `SELECT u.first_name, u.rwandan_name, u.username, up.profile_image
       FROM api_user u
       LEFT JOIN user_profile up ON up.created_by = u.id
       WHERE u.id = $1`,
      [senderId]
    );

    const sender = senderResult.rows[0] || {};
    const senderName = sender.rwandan_name 
      ? `${sender.first_name || ''} ${sender.rwandan_name}`.trim()
      : sender.first_name || sender.username || `User ${senderId}`;

    const messageWithSender = {
      ...message,
      sender_name: senderName,
      sender_avatar: sender.profile_image || '/default.png',
    };

    // Broadcast to all group members
    io.to(`group_${groupId}`).emit("group_message", messageWithSender);

    // Update last message in group_conversation (optional - can be done via trigger or here)
    const lastMessagePreview = content || (mediaUrl ? `[${mediaType || 'Media'}]` : "");
    if (lastMessagePreview) {
      // Note: You may want to add a last_message column to group_conversation table
      // For now, we'll just broadcast the update
      io.to(`group_${groupId}`).emit("group_last_message", {
        groupId,
        lastMessage: lastMessagePreview,
        timestamp: message.created_at,
      });
    }

    callback?.({ success: true, message: messageWithSender });
  } catch (error) {
    console.error("Error sending group message:", error);
    callback?.({ success: false, error: error.message || "Failed to send group message" });
  }
}

/**
 * Handle user joining a group room
 * @param {Socket} socket - Socket.io socket instance
 * @param {string} groupId - Group ID
 */
export async function handleJoinGroup(socket, groupId) {
  try {
    if (!groupId) return;
    
    const room = `group_${groupId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined group room: ${room}`);
  } catch (error) {
    console.error("Error joining group room:", error);
  }
}

/**
 * Handle user leaving a group room
 * @param {Socket} socket - Socket.io socket instance
 * @param {string} groupId - Group ID
 */
export async function handleLeaveGroup(socket, groupId) {
  try {
    if (!groupId) return;
    
    const room = `group_${groupId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left group room: ${room}`);
  } catch (error) {
    console.error("Error leaving group room:", error);
  }
}

/**
 * Handle typing indicator start
 * @param {Socket} socket - Socket.io socket instance
 * @param {Server} io - Socket.io server instance
 * @param {Object} data - { groupId, senderId, senderName }
 */
export async function handleGroupTypingStart(socket, io, data) {
  try {
    const { groupId, senderId, senderName } = data;
    
    if (!groupId || !senderId) return;

    // Broadcast typing indicator to all group members except sender
    socket.to(`group_${groupId}`).emit("group_typing", {
      groupId,
      senderId,
      senderName: senderName || `User ${senderId}`,
      isTyping: true,
    });
  } catch (error) {
    console.error("Error handling typing start:", error);
  }
}

/**
 * Handle typing indicator stop
 * @param {Socket} socket - Socket.io socket instance
 * @param {Server} io - Socket.io server instance
 * @param {Object} data - { groupId, senderId }
 */
export async function handleGroupTypingStop(socket, io, data) {
  try {
    const { groupId, senderId } = data;
    
    if (!groupId || !senderId) return;

    // Broadcast typing stop to all group members except sender
    socket.to(`group_${groupId}`).emit("group_typing_stop", {
      groupId,
      senderId,
    });
  } catch (error) {
    console.error("Error handling typing stop:", error);
  }
}

/**
 * Setup all group message socket handlers
 * @param {Socket} socket - Socket.io socket instance
 * @param {Server} io - Socket.io server instance
 */
export function setupGroupMessagesHandlers(socket, io) {
  // Join group room
  socket.on("join_group", async ({ groupId }) => {
    await handleJoinGroup(socket, groupId);
  });

  // Leave group room
  socket.on("leave_group", async ({ groupId }) => {
    await handleLeaveGroup(socket, groupId);
  });

  // Send group message
  socket.on("send_group_message", async (messageData, callback) => {
    await handleSendGroupMessage(socket, io, messageData, callback);
  });

  // Typing indicator - start
  socket.on("group_typing_start", async (data) => {
    await handleGroupTypingStart(socket, io, data);
  });

  // Typing indicator - stop
  socket.on("group_typing_stop", async (data) => {
    await handleGroupTypingStop(socket, io, data);
  });
}
