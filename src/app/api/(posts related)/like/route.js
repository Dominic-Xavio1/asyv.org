import { NextResponse } from "next/server";
import pool from '../../../../connection/databaseConnection';


export async function POST(request){
    try{
const commingData = await request.json()
const {postId,userId} = commingData
const likeCheck = await pool.query(
    'SELECT id FROM api_like WHERE post_id = $1 AND user_id = $2',
    [postId, userId]
  );
  let action;
  if (likeCheck.rows.length > 0) {
    await pool.query(
      'DELETE FROM api_like WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    action = 'removed';
  } else {
    await pool.query(
      'INSERT INTO api_like (post_id, user_id) VALUES ($1, $2)',
      [postId, userId]
    );
    action = 'added';
    const likeCountRes = await pool.query(
        'SELECT COUNT(*) FROM api_like WHERE post_id = $1',
        [postId]
      );
      const likeCount = parseInt(likeCountRes.rows[0].count);
      return NextResponse.json({
        action,likeCount
      })
  }
    }catch(err){
        console.log("Erro from like endpoint ",err.message)
        return NextResponse.json({
            success:false,
            message:err.message
        })
    }
}