import { Server } from "socket.io";
import pool from "../../connection/databaseConnection";

const SOCKET_PATH = "/api/socketio";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: SOCKET_PATH,
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      // Join a personal room so we can notify this user about new conversations
      socket.on("join_user", ({ userId }) => {
        if (!userId) return;
        socket.join(`user_${userId}`);
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
            if (!conversationId || !senderId || (!content && !mediaUrl)) {
              const error = "conversationId, senderId and content or mediaUrl are required";
              callback?.({ success: false, error });
              return;
            }

            const inserted = await pool.query(
              `INSERT INTO private_message (conversation_id, sender_id, content, media_url)
               VALUES ($1, $2, $3, $4)
               RETURNING id, conversation_id, sender_id, content, media_url, created_at`,
              [conversationId, senderId, content || null, mediaUrl || null]
            );

            const message = inserted.rows[0];

            // Broadcast to everyone in this conversation (including sender for confirmation)
            io.to(`conversation_${conversationId}`).emit("private_message", message);

            callback?.({ success: true, message });
          } catch (err) {
            console.error("Error sending private message via socket.io:", err);
            callback?.({
              success: false,
              error: "Failed to send private message",
            });
          }
        }
      );
    });
  }

  res.end();
}


