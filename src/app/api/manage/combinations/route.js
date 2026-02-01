import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await pool.query(
      "SELECT * FROM api_combination ORDER BY id"
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/combinations:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
