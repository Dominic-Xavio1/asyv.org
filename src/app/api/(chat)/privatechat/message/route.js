import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { getIOInstance } from "../../../../../services/notifications/notificationSocket";

/**
 * POST /api/privatechat/message
 * 
 * Send a private message via HTTP (fallback when socket fails)
 * Body: { conversationId, senderId, content, media_url? }
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { conversationId, senderId, content, media_url } = data;

    // Validation
    if (!conversationId || !senderId || (!content && !media_url)) {
      return NextResponse.json(
        {
          success: false,
          message: "conversationId, senderId and content or media_url are required",
        },
        { status: 400 }
      );
    }

    // Verify conversation exists and user is part of it
    const convCheck = await pool.query(
      `SELECT id, user1_id, user2_id 
       FROM private_conversation 
       WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [conversationId, senderId]
    );

    if (convCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found or you are not a participant",
        },
        { status: 403 }
      );
    }

    // Insert message
    console.log("📝 Inserting private message:", { conversationId, senderId, content, media_url });
    const response = await pool.query(
      `INSERT INTO private_message (conversation_id, sender_id, content, media_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id, sender_id, content, media_url, created_at`,
      [conversationId, senderId, content || null, media_url || null]
    );

    const inserted = response.rows[0];
    console.log("✅ Private message inserted successfully:", inserted);
    
    // Get recipient ID from conversation
    const recipientId = convCheck.rows[0].user1_id === senderId 
      ? convCheck.rows[0].user2_id 
      : convCheck.rows[0].user1_id;
    
    console.log("👤 Message recipient ID:", recipientId);
    
    // Get sender information for notification
    const senderResult = await pool.query(
      `SELECT first_name, rwandan_name, username 
       FROM api_user 
       WHERE id = $1`,
      [senderId]
    );
    
    const sender = senderResult.rows[0];
    const senderName = sender 
      ? (sender.rwandan_name 
          ? `${sender.first_name || ''} ${sender.rwandan_name}`.trim()
          : sender.first_name || sender.username)
      : 'Someone';
    
    console.log("📤 Sender info for notification:", { senderId, senderName });
    
    // Truncate message content for notification
    const messageContent = content || (media_url ? 'Sent a media file' : '');
    const truncatedMessage = messageContent.length > 50 
      ? messageContent.substring(0, 50) + '...' 
      : messageContent;
    
    console.log("✂️ Truncated message for notification:", truncatedMessage);
    
    // Create notification for recipient
    const notificationResult = await pool.query(
      `INSERT INTO notifications (recipient_id, sender_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, recipient_id, sender_id, type, title, message, link, is_read, created_at`,
      [
        recipientId,
        senderId,
        'message',
        'New Message',
        `${senderName}: ${truncatedMessage}`,
        `/chat?private=${conversationId}`,
      ]
    );
    
    const notification = notificationResult.rows[0];
    console.log("🔔 Notification created successfully:", notification);
    
    // Emit real-time notification
    const io = getIOInstance();
    if (io) {
      console.log("📡 Emitting real-time notification to recipient:", recipientId);
      io.to(`notifications_${recipientId}`).emit("new_notification", notification);
      
      // Update unread count
      const unreadCountResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE recipient_id = $1 AND is_read = FALSE AND is_deleted = FALSE`,
        [recipientId]
      );
      
      const unreadCount = parseInt(unreadCountResult.rows[0]?.count || 0);
      console.log("📊 Emitting unread count update:", unreadCount);
      
      io.to(`notifications_${recipientId}`).emit("notification_count_updated", {
        unreadCount: unreadCount,
      });
    } else {
      console.warn("⚠️ Socket.IO instance not available - notification will not be real-time");
    }
    
    return NextResponse.json(
      {
        success: true,
        data: inserted,
        message: "Message sent successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error sending private message:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error sending message",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
