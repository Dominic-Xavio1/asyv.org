import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

export async function GET(request) {
  try { 
    const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userid'); 
  console.log("UserId from query string:", userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "id path parameter is required" },
        { status: 400 }
      );
    }

const response = await pool.query(`
  SELECT 
      pc.id,
      pc.user1_id,
      pc.user2_id,
      pc.created_at,
      u.id AS other_user_id,
      u.first_name,
      u.rwandan_name
  FROM private_conversation pc
  JOIN api_user u 
    ON u.id = CASE 
                WHEN pc.user1_id = $1 THEN pc.user2_id
                ELSE pc.user1_id
              END
  WHERE pc.user1_id = $1 OR pc.user2_id = $1
  ORDER BY pc.created_at DESC
`, [userId]);

    const data = response.rows;
    return NextResponse.json(
      {
        success: true,
        data:data,
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
