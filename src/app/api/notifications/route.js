import pool from "../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { getIOInstance } from "../../../services/notifications/notificationSocket";

/**
 * GET /api/notifications?userId=123&type=all&limit=50
 * Get notifications for a user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "all"; // all, message, system, alert, group_update
    const limit = parseInt(searchParams.get("limit") || "50");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId query parameter is required" },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        n.id,
        n.recipient_id,
        n.sender_id,
        n.type,
        n.title,
        n.message,
        n.link,
        n.is_read,
        n.read_at,
        n.created_at,
        n.is_deleted,
        sender.first_name as sender_first_name,
        sender.rwandan_name as sender_rwandan_name,
        sender.username as sender_username,
        sender.email as sender_email
      FROM notifications n
      LEFT JOIN api_user sender ON n.sender_id = sender.id
      WHERE n.recipient_id = $1 
        AND n.is_deleted = FALSE
    `;

    const queryParams = [userId];
    let paramCount = 1;

    // Filter by type
    if (type !== "all") {
      paramCount++;
      query += ` AND n.type = $${paramCount}`;
      queryParams.push(type);
    }

    // Filter by read status
    if (unreadOnly) {
      paramCount++;
      query += ` AND n.is_read = FALSE`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount + 1}`;
    queryParams.push(limit);

    const result = await pool.query(query, queryParams);

    // Get unread count
    const unreadCountResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE recipient_id = $1 
         AND is_read = FALSE 
         AND is_deleted = FALSE`,
      [userId]
    );

    const unreadCount = parseInt(unreadCountResult.rows[0]?.count || 0);

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
        unreadCount,
        message: "Notifications fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching notifications",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a notification (for superusers to send to users)
 * Body: { recipient_ids: [1,2,3] or "all", sender_id, type, title, message, link }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      recipient_ids, // Array of user IDs or "all" for all users
      sender_id,
      type, // message, system, alert, group_update
      title,
      message,
      link,
    } = body;

    // Validation
    if (!sender_id || !type || !title || !message) {
      return NextResponse.json(
        { success: false, message: "sender_id, type, title, and message are required" },
        { status: 400 }
      );
    }

    // Check if sender is superuser (for system notifications)
    if (type === "system") {
      const senderCheck = await pool.query(
        "SELECT is_superuser FROM api_user WHERE id = $1",
        [sender_id]
      );

      if (senderCheck.rows.length === 0 || !senderCheck.rows[0].is_superuser) {
        return NextResponse.json(
          { success: false, message: "Only superusers can send system notifications" },
          { status: 403 }
        );
      }
    }

    let targetUserIds = [];

    // If recipient_ids is "all", get all user IDs
    if (recipient_ids === "all") {
      const allUsers = await pool.query("SELECT id FROM api_user");
      targetUserIds = allUsers.rows.map((row) => row.id);
    } else if (Array.isArray(recipient_ids)) {
      targetUserIds = recipient_ids;
    } else {
      return NextResponse.json(
        { success: false, message: "recipient_ids must be an array or 'all'" },
        { status: 400 }
      );
    }

    // Don't send notification to sender
    targetUserIds = targetUserIds.filter((id) => String(id) !== String(sender_id));

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No recipients to send notification to" },
        { status: 400 }
      );
    }

    // Insert notifications for all recipients and emit Socket.IO events
    const notifications = [];
    const io = getIOInstance();
    
    for (const recipientId of targetUserIds) {
      const result = await pool.query(
        `INSERT INTO notifications (recipient_id, sender_id, type, title, message, link)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, recipient_id, sender_id, type, title, message, link, is_read, created_at`,
        [recipientId, sender_id, type, title, message, link || null]
      );
      
      const notification = result.rows[0];
      notifications.push(notification);
      
      // Emit Socket.IO notification if instance is available
      if (io) {
        io.to(`notifications_${recipientId}`).emit("new_notification", notification);
        
        // Update unread count
        const unreadCountResult = await pool.query(
          `SELECT COUNT(*) as count 
           FROM notifications 
           WHERE recipient_id = $1 AND is_read = FALSE AND is_deleted = FALSE`,
          [recipientId]
        );
        
        io.to(`notifications_${recipientId}`).emit("notification_count_updated", {
          unreadCount: parseInt(unreadCountResult.rows[0]?.count || 0),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: notifications,
        message: `Notification sent to ${notifications.length} user(s)`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating notifications:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error creating notifications",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications?userId=123&all=true&sent=true
 * Bulk-delete (soft delete) notifications for a user. If `sent=true` deletes
 * notifications where the user is the sender, otherwise deletes received notifications.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const all = searchParams.get("all") === "true";
    const sent = searchParams.get("sent") === "true";

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId query parameter is required" },
        { status: 400 }
      );
    }

    if (!all) {
      return NextResponse.json(
        { success: false, message: "Use ?all=true to perform bulk delete" },
        { status: 400 }
      );
    }

    if (sent) {
      // Verify user is CRC or superuser (consistent with sent listing permission)
      const userCheck = await pool.query(
        `SELECT is_crc, is_superuser FROM api_user WHERE id = $1`,
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      const user = userCheck.rows[0];
      if (!user.is_crc && !user.is_superuser) {
        return NextResponse.json(
          { success: false, message: "Only CRC members can bulk-delete sent notifications" },
          { status: 403 }
        );
      }

      const result = await pool.query(
        `UPDATE notifications SET is_deleted = TRUE WHERE sender_id = $1 AND is_deleted = FALSE RETURNING id`,
        [userId]
      );

      return NextResponse.json(
        {
          success: true,
          message: `Deleted ${result.rowCount} sent notification(s)`,
          deletedCount: result.rowCount,
        },
        { status: 200 }
      );
    }

    // Delete received notifications for the user
    const result = await pool.query(
      `UPDATE notifications SET is_deleted = TRUE WHERE recipient_id = $1 AND is_deleted = FALSE RETURNING id`,
      [userId]
    );

    return NextResponse.json(
      {
        success: true,
        message: `Deleted ${result.rowCount} notification(s)`,
        deletedCount: result.rowCount,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error bulk-deleting notifications:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error deleting notifications",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
