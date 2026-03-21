import { NextResponse } from 'next/server';
import pool from '../../../../connection/databaseConnection';

export async function GET(request, { params }) {
  try {
    const param = await params
    const eventId = param.id;
    
    const query = `
      SELECT 
        ve.*, 
        u.username, 
        u.email,
        COALESCE(up.profile_image, 'https://api.dicebear.com' || u.username) AS profile_image,
        COALESCE(up.full_name, u.first_name) AS full_name
      FROM village_events ve
      JOIN api_user u ON ve.created_by = u.id
      LEFT JOIN user_profile up ON up.created_by = u.id
      WHERE ve.id = $1 
    `;
    
    const res = await pool.query(query, [eventId]);
    
    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      event: res.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching village event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
