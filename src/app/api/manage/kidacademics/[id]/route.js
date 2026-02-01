import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../../requireSuperuser";

export async function PUT(request, { params }) {
  const auth = await requireSuperuser(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = params.id;
  if (!id) return NextResponse.json({ error: "Academic record ID required" }, { status: 400 });
  try {
    const body = await request.json();
    const { requestingUserId, academic_year, combination_id, kid_id, level, marks, report_card } = body;
    const existing = await pool.query("SELECT id FROM api_kidacademics WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Academic record not found" }, { status: 404 });
    }
    const updates = [];
    const values = [];
    let i = 1;
    if (academic_year !== undefined) { updates.push(`academic_year = $${i++}`); values.push(academic_year); }
    if (combination_id !== undefined) { updates.push(`combination_id = $${i++}`); values.push(combination_id); }
    if (kid_id !== undefined) { updates.push(`kid_id = $${i++}`); values.push(kid_id); }
    if (level !== undefined) { updates.push(`level = $${i++}`); values.push(level); }
    if (marks !== undefined) { updates.push(`marks = $${i++}`); values.push(marks); }
    if (report_card !== undefined) { updates.push(`report_card = $${i++}`); values.push(report_card); }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE api_kidacademics SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return NextResponse.json({ success: true, academic: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in PUT /api/manage/kidacademics/[id]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = params.id;
  if (!id) return NextResponse.json({ error: "Academic record ID required" }, { status: 400 });
  try {
    const existing = await pool.query("SELECT id FROM api_kidacademics WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Academic record not found" }, { status: 404 });
    }
    await pool.query("DELETE FROM api_kidacademics WHERE id = $1", [id]);
    return NextResponse.json({ success: true, message: "Academic record deleted" }, { status: 200 });
  } catch (err) {
    console.error("Error in DELETE /api/manage/kidacademics/[id]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
