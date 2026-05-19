import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

// GET - Fetch all LEAP records
export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await pool.query("SELECT * FROM api_leap ORDER BY id");
    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/leap:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST - Create new LEAP record
export async function POST(request) {
  const auth = await requireSuperuser(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { requestingUserId, ...leapData } = body;

    const fields = Object.keys(leapData).filter(key => leapData[key] !== undefined && leapData[key] !== '');
    const values = fields.map(key => leapData[key]);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

    if (fields.length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
    }

    const query = `INSERT INTO api_leap (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, leap: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/manage/leap:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT - Update LEAP record
export async function PUT(request) {
  const auth = await requireSuperuser(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required for update" }, { status: 400 });
    }

    const body = await request.json();
    const { requestingUserId, ...updateData } = body;

    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
    if (fields.length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    const setClause = fields.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = [...fields.map(key => updateData[key]), id];
    const query = `UPDATE api_leap SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "LEAP record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, leap: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in PUT /api/manage/leap:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE - Delete LEAP record
export async function DELETE(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required for deletion" }, { status: 400 });
    }

    const result = await pool.query("DELETE FROM api_leap WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "LEAP record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in DELETE /api/manage/leap:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
