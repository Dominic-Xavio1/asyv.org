import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await pool.query(
      `SELECT f.*, u.first_name AS mother_first_name, u.rwandan_name AS mother_rwandan_name,
              g.grade_name, g.admission_year_to_asyv, g.graduation_year_to_asyv
       FROM api_family f
       LEFT JOIN api_user u ON f.mother_id = u.id
       LEFT JOIN api_grade g ON f.grade_id = g.id
       ORDER BY f.id`
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/families:", err);
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
    const { requestingUserId, family_name, family_number, mother_id, grade_id } = body;
    const res = await pool.query(
      `INSERT INTO api_family (family_name, family_number, mother_id, grade_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [family_name ?? null, family_number ?? null, mother_id ?? null, grade_id ?? null]
    );
    return NextResponse.json({ success: true, family: res.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/manage/families:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
