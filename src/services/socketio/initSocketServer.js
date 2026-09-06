import { Server } from "socket.io";
import pool from "../../connection/databaseConnection";
import { setupOnlineUsersHandlers } from "../online-users/onlineUsersSocket";
import { handleUserOnline } from "../online-users/onlineUsersSocket";
import { setupGroupMessagesHandlers } from "../group-messages/groupMessagesSocket";
import { setupCallSignalingHandlers } from "../videocall/callSignalingSocket";
import { setIOInstance } from "../notifications/notificationSocket";
import redisClient from "../redis/redisClient";

export const SOCKET_PATH = "/api/socketio";

export async function initSocketIO(httpServer) {
  if (httpServer.io) {
    return httpServer.io;
  }

  try {
    await redisClient.connect();
    console.log("Redis connected for online users tracking");
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }

  const io = new Server(httpServer, {
    path: SOCKET_PATH,
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  console.log("Socket.IO server initialized on path", SOCKET_PATH);

  httpServer.io = io;
  setIOInstance(io);

  io.on("connection", (socket) => {
    setupOnlineUsersHandlers(socket, io);
    setupGroupMessagesHandlers(socket, io);
    setupCallSignalingHandlers(socket, io);

    socket.on("join_notifications", ({ userId }) => {
      if (!userId) return;
      socket.join(`notifications_${userId}`);
      console.log(`User ${userId} joined notifications room`);
    });

    socket.on("private_typing_started", async ({ conversationId, userId, isTyping }) => {
      if (!conversationId || !userId) return;

      socket.join(`conversation_${conversationId}`);

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
          ? `${user.first_name || ""} ${user.rwandan_name}`.trim()
          : user.first_name || user.username || `User ${userId}`;

        socket.to(`conversation_${conversationId}`).emit("typing_private", {
          conversationId,
          userId,
          userName,
          isTyping,
        });
      } catch (error) {
        console.error("Error fetching user name for typing indicator:", error);
        socket.to(`conversation_${conversationId}`).emit("typing_private", {
          conversationId,
          userId,
          userName: `User ${userId}`,
          isTyping,
        });
      }
    });

    socket.on("group_typing_started", async ({ groupId, userId, isTyping }) => {
      if (!groupId || !userId) return;

      socket.join(`group_${groupId}`);

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
          ? `${user.first_name || ""} ${user.rwandan_name}`.trim()
          : user.first_name || user.username || `User ${userId}`;

        socket.to(`group_${groupId}`).emit("typing_group", {
          groupId,
          userId,
          userName,
          isTyping,
        });
      } catch (error) {
        console.error("Error fetching user name for typing indicator:", error);
        socket.to(`group_${groupId}`).emit("typing_group", {
          groupId,
          userId,
          userName: `User ${userId}`,
          isTyping,
        });
      }
    });

    socket.on("private_typing_stopped", ({ conversationId, userId, isTyping }) => {
      if (!conversationId || !userId) return;
      socket.to(`conversation_${conversationId}`).emit("user_stopped", {
        conversationId,
        userId,
        isTyping,
      });
    });

    socket.on("group_typing_stopped", ({ groupId, userId, isTyping }) => {
      if (!groupId || !userId) return;
      socket.to(`group_${groupId}`).emit("group_stopped", {
        groupId,
        userId,
        isTyping,
      });
    });

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

        const unreadCount = await pool.query(
          `SELECT COUNT(*) as count
           FROM notifications
           WHERE recipient_id = $1 AND is_read = FALSE AND is_deleted = FALSE`,
          [userId]
        );

        io.to(`notifications_${userId}`).emit("notification_count_updated", {
          unreadCount: parseInt(unreadCount.rows[0]?.count || 0, 10),
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("Error marking notification as read:", err);
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on("join_user", async ({ userId }) => {
      if (!userId) return;

      socket.join(`user_${userId}`);

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
              ? `${userData.first_name || ""} ${userData.rwandan_name}`.trim()
              : userData.first_name || userData.username,
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar || "/default.png",
          });
        } else {
          await handleUserOnline(socket, userId);
        }
      } catch (error) {
        console.error("Error fetching user data for online status:", error);
        await handleUserOnline(socket, userId);
      }
    });

    socket.on("join_conversation", ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`conversation_${conversationId}`);
    });

    socket.on("create_private_conversation", async ({ user1Id, user2Id }, callback) => {
      try {
        if (!user1Id || !user2Id) {
          callback?.({ success: false, error: "user1Id and user2Id are required" });
          return;
        }

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

    socket.on(
      "send_private_message",
      async ({ conversationId, senderId, content, mediaUrl }, callback) => {
        try {
          const convId = String(conversationId);
          const sendId = String(senderId);

          if (!convId || !sendId || (!content && !mediaUrl)) {
            const error = "conversationId, senderId and content or mediaUrl are required";
            console.error("Validation error:", error, {
              conversationId: convId,
              senderId: sendId,
              hasContent: !!content,
              hasMedia: !!mediaUrl,
            });
            callback?.({ success: false, error });
            return;
          }

          const convCheck = await pool.query(
            `SELECT id, user1_id, user2_id
             FROM private_conversation
             WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
            [convId, sendId]
          );

          if (convCheck.rows.length === 0) {
            const error = "Conversation not found or you are not a participant";
            console.error("Authorization error:", error, {
              conversationId: convId,
              senderId: sendId,
            });
            callback?.({ success: false, error });
            return;
          }

          const inserted = await pool.query(
            `INSERT INTO private_message (conversation_id, sender_id, content, media_url)
             VALUES ($1, $2, $3, $4)
             RETURNING id, conversation_id, sender_id, content, media_url, created_at`,
            [convId, sendId, content || null, mediaUrl || null]
          );

          const message = inserted.rows[0];

          socket.join(`conversation_${convId}`);
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

    socket.on("delete_private_message", async ({ conversationId, messageId }, callback) => {
      try {
        const convId = String(conversationId);
        const msgId = String(messageId);

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

        await pool.query(`DELETE FROM private_message WHERE id = $1`, [msgId]);

        io.to(`conversation_${convId}`).emit("message_deleted", {
          messageId: msgId,
          conversationId: convId,
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("Error deleting private message:", err);
        callback?.({
          success: false,
          error: err.message || "Failed to delete message",
        });
      }
    });

    socket.on("delete_group_message", async ({ groupId, messageId }, callback) => {
      try {
        const grpId = String(groupId);
        const msgId = String(messageId);

        const msgCheck = await pool.query(
          `SELECT id, group_id FROM group_message WHERE id = $1 AND group_id = $2`,
          [msgId, grpId]
        );

        if (msgCheck.rows.length === 0) {
          callback?.({ success: false, error: "Message not found" });
          return;
        }

        await pool.query(`DELETE FROM group_message WHERE id = $1`, [msgId]);

        io.to(`group_${grpId}`).emit("group_message_deleted", {
          messageId: msgId,
          groupId: grpId,
        });

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

  return io;
}
