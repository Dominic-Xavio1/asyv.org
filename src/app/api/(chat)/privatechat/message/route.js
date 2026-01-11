import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

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
    const response = await pool.query(
      `INSERT INTO private_message (conversation_id, sender_id, content, media_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id, sender_id, content, media_url, created_at`,
      [conversationId, senderId, content || null, media_url || null]
    );

    const inserted = response.rows[0];
    
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
