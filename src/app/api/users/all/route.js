import pool from '../../../../connection/databaseConnection';
import { NextResponse } from 'next/server';




export async function GET(){    try{
        const res = await pool.query("SELECT id,username, email,first_name,rwandan_name FROM api_user");
        const users = res.rows;
        return NextResponse.json({users});
    }catch(e){
        console.error("Database error on fetching users",e);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}