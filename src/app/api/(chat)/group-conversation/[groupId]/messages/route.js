import pool from "../../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getIOInstance } from "../../../../../services/notifications/notificationSocket";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "group-messages");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

/**
 * GET /api/group-conversation/[groupId]/messages
 * Get all messages for a group conversation
 */
export async function GET(request, { params }) {
  try {
    const { groupId } =await params;

    if (!groupId) {
      return NextResponse.json(
        { success: false, message: "groupId is required" },
        { status: 400 }
      );
    }

    // Fetch messages with sender information
    const result = await pool.query(
      `SELECT 
        gm.id,
        gm.group_id,
        gm.sender_id,
        gm.content,
        gm.media_url,
        gm.media_type,
        gm.created_at,
        u.first_name,
        u.rwandan_name,
        u.username,
        up.profile_image
      FROM group_message gm
      JOIN api_user u ON gm.sender_id = u.id
      LEFT JOIN user_profile up ON up.created_by = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.created_at ASC`,
      [groupId]
    );

    const messages = result.rows.map((msg) => ({
      id: msg.id,
      group_id: msg.group_id,
      sender_id: msg.sender_id,
      content: msg.content,
      media_url: msg.media_url,
      media_type: msg.media_type,
      created_at: msg.created_at,
      sender_name: msg.rwandan_name 
        ? `${msg.first_name || ''} ${msg.rwandan_name}`.trim()
        : msg.first_name || msg.username || `User ${msg.sender_id}`,
      sender_avatar: msg.profile_image || '/default.png',
    }));

    return NextResponse.json(
      {
        success: true,
        data: messages,
        message: "Group messages fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching group messages:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching group messages",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/group-conversation/[groupId]/messages
 * Send a message to a group (HTTP fallback)
 * Body: FormData with senderId, content, media (file), mediaType
 */
export async function POST(request, { params }) {
  try {
    const { groupId } =await params;
    const formData = await request.formData();

    const senderId = formData.get("senderId");
    const content = formData.get("content") || "";
    const mediaFile = formData.get("media");
    const mediaType = formData.get("mediaType") || "";

    // Validation
    if (!groupId || !senderId || (!content.trim() && !mediaFile)) {
      return NextResponse.json(
        {
          success: false,
          message: "groupId, senderId and content or media are required",
        },
        { status: 400 }
      );
    }

    // Verify user is a member of the group
    const groupCheck = await pool.query(
      `SELECT id, members FROM group_conversation WHERE id = $1`,
      [groupId]
    );

    if (groupCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }

    const group = groupCheck.rows[0];
    const members = typeof group.members === 'string' 
      ? JSON.parse(group.members) 
      : group.members;

    if (!Array.isArray(members) || !members.includes(String(senderId))) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Handle media upload
    let mediaUrl = null;
    let detectedMediaType = mediaType || null;

    if (mediaFile && mediaFile.size > 0) {
      await ensureUploadDir();
      const bytes = await mediaFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const ext = mediaFile.name.split('.').pop() || 'bin';
      const filename = `group-msg-${groupId}-${timestamp}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      mediaUrl = `/uploads/group-messages/${filename}`;

      // Detect media type if not provided
      if (!detectedMediaType) {
        const fileType = mediaFile.type;
        if (fileType.startsWith('video/')) {
          detectedMediaType = 'video';
        } else if (fileType.startsWith('audio/')) {
          detectedMediaType = 'audio';
        } else if (fileType.startsWith('image/')) {
          detectedMediaType = 'image';
        } else {
          detectedMediaType = 'document';
        }
      }
    }

    // Insert message
    const result = await pool.query(
      `INSERT INTO group_message (group_id, sender_id, content, media_url, media_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, group_id, sender_id, content, media_url, media_type, created_at`,
      [groupId, senderId, content || null, mediaUrl, detectedMediaType]
    );

    const message = result.rows[0];

    // Get sender info for response and notification
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

    // Get group information for notification
    const groupResult = await pool.query(
      `SELECT name FROM group_conversation WHERE id = $1`,
      [groupId]
    );
    
    const groups = groupResult.rows[0];
    const groupName = groups?.name || 'Unknown Group';

    // Send notifications to all group members except the sender
    const recipientIds = members.filter(memberId => String(memberId) !== String(senderId));
    
    if (recipientIds.length > 0) {
      // Truncate message content for notification
      const messageContent = content || (mediaUrl ? 'Sent a media file' : '');
      const truncatedMessage = messageContent.length > 50 
        ? messageContent.substring(0, 50) + '...' 
        : messageContent;

      // Create notifications for all recipients
      const notificationPromises = recipientIds.map(async (recipientId) => {
        const notificationResult = await pool.query(
          `INSERT INTO notifications (recipient_id, sender_id, type, title, message, link)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, recipient_id, sender_id, type, title, message, link, is_read, created_at`,
          [
            recipientId,
            senderId,
            'message',
            `New message in ${groupName}`,
            `${senderName}: ${truncatedMessage}`,
            `/chat?group=${groupId}`,
          ]
        );
        
        return notificationResult.rows[0];
      });

      const notifications = await Promise.all(notificationPromises);
      
      // Emit real-time notifications
      const io = getIOInstance();
      if (io) {
        notifications.forEach((notification, index) => {
          const recipientId = recipientIds[index];
          io.to(`notifications_${recipientId}`).emit("new_notification", notification);
          
          // Update unread count for each recipient
          pool.query(
            `SELECT COUNT(*) as count 
             FROM notifications 
             WHERE recipient_id = $1 AND is_read = FALSE AND is_deleted = FALSE`,
            [recipientId]
          ).then(countResult => {
            io.to(`notifications_${recipientId}`).emit("notification_count_updated", {
              unreadCount: parseInt(countResult.rows[0]?.count || 0),
            });
          });
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...message,
          sender_name: senderName,
          sender_avatar: sender.profile_image || '/default.png',
        },
        message: "Group message sent successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error sending group message:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error sending group message",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
