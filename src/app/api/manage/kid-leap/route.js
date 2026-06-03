import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const kidId = searchParams.get("kidId");

    let query = "SELECT kl.*, l.ep, l.leap_category FROM api_kidleap kl JOIN api_leap l ON kl.leap_id = l.id";
    const values = [];

    if (kidId) {
      query += " WHERE kl.kid_id = $1";
      values.push(kidId);
    }
    
    query += " ORDER BY kl.id";

    const result = await pool.query(query, values);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/kid-leap:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireSuperuser(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { requestingUserId, ...data } = body;

    const fields = Object.keys(data).filter(key => data[key] !== undefined && data[key] !== '');
    const values = fields.map(key => data[key]);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

    if (fields.length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
    }

    const query = `INSERT INTO api_kidleap (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, record: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/manage/kid-leap:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const query = `UPDATE api_kidleap SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, record: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in PUT /api/manage/kid-leap:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    const result = await pool.query("DELETE FROM api_kidleap WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in DELETE /api/manage/kid-leap:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
