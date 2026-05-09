import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../../requireSuperuser";

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
