import { NextResponse } from "next/server";
import pool from '../../../connection/databaseConnection';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    const { user_id, title, op_type, description, deadline, link, organization, location } = data;
    
    console.log("received opportunity data:", data);
    if (!user_id || !title || !op_type || !description) {
      return NextResponse.json(
        { error: "user_id, title, op_type, and description are required" }, 
        { status: 400 }
      );
    }
    const approved = data.approved === 'true' || data.approved === true ? true : false;
    
    const response = await pool.query(
      `INSERT INTO api_opportunity (user_id, title, op_type, description, deadline, link, approved, organization, location) 
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, user_id, title, op_type, description, deadline, link, approved, organization, location, post_time`,
      [user_id, title, op_type, description, deadline || null, link || null, approved, organization || null, location || null]
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
      SELECT 
        o.id,
        o.user_id,
        o.title,
        o.op_type,
        o.description,
        o.deadline,
        o.link,
        o.approved,
        o.organization,
        o.location,
        o.post_time,
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
      FROM api_opportunity o
      JOIN api_user u ON o.user_id = u.id
      LEFT JOIN user_profile up ON up.created_by = u.id
      WHERE o.approved = true
      ORDER BY o.post_time DESC
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
    const { id, title, op_type, description, deadline, link, organization, location, approved } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: "Opportunity id is required" }, 
        { status: 400 }
      );
    }
    
    const response = await pool.query(
      `UPDATE api_opportunity 
       SET title = COALESCE($1, title),
           op_type = COALESCE($2, op_type),
           description = COALESCE($3, description),
           deadline = COALESCE($4, deadline),
           link = COALESCE($5, link),
           organization = COALESCE($6, organization),
           location = COALESCE($7, location),
           approved = COALESCE($8, approved)
       WHERE id = $9
       RETURNING id, user_id, title, op_type, description, deadline, link, approved, organization, location, post_time`,
      [title || null, op_type || null, description || null, deadline || null, link || null, organization || null, location || null, approved !== undefined ? (approved === 'true' || approved === true) : null, id]
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
