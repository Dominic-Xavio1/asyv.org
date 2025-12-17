import { NextResponse } from "next/server";
import pool from '../../../../connection/databaseConnection';

export async function POST(request) {
  try {
    const data = await request.json();
    const { postId, userId } = data;
    
    if (!postId || !userId) {
      return NextResponse.json(
        { success: false, error: "postId and userId are required" },
        { status: 400 }
      );
    }
    
    // Check if user already liked this post
    const likeCheck = await pool.query(
      'SELECT id FROM api_like WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    
    let action;
    if (likeCheck.rows.length > 0) {
      // Unlike - remove the like
      await pool.query(
        'DELETE FROM api_like WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      action = 'removed';
    } else {
      // Like - add the like
      await pool.query(
        'INSERT INTO api_like (post_id, user_id) VALUES ($1, $2)',
        [postId, userId]
      );
      action = 'added';
    }
    
    // Get updated like count
    const likeCountRes = await pool.query(
      'SELECT COUNT(*) as count FROM api_like WHERE post_id = $1',
      [postId]
    );
    const likeCount = parseInt(likeCountRes.rows[0].count);
    
    return NextResponse.json({
      success: true,
      action,
      likeCount,
      isLiked: action === 'added'
    });
  } catch(err) {
    console.log("Error from like endpoint:", err.message);
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
    const userId = searchParams.get('userId');
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: "postId is required" },
        { status: 400 }
      );
    }
    
    // Get like count
    const likeCountRes = await pool.query(
      'SELECT COUNT(*) as count FROM api_like WHERE post_id = $1',
      [postId]
    );
    const likeCount = parseInt(likeCountRes.rows[0].count);
    
    // Check if user has liked this post (if userId provided)
    let isLiked = false;
    if (userId) {
      const userLikeRes = await pool.query(
        'SELECT id FROM api_like WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      isLiked = userLikeRes.rows.length > 0;
    }
    
    return NextResponse.json({
      success: true,
      likeCount,
      isLiked
    });
  } catch(err) {
    console.log("Error fetching likes:", err.message);
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
