import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

// Fetch all private conversations for a given user id (path param kept for backwards compatibility)
export async function GET(request, { params }) {
  try {
    const { userid } = params;

    if (!userid) {
      return NextResponse.json(
        { success: false, message: "userid path parameter is required" },
        { status: 400 }
      );
    }

    const response = await pool.query(
      "SELECT id, user1_id, user2_id, created_at FROM private_conversation WHERE user1_id = $1 OR user2_id = $1 ORDER BY created_at DESC",
      [userid]
    );
    const data = response.rows;
    return NextResponse.json(
      {
        success: true,
        data,
        message: "Private chats fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.log("Error in fetching private chats", err.message);
    return NextResponse.json(
      {
        success: false,
        message: "Error in fetching private chats",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

// Send a private message as a specific user into a conversation
// POST /api/(chat)/privatechat/[userid] with JSON: { conversationId, content, media_url }
export async function POST(request, { params }) {
  try {
    const { userid: senderId } = params;
    const data = await request.json();
    const { conversationId, content, media_url } = data;

    if (!senderId || !conversationId || (!content && !media_url)) {
      return NextResponse.json(
        {
          success: false,
          message: "senderId (path), conversationId and content or media_url are required",
        },
        { status: 400 }
      );
    }

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
    console.log("Error in sending message", err.message);
    return NextResponse.json(
      {
        success: false,
        message: "Error in sending message",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
