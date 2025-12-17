import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const data = await request.json();
    const { user1, user2 } = data;

    if (!user1 || !user2) {
      return NextResponse.json(
        { success: false, message: "user1 and user2 are required" },
        { status: 400 }
      );
    }

    // Check if a conversation already exists for this pair (order-independent)
    const existing = await pool.query(
      `SELECT id, user1_id, user2_id, created_at
       FROM private_conversation
       WHERE (user1_id = $1 AND user2_id = $2)
          OR (user1_id = $2 AND user2_id = $1)
       LIMIT 1`,
      [user1, user2]
    );

    if (existing.rows.length > 0) {
      const conversation = existing.rows[0];
      return NextResponse.json(
        {
          success: true,
          message: "Private chat already exists",
          data: conversation,
        },
        { status: 200 }
      );
    }

    const response = await pool.query(
      "INSERT INTO private_conversation (user1_id, user2_id) VALUES ($1, $2) RETURNING id, user1_id, user2_id, created_at",
      [user1, user2]
    );
    const conversation = response.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: "Private chat created successfully",
        data: conversation,
      },
      { status: 201 }
    );
  } catch (err) {
    console.log("Error in private chat", err.message);
    return NextResponse.json(
      {
        success: false,
        message: "Error in private chat",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

// Fetch private conversations for a user: /api/(chat)/privatechat?userId=123
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

    const response = await pool.query(
      `SELECT id, user1_id, user2_id, created_at
       FROM private_conversation
       WHERE user1_id = $1 OR user2_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json(
      {
        success: true,
        data: response.rows,
        message: "Private chats fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.log("Error fetching private chats", err.message);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching private chats",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
