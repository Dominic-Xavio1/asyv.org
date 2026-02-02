import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { getIOInstance } from "../../../../services/notifications/notificationSocket";

/**
 * POST /api/group-conversation/[groupId]/members
 * Add or remove members from a group
 * Body: { userId: number, action: 'add' | 'remove' }
 */
export async function POST(request, { params }) {
  try {
    const { groupId } = params;
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, message: "userId and action are required" },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "action must be 'add' or 'remove'" },
        { status: 400 }
      );
    }

    // Check if group exists
    const groupResult = await pool.query(
      `SELECT id, name, members, created_by FROM group_conversation WHERE id = $1`,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }

    const group = groupResult.rows[0];
    let members = group.members || [];

    // Convert to array if it's a string
    if (typeof members === 'string') {
      try {
        members = JSON.parse(members);
      } catch (e) {
        members = [];
      }
    }

    const userIdStr = String(userId);

    if (action === 'add') {
      // Check if user is already a member
      if (members.includes(userIdStr)) {
        return NextResponse.json(
          { success: false, message: "User is already a member of this group" },
          { status: 400 }
        );
      }

      // Add user to members
      members.push(userIdStr);
    } else if (action === 'remove') {
      // Check if user is a member
      if (!members.includes(userIdStr)) {
        return NextResponse.json(
          { success: false, message: "User is not a member of this group" },
          { status: 400 }
        );
      }

      // Remove user from members
      members = members.filter(id => id !== userIdStr);
    }

    // Update group members
    await pool.query(
      `UPDATE group_conversation 
       SET members = $1 
       WHERE id = $2`,
      [JSON.stringify(members), groupId]
    );

    // Get user info for notification
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

    // Send notification to group members about the change
    const notificationTitle = action === 'add' ? 'New Member Added' : 'Member Removed';
    const notificationMessage = action === 'add' 
      ? `${userName} joined the group "${group.name}"`
      : `${userName} left the group "${group.name}"`;

    // Notify all members except the user who performed the action
    const memberIdsToNotify = members.filter(id => id !== userIdStr);
    
    if (memberIdsToNotify.length > 0) {
      const io = getIOInstance();
      
      const notificationPromises = memberIdsToNotify.map(async (memberId) => {
        const notificationResult = await pool.query(
          `INSERT INTO notifications (recipient_id, sender_id, type, title, message, link)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, recipient_id, sender_id, type, title, message, link, is_read, created_at`,
          [
            memberId,
            userId,
            "group_update",
            notificationTitle,
            notificationMessage,
            `/chat?group=${groupId}`,
          ]
        );

        const notification = notificationResult.rows[0];
        
        // Emit real-time notification
        if (io) {
          io.to(`notifications_${memberId}`).emit("new_notification", notification);
          
          // Update unread count
          const unreadCountResult = await pool.query(
            `SELECT COUNT(*) as count 
             FROM notifications 
             WHERE recipient_id = $1 AND is_read = FALSE AND is_deleted = FALSE`,
            [memberId]
          );
          
          io.to(`notifications_${memberId}`).emit("notification_count_updated", {
            unreadCount: parseInt(unreadCountResult.rows[0]?.count || 0),
          });
        }

        return notification;
      });

      await Promise.all(notificationPromises);
    }

    return NextResponse.json(
      {
        success: true,
        message: `User ${action}ed to group successfully`,
        members,
        action,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error managing group members:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error managing group members",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/group-conversation/[groupId]/members
 * Get all members of a group
 */
export async function GET(request, { params }) {
  try {
    const { groupId } = params;

    const groupResult = await pool.query(
      `SELECT id, name, members FROM group_conversation WHERE id = $1`,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }

    const group = groupResult.rows[0];
    let members = group.members || [];

    // Convert to array if it's a string
    if (typeof members === 'string') {
      try {
        members = JSON.parse(members);
      } catch (e) {
        members = [];
      }
    }

    // Get detailed user information for each member
    if (members.length > 0) {
      const membersResult = await pool.query(
        `SELECT id, first_name, rwandan_name, username, email, profile_image 
         FROM api_user 
         WHERE id = ANY($1)`,
        [members]
      );

      return NextResponse.json(
        {
          success: true,
          data: membersResult.rows,
          message: "Group members fetched successfully",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: [],
        message: "No members found in this group",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching group members:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching group members",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
