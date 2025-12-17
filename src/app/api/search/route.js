import pool from '../../../connection/databaseConnection'
import { NextResponse } from 'next/server';


export async function GET() {
const response = await pool.query("SELECT * FROM user_profile");
const users = response.rows;
return NextResponse.json({users:users})
}