import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../../requireSuperuser";

export async function PUT(request, { params }) {
  const auth = await requireSuperuser(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = params.id;
  if (!id) return NextResponse.json({ error: "Grade ID required" }, { status: 400 });
  try {
    const body = await request.json();
    const { requestingUserId, grade_name, admission_year_to_asyv, graduation_year_to_asyv } = body;
    const existing = await pool.query("SELECT id FROM api_grade WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }
    const updates = [];
    const values = [];
    let i = 1;
    if (grade_name !== undefined) { updates.push(`grade_name = $${i++}`); values.push(grade_name); }
    if (admission_year_to_asyv !== undefined) { updates.push(`admission_year_to_asyv = $${i++}`); values.push(admission_year_to_asyv); }
    if (graduation_year_to_asyv !== undefined) { updates.push(`graduation_year_to_asyv = $${i++}`); values.push(graduation_year_to_asyv); }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE api_grade SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return NextResponse.json({ success: true, grade: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in PUT /api/manage/grades/[id]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = params.id;
  if (!id) return NextResponse.json({ error: "Grade ID required" }, { status: 400 });
  try {
    const existing = await pool.query("SELECT id FROM api_grade WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }
    await pool.query("DELETE FROM api_grade WHERE id = $1", [id]);
    return NextResponse.json({ success: true, message: "Grade deleted" }, { status: 200 });
  } catch (err) {
    console.error("Error in DELETE /api/manage/grades/[id]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
