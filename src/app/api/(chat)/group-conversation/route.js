import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getIOInstance } from "../../../../services/notifications/notificationSocket";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "groups");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

/**
 * POST /api/group-conversation
 * Create a new group conversation
 * Body: FormData with name, description, members (JSON array), created_by, image (file)
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get("name");
    const description = formData.get("description") || "";
    const members = formData.get("members"); // JSON string array of user IDs
    const created_by = formData.get("created_by");
    const imageFile = formData.get("image");
console.log("Recieved form data ",formData);
    // Validation
    if (!name || !created_by || !members) {
      return NextResponse.json(
        { success: false, message: "name, created_by, and members are required" },
        { status: 400 }
      );
    }

    let membersArray;
    try {
      membersArray = JSON.parse(members);
      if (!Array.isArray(membersArray) || membersArray.length === 0) {
        return NextResponse.json(
          { success: false, message: "members must be a non-empty array" },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "members must be a valid JSON array" },
        { status: 400 }
      );
    }

    // Ensure creator is included in members
    if (!membersArray.includes(String(created_by))) {
      membersArray.push(String(created_by));
    }

    // Handle image upload
    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      await ensureUploadDir();
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `group-${timestamp}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/groups/${filename}`;
    }

    // Insert group conversation
    const result = await pool.query(
      `INSERT INTO group_conversation (name, description, members, created_by, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, members, created_by, image, created_at`,
      [
        name,
        description,
        membersArray, // Store as JSON string
        created_by,
        imageUrl,
      ]
    );

    const group = result.rows[0];

    // Get creator info for notification
    const creatorResult = await pool.query(
      `SELECT first_name, rwandan_name, username 
       FROM api_user 
       WHERE id = $1`,
      [created_by]
    );
    const creator = creatorResult.rows[0];
    const creatorName = creator 
      ? (creator.rwandan_name 
          ? `${creator.first_name || ''} ${creator.rwandan_name}`.trim()
          : creator.first_name || creator.username)
      : "Someone";

    // Send invitation notifications to all members except the creator
    const memberIdsForNotification = membersArray.filter(
      (memberId) => String(memberId) !== String(created_by)
    );

    if (memberIdsForNotification.length > 0) {
      const io = getIOInstance();
      
      // Create invitation notifications for each member and emit Socket.IO events
      const notificationPromises = memberIdsForNotification.map(async (memberId) => {
        const result = await pool.query(  
          `INSERT INTO notifications (recipient_id, sender_id, type, title, message, link, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, recipient_id, sender_id, type, title, message, link, is_read, created_at`,
          [
            memberId,
            created_by,
            "group_invitation",
            "Group Invitation",
            `${creatorName} invited you to join the group "${name}"${description ? ': ' + description : ''}`,
            `/chat?group=${group.id}`, // Link to the group chat
            JSON.stringify({
              type: 'group_invitation',
              groupId: group.id,
              groupName: name,
              senderId: created_by,
              senderName: creatorName,
            }),
          ]
        );
        
        const notification = result.rows[0];
        
        // Emit Socket.IO notification if instance is available
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

      // Execute all notifications in parallel
      await Promise.all(notificationPromises);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...group,
          members: membersArray, // Return as array for convenience
        },
        message: "Group created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating group conversation:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error creating group conversation",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/group-conversation?userId=123
 * Get all groups for a user (groups where user is a member)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Get all groups where user is a member
    const result = await pool.query(
        `SELECT 
            gc.id, 
            gc.name, 
            gc.description, 
            gc.members, 
            gc.created_by, 
            gc.image, 
            gc.created_at,
            -- Get last message content
            (
              SELECT gm.content 
              FROM group_message gm 
              WHERE gm.group_id = gc.id 
              ORDER BY gm.created_at DESC 
              LIMIT 1
            ) AS last_message,
            -- Get last message media URL (for media messages)
            (
              SELECT gm.media_url 
              FROM group_message gm 
              WHERE gm.group_id = gc.id 
              ORDER BY gm.created_at DESC 
              LIMIT 1
            ) AS last_message_media,
            -- Get last message timestamp
            (
              SELECT gm.created_at 
              FROM group_message gm 
              WHERE gm.group_id = gc.id 
              ORDER BY gm.created_at DESC 
              LIMIT 1
            ) AS last_message_time,
            -- Unread count: messages from others sent after user's last_read_at
            (
              SELECT COUNT(*)
              FROM group_message gm
              WHERE gm.group_id = gc.id 
                AND gm.sender_id::text != $1::text
                AND gm.created_at > COALESCE(
                  (SELECT crs.last_read_at FROM chat_read_status crs 
                   WHERE crs.user_id = $1::text AND crs.conversation_id = gc.id::text 
                     AND crs.conversation_type = 'group' LIMIT 1),
                  '1970-01-01'::timestamptz
                )
            ) AS unread
         FROM group_conversation gc
         WHERE $1::bigint = ANY(gc.members) -- Check if userId exists in the native array
         ORDER BY 
           -- Sort by last message time if exists, else by group creation
           COALESCE(
             (SELECT gm.created_at FROM group_message gm WHERE gm.group_id = gc.id ORDER BY gm.created_at DESC LIMIT 1),
             gc.created_at
           ) DESC`,
        [userId] 
      );
    const groups = result.rows;

    return NextResponse.json(
      {
        success: true,
        data: groups,
        message: "Groups fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching group conversations:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching group conversations",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
