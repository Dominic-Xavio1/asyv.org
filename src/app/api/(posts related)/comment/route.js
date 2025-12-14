import { NextResponse } from "next/server";
import pool from '../../../../connection/databaseConnection';

export async function POST(request){
    try{
const commingInf = await request.json();
const {content,postId,userId} = commingInf;
if(!content || content.trim() === ""||postId||userId){
    return NextResponse.json({message:"Content or userId or postId is needed!"})
}
const result = await pool.query(
    `INSERT INTO api_comment (post_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [postId, userId, content]
  );
  return NextResponse.json({success:true,
    comments:result.rows
  })
    }catch(err){
        console.log("Error posting comments ",err.message)
        return NextResponse.json({
            success:true,
            message:err.message
        })
    }
}