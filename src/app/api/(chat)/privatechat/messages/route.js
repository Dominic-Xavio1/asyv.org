import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

// Get all messages for a private conversation
export async function GET(request) {
  try {
    const {searchParams} = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: "conversationId path parameter is required",
         },
        { status: 400 }
      );
    }

    const response = await pool.query(
      `SELECT id, conversation_id, sender_id, content, media_url, created_at
       FROM private_message
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    return NextResponse.json(
      {
        success: true,
        data: response.rows,
        message: "Messages fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.log("Error fetching private messages", err.message);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching private messages",
        error: err.message,
      },
      { status: 500 }
    );
  }
}


