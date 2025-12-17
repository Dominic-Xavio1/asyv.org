import pool from '../../../../connection/databaseConnection';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const infoData = await request.json();
        const {  owner_id } = infoData;
        if ( !owner_id){
            return NextResponse.json(
                { error: "owner_id is required" },
                { status: 400 }
            );
        }
    const response = await pool.query(
        `SELECT * FROM api_opportunity WHERE user_id = $1`,[owner_id]
    )
    // Always return an array of opportunities (may be empty)
    return NextResponse.json({
        success: true,
        opportunities: response.rows
    });
  } catch(e) {
    console.log("/api/opportunity/owner POST Error: ", e);
    return NextResponse.json(
      { error: "Failed to fetch opportunity by owner", details: e.message }, 
      { status: 500 }
    );
  }
}