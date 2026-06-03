import pool from "../../../../../connection/databaseConnection";

import { NextResponse } from "next/server";

import { requireSuperuser } from "../../requireSuperuser";



export async function GET(request, { params }) {

  const auth = await requireSuperuser(request);

  if (!auth.ok) {

    return NextResponse.json({ error: auth.error }, { status: auth.status });

  }

  const { kidId } = await params;
  console.log("The sent kid Id is this one ", kidId);
  if (!kidId) {

    return NextResponse.json({ error: "Kid ID required" }, { status: 400 });
  }

  try {

    const kidResult = await pool.query(

      `SELECT k.*,

              u.first_name AS user_first_name, u.rwandan_name AS user_rwandan_name, u.email AS user_email,

              u.username AS user_username

       FROM api_kid k

       LEFT JOIN api_user u ON k.user_id = u.id

       WHERE k.id = $1`,

      [kidId]

    );

    if (kidResult.rows.length === 0) {

      return NextResponse.json({ error: "Kid not found" }, { status: 404 });

    }

    const kid = kidResult.rows[0];
    console.log("Kid data:", kid);
    let family = null;
    let grade = null;
    let familyId = null;

    if (kid.family_id) {

      const familyResult = await pool.query(

        `SELECT f.*, u.first_name AS mother_first_name, u.rwandan_name AS mother_rwandan_name

         FROM api_family f

         LEFT JOIN api_user u ON f.mother_id = u.id

         WHERE f.id = $1`,

        [kid.family_id]

      );
      if (familyResult.rows.length > 0) {
        family = familyResult.rows[0];

        if (family.grade_id) {

          const gradeResult = await pool.query(

            "SELECT * FROM api_grade WHERE id = $1",

            [family.grade_id]

          );

          if (gradeResult.rows.length > 0) {

            grade = gradeResult.rows[0];

          }

        }

      }

    }



    const academicsResult = await pool.query(

      `SELECT ka.*, c.combination_name, c.abbreviation

       FROM api_kidacademics ka

       LEFT JOIN api_combination c ON ka.combination_id = c.id

       WHERE ka.kid_id = $1

       ORDER BY ka.academic_year DESC, ka.id`,

      [kidId]

    );

    const academics = academicsResult.rows;



    // Fetch further education details
    const furtherEducationResult = await pool.query(
      `SELECT fe.*, c.college_name 
       FROM api_furthereducation fe 
       LEFT JOIN api_college c ON c.id = fe.college_id
       WHERE fe.alumn_id = $1`,
      [kid.user_id]
    );
    const furtherEducation = furtherEducationResult.rows;

    // Fetch employment details
    const employmentResult = await pool.query(
      `SELECT e.* 
       FROM api_employment e 
       WHERE e.alumn_id = $1`,
      [kid.user_id]
    );
    const employment = employmentResult.rows;



    return NextResponse.json({

      kid,

      family,

      grade,

      academics,

      furtherEducation,

      employment,

    }, { status: 200 });

  } catch (err) {

    console.error("Error in GET /api/manage/kids/[kidId]:", err);

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });

  }

}



export async function PUT(request, { params }) {

  const auth = await requireSuperuser(request, { fromBody: true });

  if (!auth.ok) {

    return NextResponse.json({ error: auth.error }, { status: auth.status });

  }

  const { kidId } = await params;

  if (!kidId) {

    return NextResponse.json({ error: "Kid ID required" }, { status: 400 });

  }

  try {

    const body = await request.json();

    const {

      requestingUserId,

      origin_district,

      origin_sector,

      current_district_or_city,

      current_country,

      health_issue,

      marital_status,

      life_status,

      has_children,

      points_in_national_exam,

      maximum_points_in_national_exam,

      mention,

      user_id,

      family_id,

      graduation_status,

    } = body;



    const existing = await pool.query("SELECT id FROM api_kid WHERE id = $1", [kidId]);

    if (existing.rows.length === 0) {

      return NextResponse.json({ error: "Kid not found" }, { status: 404 });

    }



    const updates = [];

    const values = [];

    let i = 1;

    const set = (col, val) => {

      if (val !== undefined) {

        updates.push(`${col} = $${i++}`);

        values.push(val);

      }

    };

    set("origin_district", origin_district);

    set("origin_sector", origin_sector);

    set("current_district_or_city", current_district_or_city);

    set("current_country", current_country);

    set("health_issue", health_issue);

    set("marital_status", marital_status);

    set("life_status", life_status);

    set("has_children", has_children);

    set("points_in_national_exam", points_in_national_exam);

    set("maximum_points_in_national_exam", maximum_points_in_national_exam);

    set("mention", mention);

    set("user_id", user_id);

    set("family_id", family_id);

    set("graduation_status", graduation_status);



    if (updates.length === 0) {

      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    }

    values.push(kidId);

    const result = await pool.query(

      `UPDATE api_kid SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,

      values

    );

    return NextResponse.json({ success: true, kid: result.rows[0] }, { status: 200 });

  } catch (err) {

    console.error("Error in PUT /api/manage/kids/[kidId]:", err);

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });

  }

}



export async function DELETE(request, { params }) {

  const auth = await requireSuperuser(request);

  if (!auth.ok) {

    return NextResponse.json({ error: auth.error }, { status: auth.status });

  }

  const { kidId } = await params;

  if (!kidId) {

    return NextResponse.json({ error: "Kid ID requir" }, { status: 400 });

  }

  try {

    const existing = await pool.query("SELECT id FROM api_kid WHERE id = $1", [kidId]);

    if (existing.rows.length === 0) {

      return NextResponse.json({ error: "Kid not found" }, { status: 404 });

    }

    await pool.query("DELETE FROM api_kidacademics WHERE kid_id = $1", [kidId]);

    await pool.query("DELETE FROM api_kid WHERE id = $1", [kidId]);

    return NextResponse.json({ success: true, message: "Kid deleted" }, { status: 200 });

  } catch (err) {

    console.error("Error in DELETE /api/manage/kids/[kidId]:", err);

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });

  }

}

