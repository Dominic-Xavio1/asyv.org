import { NextResponse } from "next/server";
import pool from '../../../../connection/databaseConnection';

export async function POST(request) {
  try {
    const data = await request.json();
    const { content, postId, userId } = data;
    
    if (!content || content.trim() === "" || !postId || !userId) {
      return NextResponse.json(
        { success: false, error: "Content, postId, and userId are required" },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      `INSERT INTO api_comment (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [postId, userId, content.trim()]
    );
    const insertedId = result.rows[0].id;

    // Return the inserted comment with user/profile info (same shape as GET)
    const sel = await pool.query(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        u.username,
        u.email,
        u.first_name,
        COALESCE(
          up.profile_image,
          'https://api.dicebear.com/9.x/personas/svg?seed=' || COALESCE(u.username, u.email)
        ) AS profile_image,
        COALESCE(
          up.full_name,
          u.first_name || ' ' || ''
        ) AS full_name
       FROM api_comment c
       JOIN api_user u ON c.user_id = u.id
       LEFT JOIN user_profile up ON up.created_by = u.id
       WHERE c.id = $1
       LIMIT 1`,
      [insertedId]
    );

    return NextResponse.json({
      success: true,
      comment: sel.rows[0]
    }, { status: 201 });
  } catch(err) {
    console.log("Error posting comment:", err.message);
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: "postId is required" },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        u.username,
        u.email,
        u.first_name,
        COALESCE(
          up.profile_image,
          'https://api.dicebear.com/9.x/personas/svg?seed=' || COALESCE(u.username, u.email)
        ) AS profile_image,
        COALESCE(
          up.full_name,
          u.first_name || ' ' || ''
        ) AS full_name
       FROM api_comment c
       JOIN api_user u ON c.user_id = u.id
       LEFT JOIN user_profile up ON up.created_by = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    
    return NextResponse.json({
      success: true,
      comments: result.rows
    });
  } catch(err) {
    console.log("Error fetching comments:", err.message);
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    
    if (!commentId) {
      return NextResponse.json(
        { success: false, error: "Comment id is required" },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      `DELETE FROM api_comment WHERE id = $1 RETURNING id`,
      [commentId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch(err) {
    console.log("Error deleting comment:", err.message);
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
