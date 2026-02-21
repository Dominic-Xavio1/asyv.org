import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

/**
 * POST /api/chat/mark-read
 * Mark a conversation as read for the current user.
 * Body: { userId, conversationId, conversationType: 'private' | 'group' }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, conversationId, conversationType } = body;

    if (!userId || !conversationId || !conversationType) {
      return NextResponse.json(
        { success: false, message: "userId, conversationId, and conversationType are required" },
        { status: 400 }
      );
    }

    if (!["private", "group"].includes(conversationType)) {
      return NextResponse.json(
        { success: false, message: "conversationType must be 'private' or 'group'" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO chat_read_status (user_id, conversation_id, conversation_type, last_read_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, conversation_id, conversation_type)
       DO UPDATE SET last_read_at = NOW(), updated_at = NOW()`,
      [userId, String(conversationId), conversationType]
    );

    return NextResponse.json(
      { success: true, message: "Conversation marked as read" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error marking conversation as read:", err.message);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark conversation as read",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
