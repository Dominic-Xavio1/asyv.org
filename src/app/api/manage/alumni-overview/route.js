import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a reusable WHERE + JOIN clause depending on the active grade filter.
 * Returns { joins, where, params } ready to be embedded in any query.
 *
 * gradeFilter = null           → all alumni, no extra join needed
 * gradeFilter = { single: id } → join family on grade_id = $N
 * gradeFilter = { multi: [...] } → join family, WHERE grade_id = ANY($N)
 */
function buildGradeFilter(gradeFilter, startParamIndex = 1) {
  if (!gradeFilter) {
    return {
      joins: "",
      where: "WHERE u.is_alumni = true",
      familyJoin: "LEFT JOIN api_kid k ON k.user_id = u.id",
      params: [],
      nextParam: startParamIndex,
    };
  }

  if (gradeFilter.single) {
    return {
      joins: `INNER JOIN api_kid k ON k.user_id = u.id
              INNER JOIN api_family f ON f.id = k.family_id AND f.grade_id = $${startParamIndex}`,
      where: "WHERE u.is_alumni = true",
      familyJoin: "",
      params: [gradeFilter.single],
      nextParam: startParamIndex + 1,
    };
  }

  // multi
  return {
    joins: `INNER JOIN api_kid k ON k.user_id = u.id
            INNER JOIN api_family f ON f.id = k.family_id`,
    where: `WHERE u.is_alumni = true AND f.grade_id = ANY($${startParamIndex}::int[])`,
    familyJoin: "",
    params: [gradeFilter.multi],
    nextParam: startParamIndex + 1,
  };
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let userId = request.headers.get("x-user-id");
  if (!userId) {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get("requestingUserId");
    userId = 3007; // dev override – remove in prod
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
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
    : [];

  try {
    // ── User check ────────────────────────────────────────────────────────────
    const userCheck = await pool.query(
      "SELECT is_superuser, is_crc FROM api_user WHERE id = $1",
      [userId]
    );
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { is_superuser, is_crc } = userCheck.rows[0];
    const isSuperuserOrCrc = is_superuser === true || is_crc === true;

    // ── Resolve filter ────────────────────────────────────────────────────────
    let gradeFilter = null;
    if (isSuperuserOrCrc) {
      if (gradeIds.length > 0) gradeFilter = { multi: gradeIds };
      else if (gradeId) gradeFilter = { single: parseInt(gradeId, 10) };
    }

    // ── Build shared SQL fragments ────────────────────────────────────────────
    const gf = buildGradeFilter(gradeFilter);
    // Outcomes-by-year: gf.joins already includes k (+ f) when grade filter is active
    const outcomesYearJoins = gradeFilter
      ? `INNER JOIN api_grade g ON g.id = f.grade_id`
      : `INNER JOIN api_kid k ON k.user_id = u.id
         INNER JOIN api_family f2 ON f2.id = k.family_id
         INNER JOIN api_grade g ON g.id = f2.grade_id`;

    // ── PHASE 1 — fire all top-level aggregate queries in parallel ────────────
    const [
      totalRes,
      feRes,
      empRes,
      eitherCountRes,
      eitherListRes,
      allAlumniRes,
      degreeStatsRes,
      degreeLevelRes,
      areasOfStudyRes,
      collegesByCountryRes,
      industryRes,
      employerRes,
      outcomesByYearRes,
    ] = await Promise.all([
      // 1. Total graduates
      pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count
         FROM api_user u ${gf.joins}
         ${gf.where}`,
        gf.params
      ),

      // 2. Continued education students
      pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email, u.phone,
                k.id AS kid_id,
                (SELECT f2.family_name
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS family,
                (SELECT g2.grade_name
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 LEFT JOIN api_grade g2 ON g2.id = f2.grade_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS grade,
                (SELECT c.college_name
                 FROM api_college c
                 INNER JOIN api_furthereducation fe2 ON c.id = fe2.college_id
                 WHERE fe2.alumn_id = u.id LIMIT 1) AS institution
         FROM api_user u
         ${gf.joins || "LEFT JOIN api_kid k ON k.user_id = u.id"}
         ${gf.where}
           AND EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)`,
        gf.params
      ),

      // 3. Employed students
      pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email, u.phone,
                k.id AS kid_id,
                (SELECT f2.family_name
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS family,
                (SELECT g2.grade_name
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 LEFT JOIN api_grade g2 ON g2.id = f2.grade_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS grade,
                (SELECT e.title FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) AS title,
                (SELECT e.company FROM api_employment e WHERE e.alumn_id = u.id LIMIT 1) AS company
         FROM api_user u
         ${gf.joins || "LEFT JOIN api_kid k ON k.user_id = u.id"}
         ${gf.where}
           AND EXISTS (SELECT 1 FROM api_employment e WHERE e.alumn_id = u.id)`,
        gf.params
      ),

      // 4. Either-outcome COUNT
      pool.query(
        `SELECT COUNT(DISTINCT u.id) AS count
         FROM api_user u ${gf.joins}
         ${gf.where}
           AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
             OR EXISTS (SELECT 1 FROM api_employment e   WHERE e.alumn_id   = u.id))`,
        gf.params
      ),

      // 5. Either-outcome LIST
      pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email, u.phone,
                (SELECT f2.family_name
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS family,
                (SELECT g2.grade_name
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 LEFT JOIN api_grade g2 ON g2.id = f2.grade_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS grade
         FROM api_user u ${gf.joins}
         ${gf.where}
           AND (EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id)
             OR EXISTS (SELECT 1 FROM api_employment e   WHERE e.alumn_id   = u.id))`,
        gf.params
      ),

      // 6. All alumni LIST (including those without outcomes)
      pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email, u.phone,
                k.id AS kid_id,
                (SELECT f2.family_name
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS family,
                (SELECT g2.grade_name
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 LEFT JOIN api_grade g2 ON g2.id = f2.grade_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS grade,
                (SELECT g2.graduation_year_to_asyv
                 FROM api_kid k2
                 INNER JOIN api_family f2 ON f2.id = k2.family_id
                 LEFT JOIN api_grade g2 ON g2.id = f2.grade_id
                 WHERE k2.user_id = u.id
                 LIMIT 1) AS graduation_year
         FROM api_user u
         ${gf.joins || "LEFT JOIN api_kid k ON k.user_id = u.id"}
         ${gf.where}`,
        gf.params
      ),

      // 7. Degree stats (for further education)
      pool.query(
        `SELECT fe.degree, COUNT(DISTINCT fe.alumn_id) AS count
         FROM api_furthereducation fe
         INNER JOIN api_user u ON u.id = fe.alumn_id
         ${gf.joins}
         ${gf.where}
         GROUP BY fe.degree
         ORDER BY count DESC`,
        gf.params
      ),

      // 8. Degree level distribution — with student lists via json_agg (NO loop needed)
      pool.query(
        `SELECT
           CASE
             WHEN fe.level = 'A0' THEN 'Bachelor'
             WHEN fe.level = 'A1' THEN 'Advanced Diploma'
             WHEN fe.level = 'M'  THEN 'Master'
             WHEN fe.level = 'C'  THEN 'Certificate'
             ELSE 'Other'
           END AS level_label,
           COUNT(DISTINCT fe.alumn_id) AS count,
           json_agg(DISTINCT jsonb_build_object(
             'id',          u.id,
             'first_name',  u.first_name,
             'rwandan_name',u.rwandan_name,
             'email',       u.email,
             'institution', fe.scholarship_details
           )) AS students
         FROM api_furthereducation fe
         INNER JOIN api_user u ON u.id = fe.alumn_id
         ${gf.joins}
         ${gf.where}
         GROUP BY level_label
         ORDER BY count DESC`,
        gf.params
      ),

      // 9. Areas of study — top 100 with student lists via json_agg (NO loop needed)
      pool.query(
        `SELECT fe.degree,
                COUNT(DISTINCT fe.alumn_id) AS count,
                json_agg(DISTINCT jsonb_build_object(
                  'id',          u.id,
                  'first_name',  u.first_name,
                  'rwandan_name',u.rwandan_name,
                  'email',       u.email,
                  'institution', fe.scholarship_details
                )) AS students
         FROM api_furthereducation fe
         INNER JOIN api_user u ON u.id = fe.alumn_id
         ${gf.joins}
         ${gf.where}
         GROUP BY fe.degree
         ORDER BY count DESC
         LIMIT 100`,
        gf.params
      ),

      // 10. Colleges by country — with student lists via json_agg (NO loop needed)
      pool.query(
        `SELECT COALESCE(c.country, 'Unknown') AS country,
                COUNT(DISTINCT fe.alumn_id) AS count,
                json_agg(DISTINCT jsonb_build_object(
                  'id',           u.id,
                  'first_name',   u.first_name,
                  'rwandan_name', u.rwandan_name,
                  'email',        u.email,
                  'institution',  fe.scholarship_details,
                  'college_name', c.college_name
                )) AS students
         FROM api_furthereducation fe
         INNER JOIN api_user u ON u.id = fe.alumn_id
         LEFT JOIN api_college c ON c.id = fe.college_id
         ${gf.joins}
         ${gf.where}
         GROUP BY COALESCE(c.country, 'Unknown')
         ORDER BY count DESC
         LIMIT 100`,
        gf.params
      ),

      // 11. Industry distribution — with student lists via json_agg (NO loop needed)
      pool.query(
        `SELECT COALESCE(e.industry, 'Not specified') AS industry,
                COUNT(DISTINCT e.alumn_id) AS count,
                json_agg(DISTINCT jsonb_build_object(
                  'id',           u.id,
                  'first_name',   u.first_name,
                  'rwandan_name', u.rwandan_name,
                  'email',        u.email,
                  'company',      e.company
                )) AS students
         FROM api_employment e
         INNER JOIN api_user u ON u.id = e.alumn_id
         ${gf.joins}
         ${gf.where}
         GROUP BY COALESCE(e.industry, 'Not specified')
         ORDER BY count DESC
         LIMIT 100`,
        gf.params
      ),

      // 12. Top employers — with student lists via json_agg (NO loop needed)
      pool.query(
        `SELECT COALESCE(e.company, 'Not specified') AS company,
                COUNT(DISTINCT e.alumn_id) AS count,
                json_agg(DISTINCT jsonb_build_object(
                  'id',           u.id,
                  'first_name',   u.first_name,
                  'rwandan_name', u.rwandan_name,
                  'email',        u.email,
                  'title',        e.title,
                  'industry',     e.industry
                )) AS students
         FROM api_employment e
         INNER JOIN api_user u ON u.id = e.alumn_id
         ${gf.joins}
         ${gf.where}
         GROUP BY COALESCE(e.company, 'Not specified')
         ORDER BY count DESC
         LIMIT 10`,
        gf.params
      ),

      // 13. Outcomes by year — with all 4 student-list buckets via conditional json_agg (FIXED)
      isSuperuserOrCrc
        ? pool.query(
          `WITH base AS (
               SELECT DISTINCT
                 u.id, u.first_name, u.rwandan_name, u.email,
                 g.graduation_year_to_asyv AS grad_year,
                 EXISTS (SELECT 1 FROM api_furthereducation fe WHERE fe.alumn_id = u.id) AS has_fe,
                 EXISTS (SELECT 1 FROM api_employment      e  WHERE e.alumn_id   = u.id) AS has_emp,
                 (SELECT e2.company
                  FROM api_employment e2 WHERE e2.alumn_id = u.id LIMIT 1) AS company,
                 (SELECT fe2.scholarship_details
                  FROM api_furthereducation fe2 WHERE fe2.alumn_id = u.id LIMIT 1) AS institution
               FROM api_user u
               ${gf.joins}
               ${outcomesYearJoins}
               ${gf.where}
             )
             SELECT
               grad_year,
               COUNT(*)                                                        AS total,
               COUNT(*) FILTER (WHERE has_emp AND NOT has_fe)                 AS employment_only,
               COUNT(*) FILTER (WHERE has_fe  AND NOT has_emp)                AS fe_only,
               COUNT(*) FILTER (WHERE has_emp AND has_fe)                     AS both,
               COUNT(*) FILTER (WHERE NOT has_emp AND NOT has_fe)             AS neither,
               json_agg(DISTINCT jsonb_build_object('id', id, 'first_name', first_name,
                 'rwandan_name', rwandan_name, 'email', email, 'company', company)
               ) FILTER (WHERE has_emp AND NOT has_fe)                        AS employment_only_students,
               json_agg(DISTINCT jsonb_build_object('id', id, 'first_name', first_name,
                 'rwandan_name', rwandan_name, 'email', email, 'institution', institution)
               ) FILTER (WHERE has_fe AND NOT has_emp)                        AS fe_only_students,
               json_agg(DISTINCT jsonb_build_object('id', id, 'first_name', first_name,
                 'rwandan_name', rwandan_name, 'email', email,
                 'company', company, 'institution', institution)
               ) FILTER (WHERE has_emp AND has_fe)                            AS both_students,
               json_agg(DISTINCT jsonb_build_object('id', id, 'first_name', first_name,
                 'rwandan_name', rwandan_name, 'email', email)
               ) FILTER (WHERE NOT has_emp AND NOT has_fe)                    AS neither_students
             FROM base
             GROUP BY grad_year
             ORDER BY grad_year`,
          gf.params
        )
        : Promise.resolve({ rows: [] }),
    ]);

    // ── PHASE 2 — reshape results (pure JS, zero extra DB calls) ─────────────

    const totalGraduates = parseInt(totalRes.rows[0] ? totalRes.rows[0].count : 0, 10);
    const withEitherOutcome = parseInt(eitherCountRes.rows[0] ? eitherCountRes.rows[0].count : 0, 10);

    const continuedEducationStudents = feRes.rows;
    const employedStudents = empRes.rows;
    const eitherOutcomeStudents = eitherListRes.rows;
    const allAlumniStudents = allAlumniRes.rows;

    const continuedEducation = continuedEducationStudents.length;
    const employed = employedStudents.length;

    // Degree level — split distribution array from embedded student lists
    const degreeLevelDistribution = degreeLevelRes.rows.map(function (row) {
      var students = row.students;
      var rest = {};
      for (var key in row) {
        if (key !== 'students') {
          rest[key] = row[key];
        }
      }
      return rest;
    });

    var degreeLevelStudents = {};
    for (var i = 0; i < degreeLevelRes.rows.length; i++) {
      var row = degreeLevelRes.rows[i];
      degreeLevelStudents[row.level_label] = row.students || [];
    }

    // Areas of study — top 100 distribution + top-10 student lists
    const areasOfStudy = areasOfStudyRes.rows.map(function (row) {
      var students = row.students;
      var rest = {};
      for (var key in row) {
        if (key !== 'students') {
          rest[key] = row[key];
        }
      }
      return rest;
    });

    var areasOfStudyStudents = {};
    for (var i = 0; i < Math.min(10, areasOfStudyRes.rows.length); i++) {
      var row = areasOfStudyRes.rows[i];
      areasOfStudyStudents[row.degree] = row.students || [];
    }

    // Colleges by country
    const collegesByCountry = collegesByCountryRes.rows.map(function (row) {
      var students = row.students;
      var rest = {};
      for (var key in row) {
        if (key !== 'students') {
          rest[key] = row[key];
        }
      }
      return rest;
    });

    var collegesByCountryStudents = {};
    for (var i = 0; i < collegesByCountryRes.rows.length; i++) {
      var row = collegesByCountryRes.rows[i];
      collegesByCountryStudents[row.country] = row.students || [];
    }

    // Industry distribution
    const industryDistribution = industryRes.rows.map(function (row) {
      var students = row.students;
      var rest = {};
      for (var key in row) {
        if (key !== 'students') {
          rest[key] = row[key];
        }
      }
      return rest;
    });

    var industryDistributionStudents = {};
    for (var i = 0; i < Math.min(10, industryRes.rows.length); i++) {
      var row = industryRes.rows[i];
      industryDistributionStudents[row.industry] = row.students || [];
    }

    // Top employers
    const topEmployers = employerRes.rows.map(function (row) {
      var students = row.students;
      var rest = {};
      for (var key in row) {
        if (key !== 'students') {
          rest[key] = row[key];
        }
      }
      return rest;
    });

    var topEmployersStudents = {};
    for (var i = 0; i < employerRes.rows.length; i++) {
      var row = employerRes.rows[i];
      topEmployersStudents[row.company] = row.students || [];
    }

    // Outcomes by year
    const outcomesByYear = outcomesByYearRes.rows.map(function (row) {
      var rest = {};
      for (var key in row) {
        if (key !== 'employment_only_students' && key !== 'fe_only_students' && key !== 'both_students' && key !== 'neither_students') {
          rest[key] = row[key];
        }
      }
      return rest;
    });

    var outcomesByYearStudents = {};
    for (var i = 0; i < outcomesByYearRes.rows.length; i++) {
      var row = outcomesByYearRes.rows[i];
      outcomesByYearStudents[row.grad_year] = {
        employment_only: row.employment_only_students || [],
        fe_only: row.fe_only_students || [],
        both: row.both_students || [],
        neither: row.neither_students || []
      };
    }

    // Percentages
    function pct(n) {
      return totalGraduates > 0 ? Math.round((n / totalGraduates) * 100) : 0;
    }
    return NextResponse.json({
      totalGraduates: totalGraduates,
      continuedEducation: continuedEducation,
      employed: employed,
      withEitherOutcome: withEitherOutcome,
      continuedEducationPct: pct(continuedEducation),
      employedPct: pct(employed),
      withEitherOutcomePct: pct(withEitherOutcome),
      continuedEducationStudents: continuedEducationStudents,
      employedStudents: employedStudents,
      eitherOutcomeStudents: eitherOutcomeStudents,
      allAlumniStudents: allAlumniStudents,
      degreeStats: degreeStatsRes.rows,
      outcomesByYear: outcomesByYear,
      degreeLevelDistribution: degreeLevelDistribution,
      degreeLevelStudents: degreeLevelStudents,
      areasOfStudy: areasOfStudy,
      areasOfStudyStudents: areasOfStudyStudents,
      collegesByCountry: collegesByCountry,
      collegesByCountryStudents: collegesByCountryStudents,
      industryDistribution: industryDistribution,
      industryDistributionStudents: industryDistributionStudents,
      topEmployers: topEmployers,
      topEmployersStudents: topEmployersStudents,
      outcomesByYearStudents: outcomesByYearStudents,
      filteredByGrade: gradeFilter !== null,
      gradeId: gradeFilter ? (gradeId || gradeIdsParam || null) : null,
    });
  } catch (err) {
    console.error("Error in GET /api/manage/alumni-overview:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}