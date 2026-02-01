import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireAlumni } from "../requireAlumni";

/**
 * GET - Fetch employment for alumni. Only their own records.
 */
export async function GET(request) {
  const auth = await requireAlumni(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await pool.query(
      `SELECT id, title, industry, company, on_going, alumn_id FROM api_employment WHERE alumn_id = $1 ORDER BY id DESC`,
      [auth.userId]
    );
    const rows = result.rows.map((e) => ({ ...e, ongoing: e.on_going ?? e.on_going ?? false }));
    return NextResponse.json({ success: true, employment: rows }, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/alumni/employment:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST - Create employment. alumn_id = requesting user.
 */
export async function POST(request) {
  const auth = await requireAlumni(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const { alumn_id, title, industry, company, ongoing } = body;

    if (alumn_id && String(alumn_id) !== auth.userId) {
      return NextResponse.json({ error: "Can only create for yourself" }, { status: 403 });
    }
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO api_employment (alumn_id, title, industry, company, on_going)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, industry, company, on_going AS ongoing, alumn_id`,
      [auth.userId, title, industry || null, company || null, ongoing !== undefined ? ongoing : false]
    );
    return NextResponse.json({ success: true, employment: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/alumni/employment:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT - Update employment. Must belong to requesting user. NO DELETE - alumni cannot delete.
 */
export async function PUT(request) {
  const auth = await requireAlumni(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const { id, title, industry, company, ongoing } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const owner = await pool.query("SELECT alumn_id FROM api_employment WHERE id = $1", [id]);
    if (owner.rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    if (String(owner.rows[0].alumn_id) !== auth.userId) {
      return NextResponse.json({ error: "Can only update your own records" }, { status: 403 });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    if (title !== undefined) { updateFields.push(`title = $${paramCount++}`); updateValues.push(title); }
    if (industry !== undefined) { updateFields.push(`industry = $${paramCount++}`); updateValues.push(industry); }
    if (company !== undefined) { updateFields.push(`company = $${paramCount++}`); updateValues.push(company); }
    if (ongoing !== undefined) { updateFields.push(`on_going = $${paramCount++}`); updateValues.push(ongoing); }

    if (updateFields.length === 0) {  
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    } 
    updateValues.push(id);
    const result = await pool.query(
      `UPDATE api_employment SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING id, title, industry, company, on_going AS ongoing, alumn_id`,
      updateValues
    );
    return NextResponse.json({ success: true, employment: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in PUT /api/alumni/employment:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
