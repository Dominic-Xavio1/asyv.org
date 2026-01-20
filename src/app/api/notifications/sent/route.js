import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

/**
 * GET /api/notifications/sent?userId=123&limit=50
 * Get notifications sent by a CRC user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Check if user is CRC or Superuser
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
        { success: false, message: "Only CRC members can view sent notifications" },
        { status: 403 }
      );
    }

    const query = `
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
        recipient.first_name as recipient_first_name,
        recipient.rwandan_name as recipient_rwandan_name,
        recipient.username as recipient_username,
        recipient.email as recipient_email
      FROM notifications n
      LEFT JOIN api_user recipient ON n.recipient_id = recipient.id
      WHERE n.sender_id = $1 
        AND n.is_deleted = FALSE
      ORDER BY n.created_at DESC 
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
        message: "Sent notifications fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching sent notifications:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching sent notifications",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
