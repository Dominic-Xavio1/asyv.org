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
      "SELECT * FROM api_grade ORDER BY id"
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/grades:", err);
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
    const { requestingUserId, grade_name, admission_year_to_asyv, graduation_year_to_asyv } = body;
    const res = await pool.query(
      `INSERT INTO api_grade (grade_name, admission_year_to_asyv, graduation_year_to_asyv)
       VALUES ($1, $2, $3) RETURNING *`,
      [grade_name ?? null, admission_year_to_asyv ?? null, graduation_year_to_asyv ?? null]
    );
    return NextResponse.json({ success: true, grade: res.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/manage/grades:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
