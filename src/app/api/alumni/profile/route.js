import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireAlumni } from "../requireAlumni";

/**
 * GET - Fetch alumni profile: kid (current_country, marital_status), furtherEducation, employment
 */
export async function GET(request) {
  const auth = await requireAlumni(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;
  try {
    const kidRes = await pool.query(
      `SELECT id, user_id, current_country, marital_status FROM api_kid WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const kid = kidRes.rows[0] || null;

    const feRes = await pool.query(
      `SELECT fe.id, fe.degree, fe.level, fe.scholarship, fe.scholarship_details, fe.enrolled, fe.college_id,
              c.college_name, c.country, c.city
       FROM api_furthereducation fe
       LEFT JOIN api_college c ON fe.college_id = c.id
       WHERE fe.alumn_id = $1 ORDER BY fe.id DESC`,
      [userId]
    );

    const empRes = await pool.query(
      `SELECT id, title, industry, company, on_going AS ongoing, alumn_id FROM api_employment WHERE alumn_id = $1 ORDER BY id DESC`,
      [userId]
    );

    return NextResponse.json({
      kid,
      furtherEducation: feRes.rows,
      employment: empRes.rows.map((e) => ({ ...e, ongoing: e.ongoing ?? e.on_going ?? false })),
    }, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/alumni/profile:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
