import { NextResponse } from "next/server";
import pool from '../../../connection/databaseConnection';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'opportunities');

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    const { created_by, title, content, media_type } = data;
    const mediaFile = formData.get('media_url');
    
    console.log("received opportunity data:", data);
    let mediaUrl = null;
    
    // Check if media_url is a File object or a string  
    const isFile = mediaFile instanceof File;
    
    if (isFile && mediaFile.size > 0) {
      await ensureUploadDir();
      const bytes = await mediaFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const ext = mediaFile.name.split('.').pop() || 'jpg';
      const filename = `${title}-${timestamp}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      mediaUrl = `/uploads/opportunities/${filename}`;
      console.log("Media saved to:", mediaUrl);
    } else if (!isFile && mediaFile && typeof mediaFile === 'string' && mediaFile.trim() !== '') {
      // If it's already a URL string, use it directly
      mediaUrl = mediaFile;
    }
    
    if (!created_by || !title || !content) {
      return NextResponse.json(
        { error: "created_by, title, and content are required" }, 
        { status: 400 }
      );
    }
    
    // Determine media type if not provided
    let detectedMediaType = media_type || null;
    if (isFile && mediaFile.size > 0) {
      const fileType = mediaFile.type;
      if (fileType.startsWith('video/')) {
        detectedMediaType = 'video';
      } else if (fileType.startsWith('image/')) {
        detectedMediaType = 'image';
      }
    } else if (!isFile && mediaUrl) {
      // Try to detect from URL extension
      const urlLower = mediaUrl.toLowerCase();
      if (urlLower.match(/\.(mp4|mov|avi|webm|mkv)$/)) {
        detectedMediaType = 'video';
      } else if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        detectedMediaType = 'image';
      }
    }
    
    const response = await pool.query(
      `INSERT INTO api_opportunity (created_by, title, content, media_url, media_type) 
       VALUES($1, $2, $3, $4, $5) 
       RETURNING id, created_by, title, content, media_url, media_type, created_at`,
      [created_by, title, content, mediaUrl, detectedMediaType]
    );
    
    return NextResponse.json({
      success: true,
      opportunity: response.rows[0]
    }, { status: 201 });
  } catch(e) {
    console.log("/api/opportunity POST Error: ", e);
    return NextResponse.json(
      { error: "Failed to create opportunity", details: e.message }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let query = `
      SELECT id, created_by, title, content, media_url, media_type, created_at 
      FROM api_opportunity 
      ORDER BY created_at DESC
    `;
    const res = await pool.query(query);
    return NextResponse.json({
      success: true,
      opportunities: res.rows
    });
  } catch(e) {
    console.log("/api/opportunity GET Error: ", e);
    return NextResponse.json(
      { error: "Failed to fetch opportunities", details: e.message }, 
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    const { id, title, content, media_url, media_type } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: "Opportunity id is required" }, 
        { status: 400 }
      );
    }
    
    const response = await pool.query(
      `UPDATE api_opportunity 
       SET title = $1, content = $2, media_url = COALESCE($3, media_url), 
           media_type = COALESCE($4, media_type), updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, created_by, title, content, media_url, media_type, created_at, updated_at`,
      [title, content, media_url || null, media_type || null, id]
    );
    
    if (response.rows.length === 0) {
      return NextResponse.json(
        { error: "Opportunity not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      opportunity: response.rows[0]
    });
  } catch(e) {
    console.log("/api/opportunity PUT Error: ", e);
    return NextResponse.json(
      { error: "Failed to update opportunity", details: e.message }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('id');
    
    if (!opportunityId) {
      return NextResponse.json(
        { error: "Opportunity id is required" }, 
        { status: 400 }
      );
    }
    
    const response = await pool.query(
      `DELETE FROM api_opportunity WHERE id = $1 RETURNING id`,
      [opportunityId]
    );
    
    if (response.rows.length === 0) {
      return NextResponse.json(
        { error: "Opportunity not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Opportunity deleted successfully"
    });
  } catch(e) {
    console.log("/api/opportunity DELETE Error: ", e);
    return NextResponse.json(
      { error: "Failed to delete opportunity", details: e.message }, 
      { status: 500 }
    );
  }
}

