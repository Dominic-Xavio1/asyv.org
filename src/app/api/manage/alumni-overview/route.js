import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

/**
 * GET - Alumni overview statistics.
 * Returns: total graduates, continued education count, employed count, and percentages.
 * Query params:
 *   - requestingUserId: required (from header x-user-id or query)
 *   - gradeId: optional - when provided AND user is superuser, filter by that grade
 */
export async function GET(request) {
  let userId = request.headers.get("x-user-id");
  let totalGraduates;
  let continuedEducation;
  let employed;
  let withEitherOutcome;
  let continuedEducationPct;
  let employedPct;
  let withEitherOutcomePct;
  let continuedEducationStudents;
  let employedStudents;
  if (!userId) {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get("requestingUserId");
  }
  if (!userId) {
    return NextResponse.json(
      { error: "Requesting user ID required (x-user-id or requestingUserId)" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const gradeId = searchParams.get("gradeId");

  try {
    // Check if user exists and is superuser (for grade filter)
    const userCheck = await pool.query(
      "SELECT is_superuser FROM api_user WHERE id = $1",
      [userId]
    );
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const isSuperuser = userCheck.rows[0].is_superuser === true;

    // Only apply grade filter if superuser and gradeId provided
    const filterByGrade = isSuperuser && gradeId;

    if (filterByGrade) {
      // Alumni whose grade is resolved through family: user -> kid -> family -> grade
      const baseFrom = `
        FROM api_user u
        INNER JOIN api_kid k ON k.user_id = u.id
        INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
        WHERE u.is_alumni = true
      `;
      const totalRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count ${baseFrom}`,
        [gradeId]
      );
      const feRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
          (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
         ${baseFrom}
         AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
        [gradeId]
      );
      const empRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
          (SELECT company FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) as company
         ${baseFrom}
         AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)`,
        [gradeId]
      );

      totalGraduates = parseInt(totalRes.rows[0]?.count ?? 0, 10);
      continuedEducationStudents = feRes.rows;
      continuedEducation = continuedEducationStudents.length;
      employedStudents = empRes.rows;
      employed = employedStudents.length;
    } else {
      // Global: all alumni
      const totalRes = await pool.query(
        "SELECT COUNT(*) AS count FROM api_user WHERE is_alumni = true"
      );
      const feRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
         (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
         FROM api_user u
         WHERE u.is_alumni = true
         AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`
      );
      const empRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
         (SELECT company FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) as company
         FROM api_user u
         WHERE u.is_alumni = true
         AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)`
      );

      totalGraduates = parseInt(totalRes.rows[0]?.count ?? 0, 10);
      continuedEducationStudents = feRes.rows;
      continuedEducation = continuedEducationStudents.length;
      employedStudents = empRes.rows;
      employed = employedStudents.length;
    }

    // Count distinct alumni with either further education OR employment
    let withEitherOutcome;
    if (filterByGrade) {
      const eitherRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count
         FROM api_user u
         INNER JOIN api_kid k ON k.user_id = u.id
         INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
         WHERE u.is_alumni = true
         AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
              OR EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id))`,
        [gradeId]
      );
      withEitherOutcome = parseInt(eitherRes.rows[0]?.count ?? 0, 10);
    } else {
      const eitherRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count
         FROM api_user u
         WHERE u.is_alumni = true
         AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
              OR EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id))`
      );
      withEitherOutcome = parseInt(eitherRes.rows[0]?.count ?? 0, 10);
    }

    const continuedEducationPct =
      totalGraduates > 0
        ? Math.round((continuedEducation / totalGraduates) * 100)
        : 0;
    const employedPct =
      totalGraduates > 0 ? Math.round((employed / totalGraduates) * 100) : 0;
    const withEitherOutcomePct =
      totalGraduates > 0
        ? Math.round((withEitherOutcome / totalGraduates) * 100)
        : 0;

    return NextResponse.json({
      totalGraduates,
      continuedEducation,
      employed,
      withEitherOutcome,
      continuedEducationPct,
      employedPct,
      withEitherOutcomePct,
      continuedEducationStudents, // Return list
      employedStudents,           // Return list
      filteredByGrade: filterByGrade,
      gradeId: filterByGrade ? gradeId : null,
    });
  } catch (err) {
    console.error("Error in GET /api/manage/alumni-overview:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
