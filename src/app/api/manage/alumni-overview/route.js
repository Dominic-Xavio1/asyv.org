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
  let eitherOutcomeStudents;
  let degreeLevelStudents = {};
  let areasOfStudyStudents = {};
  let collegesByCountryStudents = {};
  let industryDistributionStudents = {};
  let topEmployersStudents = {};
  let outcomesByYearStudents = {};
  let outcomesByYear = [];
  let degreeLevelDistribution = [];
  let areasOfStudy = [];
  let collegesByCountry = [];
  let industryDistribution = [];
  let topEmployers = [];
  if (!userId) {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get("requestingUserId");
    userId=3007
  }
  if (!userId) {
    return NextResponse.json(
      { error: "Requesting user ID required (x-user-id or requestingUserId)" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const gradeId = searchParams.get("gradeId");
  const gradeIdsParam = searchParams.get("gradeIds");
  const gradeIds = gradeIdsParam
    ? gradeIdsParam
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== "")
    : [];

  try {
    // Check if user exists and is superuser/CRC (for grade filter)
    const userCheck = await pool.query(
      "SELECT is_superuser, is_crc FROM api_user WHERE id = $1",
      [userId]
    );
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const isSuperuserOrCrc =
      userCheck.rows[0].is_superuser === true ||
      userCheck.rows[0].is_crc === true;

    // Only apply grade filter if superuser/CRC and gradeId/gradeIds provided
    const hasAnyGradeFilter = !!gradeId || gradeIds.length > 0;
    const filterByGrade = isSuperuserOrCrc && hasAnyGradeFilter;

    if (filterByGrade && gradeIds.length > 0) {
      // Multi-grade filter
      const numericGradeIds = gradeIds.map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));

      const baseFrom = `
        FROM api_user u
        INNER JOIN api_kid k ON k.user_id = u.id
        INNER JOIN api_family f ON f.id = k.family_id
        WHERE u.is_alumni = true
          AND f.grade_id = ANY($1::int[])
      `;
      const totalRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count ${baseFrom}`,
        [numericGradeIds]
      );
      const feRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
          (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
         ${baseFrom}
         AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
        [numericGradeIds]
      );
      const empRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
          (SELECT company FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) as company
         ${baseFrom}
         AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)`,
        [numericGradeIds]
      );

      totalGraduates = parseInt(totalRes.rows[0]?.count ?? 0, 10);
      continuedEducationStudents = feRes.rows;
      continuedEducation = continuedEducationStudents.length;
      employedStudents = empRes.rows;
      employed = employedStudents.length;
    } else if (filterByGrade && gradeId) {
      // Single-grade filter
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
    if (filterByGrade && gradeIds.length > 0) {
      const numericGradeIds = gradeIds.map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));
      const eitherRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count
         FROM api_user u
         INNER JOIN api_kid k ON k.user_id = u.id
         INNER JOIN api_family f ON f.id = k.family_id
         WHERE u.is_alumni = true
           AND f.grade_id = ANY($1::int[])
           AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
                OR EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id))`,
        [numericGradeIds]
      );
      withEitherOutcome = parseInt(eitherRes.rows[0]?.count ?? 0, 10);
      const eitherListRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email
         FROM api_user u
         INNER JOIN api_kid k ON k.user_id = u.id
         INNER JOIN api_family f ON f.id = k.family_id
         WHERE u.is_alumni = true
           AND f.grade_id = ANY($1::int[])
           AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
                OR EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id))`,
        [numericGradeIds]
      );
      eitherOutcomeStudents = eitherListRes.rows;
    } else if (filterByGrade && gradeId) {
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
      const eitherListRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email
         FROM api_user u
         INNER JOIN api_kid k ON k.user_id = u.id
         INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
         WHERE u.is_alumni = true
         AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
              OR EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id))`,
        [gradeId]
      );
      eitherOutcomeStudents = eitherListRes.rows;
    } else {
      const eitherRes = await pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count
         FROM api_user u
         WHERE u.is_alumni = true
         AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
              OR EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id))`
      );
      withEitherOutcome = parseInt(eitherRes.rows[0]?.count ?? 0, 10);
      const eitherListRes = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email
         FROM api_user u
         WHERE u.is_alumni = true
         AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
              OR EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id))`
      );
      eitherOutcomeStudents = eitherListRes.rows;
    }

    // Degree breakdown (for further education), grouped by degree
    let degreeStats = [];
    if (totalGraduates > 0) {
      if (filterByGrade && gradeIds.length > 0) {
        const numericGradeIds = gradeIds.map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));
        const degreeRes = await pool.query(
          `SELECT fe.degree, COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id
           WHERE u.is_alumni = true
             AND f.grade_id = ANY($1::int[])
           GROUP BY fe.degree
           ORDER BY count DESC`,
          [numericGradeIds]
        );
        degreeStats = degreeRes.rows;
      } else if (filterByGrade && gradeId) {
        const degreeRes = await pool.query(
          `SELECT fe.degree, COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
           WHERE u.is_alumni = true
           GROUP BY fe.degree
           ORDER BY count DESC`,
          [gradeId]
        );
        degreeStats = degreeRes.rows;
      } else {
        const degreeRes = await pool.query(
          `SELECT fe.degree, COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           WHERE u.is_alumni = true
           GROUP BY fe.degree
           ORDER BY count DESC`
        );
        degreeStats = degreeRes.rows;
      }
    }

    // Outcomes by graduation year (employment only, FE only, both, neither) with student lists
    if (isSuperuserOrCrc) {
      if (filterByGrade && gradeIds.length > 0) {
        const numericGradeIds = gradeIds.map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));
        const res = await pool.query(
          `WITH base AS (
             SELECT DISTINCT u.id,
                    g.graduation_year_to_asyv AS grad_year,
                    EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id) AS has_fe,
                    EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id) AS has_emp
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
           )
           SELECT grad_year,
                  COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE has_emp = true AND has_fe = false) AS employment_only,
                  COUNT(*) FILTER (WHERE has_emp = false AND has_fe = true) AS fe_only,
                  COUNT(*) FILTER (WHERE has_emp = true AND has_fe = true) AS both,
                  COUNT(*) FILTER (WHERE has_emp = false AND has_fe = false) AS neither
           FROM base
           GROUP BY grad_year
           ORDER BY grad_year`,
          [numericGradeIds]
        );
        outcomesByYear = res.rows;
        
        // Get student lists for each outcome type by year
        for (const row of res.rows) {
          const gradYear = row.grad_year;
          
          // Employment only
          const empOnlyRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT e.company FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) as company
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND g.graduation_year_to_asyv = $2
               AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)
               AND NOT EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
            [numericGradeIds, gradYear]
          );
          
          // Further education only
          const feOnlyRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT fe.scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND g.graduation_year_to_asyv = $2
               AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
               AND NOT EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)`,
            [numericGradeIds, gradYear]
          );
          
          // Both employment and further education
          const bothRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT e.company FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) as company,
             (SELECT fe.scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND g.graduation_year_to_asyv = $2
               AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)
               AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
            [numericGradeIds, gradYear]
          );
          
          // Neither employment nor further education
          const neitherRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND g.graduation_year_to_asyv = $2
               AND NOT EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)
               AND NOT EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
            [numericGradeIds, gradYear]
          );
          
          outcomesByYearStudents[gradYear] = {
            employment_only: empOnlyRes.rows,
            fe_only: feOnlyRes.rows,
            both: bothRes.rows,
            neither: neitherRes.rows
          };
        }
      } else {
        const res = await pool.query(
          `WITH base AS (
             SELECT DISTINCT u.id,
                    g.graduation_year_to_asyv AS grad_year,
                    EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id) AS has_fe,
                    EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id) AS has_emp
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
           )
           SELECT grad_year,
                  COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE has_emp = true AND has_fe = false) AS employment_only,
                  COUNT(*) FILTER (WHERE has_emp = false AND has_fe = true) AS fe_only,
                  COUNT(*) FILTER (WHERE has_emp = true AND has_fe = true) AS both,
                  COUNT(*) FILTER (WHERE has_emp = false AND has_fe = false) AS neither
           FROM base
           GROUP BY grad_year
           ORDER BY grad_year`
        );
        outcomesByYear = res.rows;
        
        // Get student lists for each outcome type by year
        for (const row of res.rows) {
          const gradYear = row.grad_year;
          
          // Employment only
          const empOnlyRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT e.company FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) as company
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND g.graduation_year_to_asyv = $1
               AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)
               AND NOT EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
            [gradYear]
          );
          
          // Further education only
          const feOnlyRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT fe.scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND g.graduation_year_to_asyv = $1
               AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
               AND NOT EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)`,
            [gradYear]
          );
          
          // Both employment and further education
          const bothRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT e.company FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) as company,
             (SELECT fe.scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND g.graduation_year_to_asyv = $1
               AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)
               AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
            [gradYear]
          );
          
          // Neither employment nor further education
          const neitherRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email
             FROM api_user u
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             INNER JOIN api_grade g ON g.id = f.grade_id
             WHERE u.is_alumni = true
               AND g.graduation_year_to_asyv = $1
               AND NOT EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)
               AND NOT EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
            [gradYear]
          );
          
          outcomesByYearStudents[gradYear] = {
            employment_only: empOnlyRes.rows,
            fe_only: feOnlyRes.rows,
            both: bothRes.rows,
            neither: neitherRes.rows
          };
        }
      }
    }

    // Degree level distribution (A0, A1, M, C mapped to labels) with student lists
    if (totalGraduates > 0) {
      if (filterByGrade && gradeIds.length > 0) {
        const numericGradeIds = gradeIds.map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));
        const res = await pool.query(
          `SELECT
             CASE
               WHEN fe.level = 'A0' THEN 'Bachelor'
               WHEN fe.level = 'A1' THEN 'Advanced Diploma'
               WHEN fe.level = 'M' THEN 'Master'
               WHEN fe.level = 'C' THEN 'Certificate'
               ELSE 'Other'
             END AS level_label,
             COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id
           WHERE u.is_alumni = true
             AND f.grade_id = ANY($1::int[])
           GROUP BY level_label
           ORDER BY count DESC`,
          [numericGradeIds]
        );
        degreeLevelDistribution = res.rows;
        
        // Get student lists for each degree level
        for (const row of res.rows) {
          const levelLabel = row.level_label;
          let levelCondition;
          if (levelLabel === 'Bachelor') levelCondition = 'A0';
          else if (levelLabel === 'Advanced Diploma') levelCondition = 'A1';
          else if (levelLabel === 'Master') levelCondition = 'M';
          else if (levelLabel === 'Certificate') levelCondition = 'C';
          else levelCondition = 'OTHER';
          
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND fe.level = $2`,
            [numericGradeIds, levelCondition]
          );
          degreeLevelStudents[levelLabel] = studentRes.rows;
        }
      } else if (filterByGrade && gradeId) {
        const res = await pool.query(
          `SELECT
             CASE
               WHEN fe.level = 'A0' THEN 'Bachelor'
               WHEN fe.level = 'A1' THEN 'Advanced Diploma'
               WHEN fe.level = 'M' THEN 'Master'
               WHEN fe.level = 'C' THEN 'Certificate'
               ELSE 'Other'
             END AS level_label,
             COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
           WHERE u.is_alumni = true
           GROUP BY level_label
           ORDER BY count DESC`,
          [gradeId]
        );
        degreeLevelDistribution = res.rows;
        
        // Get student lists for each degree level
        for (const row of res.rows) {
          const levelLabel = row.level_label;
          let levelCondition;
          if (levelLabel === 'Bachelor') levelCondition = 'A0';
          else if (levelLabel === 'Advanced Diploma') levelCondition = 'A1';
          else if (levelLabel === 'Master') levelCondition = 'M';
          else if (levelLabel === 'Certificate') levelCondition = 'C';
          else levelCondition = 'OTHER';
          
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             WHERE u.is_alumni = true
               AND f.grade_id = $1
               AND fe.level = $2`,
            [gradeId, levelCondition]
          );
          degreeLevelStudents[levelLabel] = studentRes.rows;
        }
      } else {
        const res = await pool.query(
          `SELECT
             CASE
               WHEN fe.level = 'A0' THEN 'Bachelor'
               WHEN fe.level = 'A1' THEN 'Advanced Diploma'
               WHEN fe.level = 'M' THEN 'Master'
               WHEN fe.level = 'C' THEN 'Certificate'
               ELSE 'Other'
             END AS level_label,
             COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           WHERE u.is_alumni = true
           GROUP BY level_label
           ORDER BY count DESC`
        );
        degreeLevelDistribution = res.rows;
        
        // Get student lists for each degree level
        for (const row of res.rows) {
          const levelLabel = row.level_label;
          let levelCondition;
          if (levelLabel === 'Bachelor') levelCondition = 'A0';
          else if (levelLabel === 'Advanced Diploma') levelCondition = 'A1';
          else if (levelLabel === 'Master') levelCondition = 'M';
          else if (levelLabel === 'Certificate') levelCondition = 'C';
          else levelCondition = 'OTHER';
          
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             WHERE u.is_alumni = true
               AND fe.level = $1`,
            [levelCondition]
          );
          degreeLevelStudents[levelLabel] = studentRes.rows;
        }
      }
    }

    // Areas of study (degree text grouped) with student lists
    if (totalGraduates > 0) {
      if (filterByGrade && gradeIds.length > 0) {
        const numericGradeIds = gradeIds.map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));
        const res = await pool.query(
          `SELECT fe.degree, COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id
           WHERE u.is_alumni = true
             AND f.grade_id = ANY($1::int[])
           GROUP BY fe.degree
           ORDER BY count DESC
           LIMIT 100`,
          [numericGradeIds]
        );
        areasOfStudy = res.rows;
        
        // Get student lists for each area of study (top 10 only)
        for (const row of res.rows.slice(0, 10)) {
          const degree = row.degree;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND fe.degree = $2`,
            [numericGradeIds, degree]
          );
          areasOfStudyStudents[degree] = studentRes.rows;
        }
      } else if (filterByGrade && gradeId) {
        const res = await pool.query(
          `SELECT fe.degree, COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
           WHERE u.is_alumni = true
           GROUP BY fe.degree
           ORDER BY count DESC
           LIMIT 100`,
          [gradeId]
        );
        areasOfStudy = res.rows;
        
        // Get student lists for each area of study (top 10 only)
        for (const row of res.rows.slice(0, 10)) {
          const degree = row.degree;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             WHERE u.is_alumni = true
               AND f.grade_id = $1
               AND fe.degree = $2`,
            [gradeId, degree]
          );
          areasOfStudyStudents[degree] = studentRes.rows;
        }
      } else {
        const res = await pool.query(
          `SELECT fe.degree, COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           INNER JOIN api_user u ON u.id = fe.alumn_id
           WHERE u.is_alumni = true
           GROUP BY fe.degree
           ORDER BY count DESC
           LIMIT 100`
        );
        areasOfStudy = res.rows;
        
        // Get student lists for each area of study (top 10 only)
        for (const row of res.rows.slice(0, 10)) {
          const degree = row.degree;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             WHERE u.is_alumni = true
               AND fe.degree = $1`,
            [degree]
          );
          areasOfStudyStudents[degree] = studentRes.rows;
        }
      }
    }

    // Colleges attended by country with student lists
    if (totalGraduates > 0) {
      if (filterByGrade && gradeIds.length > 0) {
        const numericGradeIds = gradeIds.map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));
        const res = await pool.query(
          `SELECT COALESCE(c.country, 'Unknown') AS country,
                  COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           LEFT JOIN api_college c ON c.id = fe.college_id
           INNER JOIN api_user u ON u.id = fe.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id
           WHERE u.is_alumni = true
             AND f.grade_id = ANY($1::int[])
           GROUP BY COALESCE(c.country, 'Unknown')
           ORDER BY count DESC
           LIMIT 100`,
          [numericGradeIds]
        );
        collegesByCountry = res.rows;
        
        // Get student lists for each country
        for (const row of res.rows) {
          const country = row.country;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution,
             (SELECT c.college_name FROM api_college c WHERE c.id = fe.college_id LIMIT 1) as college_name
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             LEFT JOIN api_college c ON c.id = fe.college_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND COALESCE(c.country, 'Unknown') = $2`,
            [numericGradeIds, country]
          );
          collegesByCountryStudents[country] = studentRes.rows;
        }
      } else if (filterByGrade && gradeId) {
        const res = await pool.query(
          `SELECT COALESCE(c.country, 'Unknown') AS country,
                  COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           LEFT JOIN api_college c ON c.id = fe.college_id
           INNER JOIN api_user u ON u.id = fe.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
           WHERE u.is_alumni = true
           GROUP BY COALESCE(c.country, 'Unknown')
           ORDER BY count DESC
           LIMIT 100`,
          [gradeId]
        );
        collegesByCountry = res.rows;
        
        // Get student lists for each country
        for (const row of res.rows) {
          const country = row.country;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution,
             (SELECT c.college_education FROM api_college c WHERE c.id = fe.college_id LIMIT 1) as college_name
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             LEFT JOIN api_college c ON c.id = fe.college_id
             WHERE u.is_alumni = true
               AND f.grade_id = $1
               AND COALESCE(c.country, 'Unknown') = $2`,
            [gradeId, country]
          );
          collegesByCountryStudents[country] = studentRes.rows;
        }
      } else {
        const res = await pool.query(
          `SELECT COALESCE(c.country, 'Unknown') AS country,
                  COUNT(DISTINCT fe.alumn_id) AS count
           FROM api_furthereducation fe
           LEFT JOIN api_college c ON c.id = fe.college_id
           INNER JOIN api_user u ON u.id = fe.alumn_id
           WHERE u.is_alumni = true
           GROUP BY COALESCE(c.country, 'Unknown')
           ORDER BY count DESC
           LIMIT 100`
        );
        collegesByCountry = res.rows;
        
        // Get student lists for each country
        for (const row of res.rows) {
          const country = row.country;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT scholarship_details FROM api_furthereducation fe WHERE fe.alumn_id = u.id LIMIT 1) as institution,
             (SELECT c.college_name FROM api_college c WHERE c.id = fe.college_id LIMIT 1) as college_name
             FROM api_furthereducation fe
             INNER JOIN api_user u ON u.id = fe.alumn_id
             LEFT JOIN api_college c ON c.id = fe.college_id
             WHERE u.is_alumni = true
               AND COALESCE(c.country, 'Unknown') = $1`,
            [country]
          );
          collegesByCountryStudents[country] = studentRes.rows;
        }
      }
    }

    // Industry distribution and top employers (employment based) with student lists
    if (totalGraduates > 0) {
      if (filterByGrade && gradeIds.length > 0) {
        const numericGradeIds = gradeIds.map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));
        const industryRes = await pool.query(
          `SELECT COALESCE(e.industry, 'Not specified') AS industry,
                  COUNT(DISTINCT e.alumn_id) AS count
           FROM api_employment e
           INNER JOIN api_user u ON u.id = e.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id
           WHERE u.is_alumni = true
             AND f.grade_id = ANY($1::int[])
           GROUP BY COALESCE(e.industry, 'Not specified')
           ORDER BY count DESC
           LIMIT 100`,
          [numericGradeIds]
        );
        const employerRes = await pool.query(
          `SELECT COALESCE(e.company, 'Not specified') AS company,
                  COUNT(DISTINCT e.alumn_id) AS count
           FROM api_employment e
           INNER JOIN api_user u ON u.id = e.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id
           WHERE u.is_alumni = true
             AND f.grade_id = ANY($1::int[])
           GROUP BY COALESCE(e.company, 'Not specified')
           ORDER BY count DESC
           LIMIT 10`,
          [numericGradeIds]
        );
        industryDistribution = industryRes.rows;
        topEmployers = employerRes.rows;
        
        // Get student lists for each industry (top 10 only)
        for (const row of industryRes.rows.slice(0, 10)) {
          const industry = row.industry;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT e.company FROM api_employment e2 WHERE e2.alumn_id = u.id LIMIT 1) as company
             FROM api_employment e
             INNER JOIN api_user u ON u.id = e.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND COALESCE(e.industry, 'Not specified') = $2`,
            [numericGradeIds, industry]
          );
          industryDistributionStudents[industry] = studentRes.rows;
        }
        
        // Get student lists for each top employer
        for (const row of employerRes.rows) {
          const company = row.company;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             e.title, e.industry
             FROM api_employment e
             INNER JOIN api_user u ON u.id = e.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             WHERE u.is_alumni = true
               AND f.grade_id = ANY($1::int[])
               AND COALESCE(e.company, 'Not specified') = $2`,
            [numericGradeIds, company]
          );
          topEmployersStudents[company] = studentRes.rows;
        }
      } else if (filterByGrade && gradeId) {
        const industryRes = await pool.query(
          `SELECT COALESCE(e.industry, 'Not specified') AS industry,
                  COUNT(DISTINCT e.alumn_id) AS count
           FROM api_employment e
           INNER JOIN api_user u ON u.id = e.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
           WHERE u.is_alumni = true
           GROUP BY COALESCE(e.industry, 'Not specified')
           ORDER BY count DESC
           LIMIT 100`,
          [gradeId]
        );
        const employerRes = await pool.query(
          `SELECT COALESCE(e.company, 'Not specified') AS company,
                  COUNT(DISTINCT e.alumn_id) AS count
           FROM api_employment e
           INNER JOIN api_user u ON u.id = e.alumn_id
           INNER JOIN api_kid k ON k.user_id = u.id
           INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $1
           WHERE u.is_alumni = true
           GROUP BY COALESCE(e.company, 'Not specified')
           ORDER BY count DESC
           LIMIT 10`,
          [gradeId]
        );
        industryDistribution = industryRes.rows;
        topEmployers = employerRes.rows;
        
        // Get student lists for each industry (top 10 only)
        for (const row of industryRes.rows.slice(0, 10)) {
          const industry = row.industry;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT e.company FROM api_employment e2 WHERE e2.alumn_id = u.id LIMIT 1) as company
             FROM api_employment e
             INNER JOIN api_user u ON u.id = e.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             WHERE u.is_alumni = true
               AND f.grade_id = $1
               AND COALESCE(e.industry, 'Not specified') = $2`,
            [gradeId, industry]
          );
          industryDistributionStudents[industry] = studentRes.rows;
        }
        
        // Get student lists for each top employer
        for (const row of employerRes.rows) {
          const company = row.company;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             e.title, e.industry
             FROM api_employment e
             INNER JOIN api_user u ON u.id = e.alumn_id
             INNER JOIN api_kid k ON k.user_id = u.id
             INNER JOIN api_family f ON f.id = k.family_id
             WHERE u.is_alumni = true
               AND f.grade_id = $1
               AND COALESCE(e.company, 'Not specified') = $2`,
            [gradeId, company]
          );
          topEmployersStudents[company] = studentRes.rows;
        }
      } else {
        const industryRes = await pool.query(
          `SELECT COALESCE(e.industry, 'Not specified') AS industry,
                  COUNT(DISTINCT e.alumn_id) AS count
           FROM api_employment e
           INNER JOIN api_user u ON u.id = e.alumn_id
           WHERE u.is_alumni = true
           GROUP BY COALESCE(e.industry, 'Not specified')
           ORDER BY count DESC
           LIMIT 100`
        );
        const employerRes = await pool.query(
          `SELECT COALESCE(e.company, 'Not specified') AS company,
                  COUNT(DISTINCT e.alumn_id) AS count
           FROM api_employment e
           INNER JOIN api_user u ON u.id = e.alumn_id
           WHERE u.is_alumni = true
           GROUP BY COALESCE(e.company, 'Not specified')
           ORDER BY count DESC
           LIMIT 10`
        );
        industryDistribution = industryRes.rows;
        topEmployers = employerRes.rows;
        
        // Get student lists for each industry (top 10 only)
        for (const row of industryRes.rows.slice(0, 10)) {
          const industry = row.industry;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             (SELECT e.company FROM api_employment e2 WHERE e2.alumn_id = u.id LIMIT 1) as company
             FROM api_employment e
             INNER JOIN api_user u ON u.id = e.alumn_id
             WHERE u.is_alumni = true
               AND COALESCE(e.industry, 'Not specified') = $1`,
            [industry]
          );
          industryDistributionStudents[industry] = studentRes.rows;
        }
        
        // Get student lists for each top employer
        for (const row of employerRes.rows) {
          const company = row.company;
          const studentRes = await pool.query(
            `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email,
             e.title, e.industry
             FROM api_employment e
             INNER JOIN api_user u ON u.id = e.alumn_id
             WHERE u.is_alumni = true
               AND COALESCE(e.company, 'Not specified') = $1`,
            [company]
          );
          topEmployersStudents[company] = studentRes.rows;
        }
      }
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
      eitherOutcomeStudents,      // Return list
      degreeStats,
      outcomesByYear,
      degreeLevelDistribution,
      degreeLevelStudents,         // Return detailed lists
      areasOfStudy,
      areasOfStudyStudents,        // Return detailed lists
      collegesByCountry,
      collegesByCountryStudents,   // Return detailed lists
      industryDistribution,
      industryDistributionStudents, // Return detailed lists
      topEmployers,
      topEmployersStudents,        // Return detailed lists
      outcomesByYearStudents,      // Return detailed lists
      filteredByGrade: filterByGrade,
      gradeId: filterByGrade ? (gradeId || gradeIdsParam || null) : null,
    });
  } catch (err) {
    console.error("Error in GET /api/manage/alumni-overview:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
