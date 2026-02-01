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

    let totalGraduates;
    let continuedEducation;
    let employed;

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
        `SELECT COUNT(DISTINCT u.id) AS count ${baseFrom}
         AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
        [gradeId]
      );
      const empRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count ${baseFrom}
         AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)`,
        [gradeId]
      );
      totalGraduates = parseInt(totalRes.rows[0]?.count ?? 0, 10);
      continuedEducation = parseInt(feRes.rows[0]?.count ?? 0, 10);
      employed = parseInt(empRes.rows[0]?.count ?? 0, 10);
    } else {
      // Global: all alumni
      const totalRes = await pool.query(
        "SELECT COUNT(*) AS count FROM api_user WHERE is_alumni = true"
      );
      const feRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count
         FROM api_user u
         WHERE u.is_alumni = true
         AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`
      );
      const empRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count
         FROM api_user u
         WHERE u.is_alumni = true
         AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)`
      );
      totalGraduates = parseInt(totalRes.rows[0]?.count ?? 0, 10);
      continuedEducation = parseInt(feRes.rows[0]?.count ?? 0, 10);
      employed = parseInt(empRes.rows[0]?.count ?? 0, 10);
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
