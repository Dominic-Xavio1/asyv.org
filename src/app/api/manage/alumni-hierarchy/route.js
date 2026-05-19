import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

/**
 * Grade → family → alumni student drill-down (same joins as alumni-overview).
 * GET (no query): all grades with counts of distinct families that have at least one alumni kid.
 * GET ?gradeId=: id → families in that grade with alumni kids.
 * GET ?familyId=: id → alumni users in that family (via api_kid).
 */
export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const gradeIdRaw = searchParams.get("gradeId");
  const familyIdRaw = searchParams.get("familyId");

  try {
    if (familyIdRaw) {
      const familyId = parseInt(familyIdRaw, 10);
      if (Number.isNaN(familyId)) {
        return NextResponse.json({ error: "Invalid familyId" }, { status: 400 });
      }

      const famRes = await pool.query(
        `SELECT f.id, f.family_name, f.grade_id, g.grade_name
         FROM api_family f
         LEFT JOIN api_grade g ON g.id = f.grade_id
         WHERE f.id = $1`,
        [familyId]
      );
      if (famRes.rows.length === 0) {
        return NextResponse.json({ error: "Family not found" }, { status: 404 });
      }

      const studentsRes = await pool.query(
        `SELECT u.id, u.first_name, u.rwandan_name, u.email, u.phone, k.id AS kid_id
         FROM api_user u
         INNER JOIN api_kid k ON k.user_id = u.id AND k.family_id = $1
         WHERE u.is_alumni = true
         ORDER BY u.first_name NULLS LAST, u.rwandan_name NULLS LAST`,
        [familyId]
      );

      return NextResponse.json({
        family: famRes.rows[0],
        students: studentsRes.rows,
      });
    }

    if (gradeIdRaw) {
      const gradeId = parseInt(gradeIdRaw, 10);
      if (Number.isNaN(gradeId)) {
        return NextResponse.json({ error: "Invalid gradeId" }, { status: 400 });
      }

      const gradeRes = await pool.query(
        `SELECT id, grade_name, admission_year_to_asyv, graduation_year_to_asyv
         FROM api_grade WHERE id = $1`,
        [gradeId]
      );
      if (gradeRes.rows.length === 0) {
        return NextResponse.json({ error: "Grade not found" }, { status: 404 });
      }

      const familiesRes = await pool.query(
        `SELECT f.id, f.family_name, COUNT(DISTINCT u.id)::int AS alumni_count
         FROM api_family f
         INNER JOIN api_kid k ON k.family_id = f.id
         INNER JOIN api_user u ON u.id = k.user_id AND u.is_alumni = true
         WHERE f.grade_id = $1
         GROUP BY f.id, f.family_name
         ORDER BY f.family_name`,
        [gradeId]
      );

      return NextResponse.json({
        grade: gradeRes.rows[0],
        families: familiesRes.rows,
      });
    }

    const gradesRes = await pool.query(
      `SELECT g.id, g.grade_name, g.admission_year_to_asyv, g.graduation_year_to_asyv,
        (SELECT COUNT(DISTINCT f2.id)::int
         FROM api_family f2
         INNER JOIN api_kid k2 ON k2.family_id = f2.id
         INNER JOIN api_user u2 ON u2.id = k2.user_id AND u2.is_alumni = true
         WHERE f2.grade_id = g.id) AS alumni_family_count
       FROM api_grade g
       ORDER BY g.id`
    );

    return NextResponse.json({ grades: gradesRes.rows });
  } catch (err) {
    console.error("Error in GET /api/manage/alumni-hierarchy:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
