import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../../requireSuperuser";

export async function GET(request, { params }) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: "Family ID required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT f.*, u.first_name AS mother_first_name, u.rwandan_name AS mother_rwandan_name,
              g.grade_name, g.admission_year_to_asyv, g.graduation_year_to_asyv
       FROM api_family f
       LEFT JOIN api_user u ON f.mother_id = u.id
       LEFT JOIN api_grade g ON f.grade_id = g.id
       WHERE f.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/families/[id]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const auth = await requireSuperuser(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return NextResponse.json({ error: "Family ID required" }, { status: 400 });
  try {
    const body = await request.json();
    const { requestingUserId, family_name, family_number, mother_id, grade_id } = body;
    const existing = await pool.query("SELECT id FROM api_family WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }
    const updates = [];
    const values = [];
    let i = 1;
    if (family_name !== undefined) { updates.push(`family_name = $${i++}`); values.push(family_name); }
    if (family_number !== undefined) { updates.push(`family_number = $${i++}`); values.push(family_number); }
    if (mother_id !== undefined) { updates.push(`mother_id = $${i++}`); values.push(mother_id); }
    if (grade_id !== undefined) { updates.push(`grade_id = $${i++}`); values.push(grade_id); }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE api_family SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return NextResponse.json({ success: true, family: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in PUT /api/manage/families/[id]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return NextResponse.json({ error: "Family ID required" }, { status: 400 });
  try {
    const existing = await pool.query("SELECT id FROM api_family WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }
    await pool.query("DELETE FROM api_family WHERE id = $1", [id]);
    return NextResponse.json({ success: true, message: "Family deleted" }, { status: 200 });
  } catch (err) {
    console.error("Error in DELETE /api/manage/families/[id]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
