import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireAlumni } from "../requireAlumni";

/**
 * PUT - Create or update api_kid: only current_country and marital_status.
 * Alumni can only modify their own kid (user_id = their id).
 */
export async function PUT(request) {
  const auth = await requireAlumni(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;
  try {
    const body = await request.json();
    const { userId: bodyUserId, current_country, marital_status } = body;
    if (bodyUserId && String(bodyUserId) !== userId) {
      return NextResponse.json({ error: "Can only update your own profile" }, { status: 403 });
    }

    const existing = await pool.query("SELECT id FROM api_kid WHERE user_id = $1 LIMIT 1", [userId]);

    if (existing.rows.length > 0) {
      const kidId = existing.rows[0].id;
      const updates = [];
      const values = [];
      let i = 1;
      if (current_country !== undefined) {
        updates.push(`current_country = $${i++}`);
        values.push(current_country);
      }
      if (marital_status !== undefined) {
        updates.push(`marital_status = $${i++}`);
        values.push(marital_status);
      }
      if (updates.length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }
      values.push(kidId);
      const res = await pool.query(
        `UPDATE api_kid SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, user_id, current_country, marital_status`,
        values
      );
      return NextResponse.json({ success: true, kid: res.rows[0] }, { status: 200 });
    }

    const insert = await pool.query(
      `INSERT INTO api_kid (user_id, current_country, marital_status) VALUES ($1, $2, $3)
       RETURNING id, user_id, current_country, marital_status`,
      [userId, current_country ?? null, marital_status ?? null]
    );
    return NextResponse.json({ success: true, kid: insert.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error in PUT /api/alumni/kid:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
