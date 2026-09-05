import { Server } from "socket.io";
import pool from "../../connection/databaseConnection";
import { setupOnlineUsersHandlers } from "../../services/online-users/onlineUsersSocket";
import { handleUserOnline } from "../../services/online-users/onlineUsersSocket";
import { setupGroupMessagesHandlers } from "../../services/group-messages/groupMessagesSocket";
import { setupCallSignalingHandlers } from "../../services/videocall/callSignalingSocket";
import { setIOInstance } from "../../services/notifications/notificationSocket";
import redisClient from "../../services/redis/redisClient";

const SOCKET_PATH = "/api/socketio";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (!res.socket.server.io) {
    // Initialize Redis connection
    try {
      await redisClient.connect();
      console.log("Redis connected for online users tracking");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      // Continue even if Redis fails (for development)
    }

    const io = new Server(res.socket.server, {
      path: SOCKET_PATH,
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    console.log("Socket.IO server initialized on path", SOCKET_PATH);

    res.socket.server.io = io;
    
    // Set IO instance for notification service
    setIOInstance(io);

    io.on("connection", async (socket) => {
      // Setup online users tracking handlers
      setupOnlineUsersHandlers(socket, io);

      // Setup group messages handlers
      setupGroupMessagesHandlers(socket, io);

      setupCallSignalingHandlers(socket, io);

      // Setup notification handlers
      socket.on("join_notifications", ({ userId }) => {
        if (!userId) return;
        socket.join(`notifications_${userId}`);
        console.log(`User ${userId} joined notifications room`);
      });
      // Listening for typing in private chats
      socket.on("private_typing_started", async ({conversationId, userId, isTyping}) => {
        if(!conversationId || !userId) return;
        
        // Ensure user is in the conversation room
        socket.join(`conversation_${conversationId}`);
        
        // Fetch user name for typing indicator
        try {
          const userQuery = await pool.query(
            `SELECT u.first_name, u.rwandan_name, u.username
             FROM api_user u
             WHERE u.id = $1
             LIMIT 1`,
            [userId]
          );
          
          const user = userQuery.rows[0] || {};
          const userName = user.rwandan_name 
            ? `${user.first_name || ''} ${user.rwandan_name}`.trim()
            : user.first_name || user.username || `User ${userId}`;
          
          // Broadcast to other users in the conversation
          socket.to(`conversation_${conversationId}`).emit("typing_private", {
            conversationId,
            userId,
            userName,
            isTyping
          });
        } catch (error) {
          console.error("Error fetching user name for typing indicator:", error);
          // Still emit even if name fetch fails
          socket.to(`conversation_${conversationId}`).emit("typing_private", {
            conversationId,
            userId,
            userName: `User ${userId}`,
            isTyping
          });
        }
      });
      
      // Listening for typing in group chats
      socket.on("group_typing_started", async ({groupId, userId, isTyping}) => {
        if(!groupId || !userId) return;
        
        // Ensure user is in the group room
        socket.join(`group_${groupId}`);
        
        // Fetch user name for typing indicator
        try {
          const userQuery = await pool.query(
            `SELECT u.first_name, u.rwandan_name, u.username
             FROM api_user u
             WHERE u.id = $1
             LIMIT 1`,
            [userId]
          );
          
          const user = userQuery.rows[0] || {};
          const userName = user.rwandan_name 
            ? `${user.first_name || ''} ${user.rwandan_name}`.trim()
            : user.first_name || user.username || `User ${userId}`;
          
          // Broadcast to other users in the group
          socket.to(`group_${groupId}`).emit("typing_group", {
            groupId,
            userId,
            userName,
            isTyping
          });
        } catch (error) {
          console.error("Error fetching user name for typing indicator:", error);
          // Still emit even if name fetch fails
          socket.to(`group_${groupId}`).emit("typing_group", {
            groupId,
            userId,
            userName: `User ${userId}`,
            isTyping
          });
        }
      });
      
      // Listen for private typing stopped
      socket.on("private_typing_stopped", ({conversationId, userId, isTyping}) => {
        if(!conversationId || !userId) return;
        socket.to(`conversation_${conversationId}`).emit("user_stopped", { 
          conversationId,
          userId,
          isTyping
        });
      });
      
      // Listen for group typing stopped
      socket.on("group_typing_stopped", ({groupId, userId, isTyping}) => {
        if(!groupId || !userId) return;
        socket.to(`group_${groupId}`).emit("group_stopped", { 
          groupId,
          userId,
          isTyping
        });
      });

      // Emit new notification to recipient
      socket.on("mark_notification_read", async ({ notificationId, userId }, callback) => {
        try {
          if (!notificationId || !userId) {
            callback?.({ success: false, error: "notificationId and userId are required" });
            return;
          }

          const result = await pool.query(
            `UPDATE notifications 
             SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND recipient_id = $2
             RETURNING id, is_read`,
            [notificationId, userId]
          );

          if (result.rows.length === 0) {
            callback?.({ success: false, error: "Notification not found" });
            return;
          }

          // Emit updated notification count to user
          const unreadCount = await pool.query(
            `SELECT COUNT(*) as count 
             FROM notifications 
             WHERE recipient_id = $1 AND is_read = FALSE AND is_deleted = FALSE`,
            [userId]
          );

          io.to(`notifications_${userId}`).emit("notification_count_updated", {
            unreadCount: parseInt(unreadCount.rows[0]?.count || 0),
          });

          callback?.({ success: true });
        } catch (err) {
          console.error("Error marking notification as read:", err);
          callback?.({ success: false, error: err.message });
        }
      });

      // Join a personal room so we can notify this user about new conversations
      socket.on("join_user", async ({ userId }) => {
        if (!userId) return;
        
        socket.join(`user_${userId}`);
        
        // Fetch user profile data and set as online
        try {
          const userQuery = await pool.query(
            `SELECT 
              u.id,
              u.first_name,
              u.rwandan_name,
              u.username,
              u.email,
              COALESCE(up.profile_image, '/default.png') as avatar
            FROM api_user u
            LEFT JOIN user_profile up ON up.created_by = u.id
            WHERE u.id = $1
            LIMIT 1`,
            [userId]
          );

          if (userQuery.rows.length > 0) {
            const userData = userQuery.rows[0];
            await handleUserOnline(socket, userId, {
              id: userData.id,
              name: userData.rwandan_name 
                ? `${userData.first_name || ''} ${userData.rwandan_name}`.trim()
                : userData.first_name || userData.username,
              username: userData.username,
              email: userData.email,
              avatar: userData.avatar || '/default.png',
            });
          } else {
            // Still mark as online even if profile not found
            await handleUserOnline(socket, userId);
          }
        } catch (error) {
          console.error("Error fetching user data for online status:", error);
          // Still mark as online even if database query fails
          await handleUserOnline(socket, userId);
        }
      });

      // Join a specific conversation room to receive new messages in real time
      socket.on("join_conversation", ({ conversationId }) => {
        if (!conversationId) return;
        socket.join(`conversation_${conversationId}`);
      });

      // Create (or reuse) a private conversation between two users
      socket.on("create_private_conversation", async ({ user1Id, user2Id }, callback) => {
        try {
          if (!user1Id || !user2Id) {
            const error = "user1Id and user2Id are required";
            callback?.({ success: false, error });
            return;
          }

          // Check if conversation already exists (regardless of order)
          const existing = await pool.query(
            `SELECT id, user1_id, user2_id, created_at
             FROM private_conversation
             WHERE (user1_id = $1 AND user2_id = $2)
                OR (user1_id = $2 AND user2_id = $1)
             LIMIT 1`,
            [user1Id, user2Id]
          );

          let conversation;

          if (existing.rows.length > 0) {
            conversation = existing.rows[0];
          } else {
            const inserted = await pool.query(
              `INSERT INTO private_conversation (user1_id, user2_id)
               VALUES ($1, $2)
               RETURNING id, user1_id, user2_id, created_at`,
              [user1Id, user2Id]
            );
            conversation = inserted.rows[0];
          }

          // Notify both users so their conversation lists update instantly
          io.to(`user_${user1Id}`).to(`user_${user2Id}`).emit("private_conversation_created", {
            ...conversation,
          });

          callback?.({ success: true, conversation });
        } catch (err) {
          console.error("Error creating private conversation via socket.io:", err);
          callback?.({
            success: false,
            error: "Failed to create private conversation",
          });
        }
      });

      // Send a private message and broadcast it to the conversation room
      socket.on(
        "send_private_message",
        async ({ conversationId, senderId, content, mediaUrl }, callback) => {
          try {
            // Convert to strings for consistent comparison
            const convId = String(conversationId);
            const sendId = String(senderId);

            // Validation
            if (!convId || !sendId || (!content && !mediaUrl)) {
              const error = "conversationId, senderId and content or mediaUrl are required";
              console.error("Validation error:", error, { conversationId: convId, senderId: sendId, hasContent: !!content, hasMedia: !!mediaUrl });
              callback?.({ success: false, error });
              return;
            }

            // Verify conversation exists and user is part of it
            const convCheck = await pool.query(
              `SELECT id, user1_id, user2_id 
               FROM private_conversation 
               WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
              [convId, sendId]
            );

            if (convCheck.rows.length === 0) {
              const error = "Conversation not found or you are not a participant";
              console.error("Authorization error:", error, { conversationId: convId, senderId: sendId });
              callback?.({ success: false, error });
              return;
            }
            // Insert message
            const inserted = await pool.query(
              `INSERT INTO private_message (conversation_id, sender_id, content, media_url)
               VALUES ($1, $2, $3, $4)
               RETURNING id, conversation_id, sender_id, content, media_url, created_at`,
              [convId, sendId, content || null, mediaUrl || null]
            );

            const message = inserted.rows[0];

            // Ensure sender is in the conversation room before broadcasting
            socket.join(`conversation_${convId}`);

            // Broadcast to everyone in this conversation (including sender for confirmation)
            io.to(`conversation_${convId}`).emit("private_message", message);

            callback?.({ success: true, message });
          } catch (err) {
            console.error("Error sending private message via socket.io:", err);
            callback?.({
              success: false,
              error: err.message || "Failed to send private message",
            });
          }
        }
      );

      // Delete private message
      socket.on("delete_private_message", async ({ conversationId, messageId }, callback) => {
        try {
          const convId = String(conversationId);
          const msgId = String(messageId);

          // Verify message exists and belongs to the user
          const msgCheck = await pool.query(
            `SELECT m.id, m.conversation_id, m.sender_id, c.user1_id, c.user2_id
             FROM private_message m
             JOIN private_conversation c ON m.conversation_id = c.id
             WHERE m.id = $1 AND c.id = $2`,
            [msgId, convId]
          );

          if (msgCheck.rows.length === 0) {
            callback?.({ success: false, error: "Message not found" });
            return;
          }

          const message = msgCheck.rows[0];
          
          // Delete the message
          await pool.query(
            `DELETE FROM private_message WHERE id = $1`,
            [msgId]
          );

          // Broadcast deletion to everyone in the conversation
          io.to(`conversation_${convId}`).emit("message_deleted", { messageId: msgId, conversationId: convId });

          callback?.({ success: true });
        } catch (err) {
          console.error("Error deleting private message:", err);
          callback?.({
            success: false,
            error: err.message || "Failed to delete message",
          });
        }
      });

      // Delete group message
      socket.on("delete_group_message", async ({ groupId, messageId }, callback) => {
        try {
          const grpId = String(groupId);
          const msgId = String(messageId);

          // Verify message exists and belongs to the group
          const msgCheck = await pool.query(
            `SELECT id, group_id FROM group_message WHERE id = $1 AND group_id = $2`,
            [msgId, grpId]
          );

          if (msgCheck.rows.length === 0) {
            callback?.({ success: false, error: "Message not found" });
            return;
          }

          // Delete the message
          await pool.query(
            `DELETE FROM group_message WHERE id = $1`,
            [msgId]
          );

          // Broadcast deletion to everyone in the group
          io.to(`group_${grpId}`).emit("group_message_deleted", { messageId: msgId, groupId: grpId });

          callback?.({ success: true });
        } catch (err) {
          console.error("Error deleting group message:", err);
          callback?.({
            success: false,
            error: err.message || "Failed to delete message",
          });
        }
      });
    });
  }

  res.end();
}


