import { Server } from "socket.io";
import pool from "../../connection/databaseConnection";
import { setupOnlineUsersHandlers } from "../../services/online-users/onlineUsersSocket";
import { handleUserOnline } from "../../services/online-users/onlineUsersSocket";
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

    res.socket.server.io = io;

    io.on("connection", async (socket) => {
      // Setup online users tracking handlers
      setupOnlineUsersHandlers(socket, io);

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
    });
  }

  res.end();
}


