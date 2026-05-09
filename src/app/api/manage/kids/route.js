import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const kids = await pool.query(
      `SELECT k.id, k.origin_district, k.origin_sector, k.current_district_or_city, k.current_country,
              k.health_issue, k.marital_status, k.life_status, k.has_children,
              k.points_in_national_exam, k.maximum_points_in_national_exam, k.mention,
              k.user_id, k.family_id, k.graduation_status,
              u.first_name AS user_first_name, u.rwandan_name AS user_rwandan_name, u.email AS user_email,
              f.family_name, f.family_number
       FROM api_kid k
       LEFT JOIN api_user u ON k.user_id = u.id
       LEFT JOIN api_family f ON k.family_id = f.id
       ORDER BY k.id`
    );
    return NextResponse.json(kids.rows, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/kids:", err);
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
    console.log("has_children", has_children);
    const result = await pool.query(
      `INSERT INTO api_kid (
        origin_district, origin_sector, current_district_or_city, current_country,
        health_issue, marital_status, life_status, has_children,
        points_in_national_exam, maximum_points_in_national_exam, mention,
        user_id, family_id, graduation_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        origin_district ?? null,
        origin_sector ?? null,
        current_district_or_city ?? null,
        current_country ?? null,
        health_issue ?? null,
        marital_status ?? null,
        life_status ?? null,
        has_children ?? null,
        points_in_national_exam ?? null,
        maximum_points_in_national_exam ?? null,
        mention ?? null,
        user_id ?? null,
        family_id ?? null,
        graduation_status ?? null,
      ]
    );
    return NextResponse.json({ success: true, kid: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/manage/kids:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
