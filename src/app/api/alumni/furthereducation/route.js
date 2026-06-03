import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireAlumni } from "../requireAlumni";

/**
 * GET - Fetch further education for alumni. Only their own records.
 */
export async function GET(request) {
  const auth = await requireAlumni(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await pool.query(
      `SELECT fe.id, fe.degree, fe.level, fe.status, fe.scholarship, fe.scholarship_details, fe.enrolled, fe.college_id,
              c.college_name, c.country, c.city
       FROM api_furthereducation fe
       LEFT JOIN api_college c ON fe.college_id = c.id
       WHERE fe.alumn_id = $1 ORDER BY fe.id DESC`,
      [auth.userId]
    );
    return NextResponse.json({ success: true, furtherEducation: result.rows }, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/alumni/furthereducation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST - Create further education. alumn_id must equal requesting user.
 */
export async function POST(request) {
  const auth = await requireAlumni(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const { alumn_id, degree, level, status, scholarship, scholarship_details, enrolled, college_id, college } = body;

    if (alumn_id && String(alumn_id) !== auth.userId) {
      return NextResponse.json({ error: "Can only create for yourself" }, { status: 403 });
    }
    const alumnId = auth.userId;

    if (!degree) {
      return NextResponse.json({ error: "Degree is required" }, { status: 400 });
    }

    let finalCollegeId = college_id || null;
    if (!finalCollegeId && college && (college.college_name || college.country || college.city)) {
      const colRes = await pool.query(
        `INSERT INTO api_college (college_name, country, city) VALUES ($1, $2, $3) RETURNING id`,
        [college.college_name || null, college.country || null, college.city || null]
      );
      finalCollegeId = colRes.rows[0].id;
    }

    const insertRes = await pool.query(
      `INSERT INTO api_furthereducation (alumn_id, degree, level, status, scholarship, scholarship_details, enrolled, college_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, alumn_id, degree, level, status, scholarship, scholarship_details, enrolled, college_id`,
      [alumnId, degree, level || null, status || null, scholarship || null, scholarship_details || null, enrolled !== undefined ? enrolled : false, finalCollegeId]
    );
    return NextResponse.json({ success: true, furtherEducation: insertRes.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/alumni/furthereducation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT - Update further education. Must belong to requesting user.
 */
export async function PUT(request) {
  const auth = await requireAlumni(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const { id, degree, level, status, scholarship, scholarship_details, enrolled, college_id, college } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const owner = await pool.query("SELECT alumn_id FROM api_furthereducation WHERE id = $1", [id]);
    if (owner.rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    if (String(owner.rows[0].alumn_id) !== auth.userId) {
      return NextResponse.json({ error: "Can only update your own records" }, { status: 403 });
    }

    let finalCollegeId = college_id;
    if (college) {
      const fe = await pool.query("SELECT college_id FROM api_furthereducation WHERE id = $1", [id]);
      const currentCollegeId = fe.rows[0]?.college_id;
      if (currentCollegeId) {
        const updateFields = [];
        const updateValues = [];
        let p = 1;
        if (college.college_name !== undefined) { updateFields.push(`college_name = $${p++}`); updateValues.push(college.college_name); }
        if (college.country !== undefined) { updateFields.push(`country = $${p++}`); updateValues.push(college.country); }
        if (college.city !== undefined) { updateFields.push(`city = $${p++}`); updateValues.push(college.city); }
        if (updateFields.length > 0) {
          updateValues.push(currentCollegeId);
          await pool.query(`UPDATE api_college SET ${updateFields.join(", ")} WHERE id = $${p}`, updateValues);
        }
        finalCollegeId = currentCollegeId;
      } else if (college.college_name || college.country || college.city) {
        const colRes = await pool.query(
          `INSERT INTO api_college (college_name, country, city) VALUES ($1, $2, $3) RETURNING id`,
          [college.college_name || null, college.country || null, college.city || null]
        );
        finalCollegeId = colRes.rows[0].id;
      }
    }

    const updateFields = [];
    const updateValues = [];
    let param = 1;
    if (degree !== undefined) { updateFields.push(`degree = $${param++}`); updateValues.push(degree); }
    if (level !== undefined) { updateFields.push(`level = $${param++}`); updateValues.push(level); }
    if (status !== undefined) { updateFields.push(`status = $${param++}`); updateValues.push(status); }
    if (scholarship !== undefined) { updateFields.push(`scholarship = $${param++}`); updateValues.push(scholarship); }
    if (scholarship_details !== undefined) { updateFields.push(`scholarship_details = $${param++}`); updateValues.push(scholarship_details); }
    if (enrolled !== undefined) { updateFields.push(`enrolled = $${param++}`); updateValues.push(enrolled); }
    if (finalCollegeId !== undefined) { updateFields.push(`college_id = $${param++}`); updateValues.push(finalCollegeId); }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    updateValues.push(id);
    const res = await pool.query(
      `UPDATE api_furthereducation SET ${updateFields.join(", ")} WHERE id = $${param} RETURNING id, alumn_id, degree, level, status, scholarship, scholarship_details, enrolled, college_id`,
      updateValues
    );
    return NextResponse.json({ success: true, furtherEducation: res.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error in PUT /api/alumni/furthereducation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
