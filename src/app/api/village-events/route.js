import { NextResponse } from "next/server";
import pool from '../../../connection/databaseConnection';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'village-events');

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Combined Query: Validates permissions and fetches data in one go
const query = `
  WITH requester AS (
    -- Get requester info; using $1::bigint to match your column type
    SELECT id, is_crc, is_superuser FROM api_user WHERE id = $1
  )
  SELECT 
    ve.*, u.username, u.email,
    COALESCE(up.profile_image, 'https://api.dicebear.com' || u.username) AS profile_image,
    COALESCE(up.full_name, u.first_name) AS full_name
  FROM village_events ve
  JOIN api_user u ON ve.created_by = u.id
  LEFT JOIN user_profile up ON up.created_by = u.id
  LEFT JOIN requester r ON true -- Join requester info to every row
  WHERE (
    -- 1. Fetching specific user events (requires being the user + having permission)
    ($1::bigint IS NOT NULL AND ve.created_by = $1 AND (r.is_crc OR r.is_superuser))
    OR 
    -- 2. Fetching public feed (when no user_id is provided)
    ($1::bigint IS NULL AND ve.is_active = true)
  )
  ORDER BY ve.created_at DESC;
`;


    const res = await pool.query(query, [userId]);

    // Handle unauthorized or empty results specifically for user-based requests
    if (userId && res.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Access denied or no events found' }, { status: 403 });
    }

    return NextResponse.json({ success: true, events: res.rows });
  } catch (error) {
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}

// POST - Create new village event
export async function POST(request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    const { 
      created_by, 
      title, 
      content, 
      event_type, 
      location, 
      event_date 
    } = data;
    
    const imageFile = formData.get('image_url');
    const isFile = imageFile instanceof File;
    let imageUrl = null;
    
    if (isFile && imageFile.size > 0) {
      await ensureUploadDir();
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/village-events/${filename}`;
    } else if (!isFile && imageFile && typeof imageFile === 'string' && imageFile.trim() !== '') {
      // If it's already a URL string, use it directly
      imageUrl = imageFile;
    }
    
    // Validate required fields
    if (!created_by || !title || !content) {
      return NextResponse.json(
        { error: "created_by, title, and content are required" }, 
        { status: 400 }
      );
    }
    
    // Validate event_type
    const validEventTypes = ['news', 'event', 'announcement'];
    if (event_type && !validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: "event_type must be one of: news, event, announcement" }, 
        { status: 400 }
      );
    }
    
    const response = await pool.query(
      `INSERT INTO village_events (created_by, title, content, event_type, image_url, location, event_date) 
       VALUES($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, created_by, title, content, event_type, image_url, location, event_date, created_at, updated_at, is_active`,
      [created_by, title, content, event_type || 'news', imageUrl, location || null, event_date || null]
    );
    
    return NextResponse.json({
      success: true,
      event: response.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/village-events Error:", error);
    return NextResponse.json(
      { error: "Failed to create village event", details: error.message }, 
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    const { 
      id, 
      title, 
      content, 
      event_type, 
      location, 
      event_date,
      is_active 
    } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: "Event id is required" }, 
        { status: 400 }
      );
    }
    
    // Handle image update
    const imageFile = formData.get('image_url');
    const isFile = imageFile instanceof File;
    let imageUrl = null;
    
    if (isFile && imageFile.size > 0) {
      await ensureUploadDir();
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/village-events/${filename}`;
    } else if (!isFile && imageFile && typeof imageFile === 'string' && imageFile.trim() !== '') {
      imageUrl = imageFile;
    }
    
    const response = await pool.query(
      `UPDATE village_events 
       SET title = $1, 
           content = $2, 
           event_type = $3, 
           image_url = COALESCE($4, image_url), 
           location = $5, 
           event_date = $6,
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, created_by, title, content, event_type, image_url, location, event_date, created_at, updated_at, is_active`,
      [title, content, event_type, imageUrl, location, event_date, is_active === 'true' ? true : false, id]
    );
    
    if (response.rows.length === 0) {
      return NextResponse.json(
        { error: "Village event not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      event: response.rows[0]
    });
  } catch (error) {
    console.error("PUT /api/village-events Error:", error);
    return NextResponse.json(
      { error: "Failed to update village event", details: error.message }, 
      { status: 500 }
    );
  }
}

// DELETE - Delete village event
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event id is required" }, 
        { status: 400 }
      );
    }
    
    const response = await pool.query(
      `DELETE FROM village_events WHERE id = $1 RETURNING id`,
      [eventId]
    );
    
    if (response.rows.length === 0) {
      return NextResponse.json(
        { error: "Village event not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Village event deleted successfully"
    });
  } catch (error) {
    console.error("DELETE /api/village-events Error:", error);
    return NextResponse.json(
      { error: "Failed to delete village event", details: error.message }, 
      { status: 500 }
    );
  }
}
