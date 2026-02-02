import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { getIOInstance } from "../../../../services/notifications/notificationSocket";

/**
 * POST /api/notifications/respond
 * Handle notification responses (accept/reject for group invitations)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { notificationId, userId, action, groupId, inviterId } = body;

    if (!notificationId || !userId || !action) {
      return NextResponse.json(
        { success: false, message: "notificationId, userId, and action are required" },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "action must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Get notification details to verify it's a group invitation
    const notificationResult = await pool.query(
      `SELECT id, type, metadata, recipient_id 
       FROM notifications 
       WHERE id = $1 AND recipient_id = $2 AND is_deleted = FALSE`,
      [notificationId, userId]
    );

    if (notificationResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    const notification = notificationResult.rows[0];

    if (notification.type !== 'group_invitation') {
      return NextResponse.json(
        { success: false, message: "This notification is not a group invitation" },
        { status: 400 }
      );
    }

    let metadata = {};
    try {
      metadata = JSON.parse(notification.metadata || '{}');
    } catch (e) {
      metadata = {};
    }

    const notificationGroupId = metadata.groupId;
    if (!notificationGroupId) {
      return NextResponse.json(
        { success: false, message: "Invalid group invitation notification" },
        { status: 400 }
      );
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      if (action === 'accept') {
        // Check if user is already a member
        const memberCheckResult = await pool.query(
          `SELECT members FROM group_conversation WHERE id = $1`,
          [notificationGroupId]
        );

        if (memberCheckResult.rows.length === 0) {
          throw new Error('Group not found');
        }

        const currentMembers = memberCheckResult.rows[0].members || [];
        
        // Convert to array if it's a string
        let membersArray = currentMembers;
        if (typeof currentMembers === 'string') {
          try {
            membersArray = JSON.parse(currentMembers);
          } catch (e) {
            membersArray = [];
          }
        }

        // Check if user is already a member
        if (membersArray.includes(String(userId))) {
          throw new Error('User is already a member of this group');
        }

        // Add user to group members
        membersArray.push(String(userId));
        
        await pool.query(
          `UPDATE group_conversation 
           SET members = $1 
           WHERE id = $2`,
          [JSON.stringify(membersArray), notificationGroupId]
        );

        // Get user info for confirmation notification
        const userResult = await pool.query(
          `SELECT first_name, rwandan_name, username 
           FROM api_user 
           WHERE id = $1`,
          [userId]
        );

        const user = userResult.rows[0];
        const userName = user 
          ? (user.rwandan_name 
              ? `${user.first_name || ''} ${user.rwandan_name}`.trim()
              : user.first_name || user.username)
          : 'Someone';

        // Get group info
        const groupResult = await pool.query(
          `SELECT name FROM group_conversation WHERE id = $1`,
          [notificationGroupId]
        );

        const group = groupResult.rows[0];
        const groupName = group?.name || 'Unknown Group';

        // Send confirmation notification to inviter
        const inviterIdToUse = inviterId || metadata.senderId;
        if (inviterIdToUse) {
          const confirmationNotification = await pool.query(
            `INSERT INTO notifications (recipient_id, sender_id, type, title, message, link)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, recipient_id, sender_id, type, title, message, link, is_read, created_at`,
            [
              inviterIdToUse,
              userId,
              "group_update",
              "Invitation Accepted",
              `${userName} accepted your invitation to join "${groupName}"`,
              `/chat?group=${notificationGroupId}`,
            ]
          );

          // Emit real-time notification
          const io = getIOInstance();
          if (io) {
            const notification = confirmationNotification.rows[0];
            io.to(`notifications_${inviterIdToUse}`).emit("new_notification", notification);
            
            // Update unread count
            const unreadCountResult = await pool.query(
              `SELECT COUNT(*) as count 
               FROM notifications 
               WHERE recipient_id = $1 AND is_read = FALSE AND is_deleted = FALSE`,
              [inviterIdToUse]
            );
            
            io.to(`notifications_${inviterIdToUse}`).emit("notification_count_updated", {
              unreadCount: parseInt(unreadCountResult.rows[0]?.count || 0),
            });
          }
        }
      }

      // Update the original notification with response
      const updatedMetadata = {
        ...metadata,
        response: action,
        respondedAt: new Date().toISOString(),
      };

      await pool.query(
        `UPDATE notifications 
         SET metadata = $1, is_read = TRUE, read_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(updatedMetadata), notificationId]
      );

      await pool.query('COMMIT');

      return NextResponse.json(
        {
          success: true,
          message: `Group invitation ${action}ed successfully`,
          action,
          groupId: notificationGroupId,
        },
        { status: 200 }
      );

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error("Error responding to notification:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Error responding to notification",
      },
      { status: 500 }
    );
  }
}
