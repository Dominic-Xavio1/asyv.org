import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

export async function POST(request) {
  const auth = await requireSuperuser(request, { fromBody: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const {
      first_name,
      rwandan_name,
      email,
      is_superuser = false,
      is_crc = false,
    } = body;

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM api_user WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // FIXED: Matched column count (5 names = 5 values)
    const result = await pool.query(
      `INSERT INTO api_user (
        first_name, rwandan_name, email, is_superuser, is_crc
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, rwandan_name, email, is_superuser, is_crc`,
      [first_name, rwandan_name, email, is_superuser, is_crc]
    );

    return NextResponse.json({ 
      success: true, 
      user: result.rows[0] 
    }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/manage/users:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let query = `
      SELECT id, first_name, rwandan_name, email, is_superuser, is_crc, is_mama
      FROM api_user 
    `;
    const params = [];
    
    // FIXED: Changed 'AND' to 'WHERE'
    if (search) {
      query += ` WHERE (
        first_name ILIKE $1 OR 
        rwandan_name ILIKE $1 OR 
        email ILIKE $1
      )`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY first_name ASC, rwandan_name ASC`;
    
    const users = await pool.query(query, params);

    // FIXED: Simplified the student (kid) search logic
    let kidResults = [];
    if (search) {
      const kidQuery = `
        SELECT DISTINCT u.id, u.first_name, u.rwandan_name, u.email, 
               u.is_superuser, u.is_crc, u.is_mama
        FROM api_kid k
        JOIN api_user u ON k.user_id = u.id
        WHERE (u.first_name ILIKE $1 OR u.rwandan_name ILIKE $1 OR u.email ILIKE $1)
      `;
      const kidQueryResult = await pool.query(kidQuery, [`%${search}%`]);
      kidResults = kidQueryResult.rows; // Already an array
    }
    
    // Combine results and remove duplicates by ID
    const allResults = [...users.rows, ...kidResults];
    const uniqueResults = allResults.filter((user, index, self) => 
      user.id && index === self.findIndex((u) => u.id === user.id)
    );
    
    return NextResponse.json(uniqueResults, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/manage/users:", err);
    return NextResponse.json({ error: "Internal Server Error",message:err.message }, { status: 500 });
  }
}
