import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { searchParams } = new URL(request.url);
  const kid_id = searchParams.get("kid_id");
  try {
    let result;
    if (kid_id) {
      result = await pool.query(
        `SELECT ka.*, c.combination_name, c.abbreviation
         FROM api_kidacademics ka
         LEFT JOIN api_combination c ON ka.combination_id = c.id
         WHERE ka.kid_id = $1 ORDER BY ka.academic_year DESC, ka.id`,
        [kid_id]
      );
    } else {
      result = await pool.query(
        `SELECT ka.*, c.combination_name, c.abbreviation
         FROM api_kidacademics ka
         LEFT JOIN api_combination c ON ka.combination_id = c.id
         ORDER BY ka.kid_id, ka.academic_year DESC`
      );
    }
    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/kidacademics:", err);
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
    const { requestingUserId, academic_year, combination_id, kid_id, level, marks, report_card } = body;
    if (!kid_id) {
      return NextResponse.json({ error: "kid_id is required" }, { status: 400 });
    }
    const res = await pool.query(
      `INSERT INTO api_kidacademics (academic_year, combination_id, kid_id, level, marks, report_card)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        academic_year ?? null,
        combination_id ?? null,
        kid_id,
        level ?? null,
        marks ?? null,
        report_card ?? null,
      ]
    );
    return NextResponse.json({ success: true, academic: res.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/manage/kidacademics:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
