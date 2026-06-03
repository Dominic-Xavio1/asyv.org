import { pool } from '@/connection/databaseConnection';
import { NextResponse } from 'next/server';
import { requireSuperuser } from '../requireSuperuser';

export async function GET(request) {
  await requireSuperuser(request);

  const query = `SELECT * FROM api_college ORDER BY id ASC`;
  const { rows } = await pool.query(query);

  return NextResponse.json(rows);
}

export async function POST(request) {
  await requireSuperuser(request, { fromBody: true });
  const body = await request.json();

  const college_name = (body.college_name || '').trim();
  const country = (body.country || '').trim();
  const city = (body.city || '').trim();

  if (!college_name) {
    return NextResponse.json({ error: 'College name is required' }, { status: 400 });
  }

  if (!country) {
    return NextResponse.json({ error: 'Country is required' }, { status: 400 });
  }

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  const insertQuery = `
    INSERT INTO api_college (college_name, country, city)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const { rows } = await pool.query(insertQuery, [college_name, country, city]);
  return NextResponse.json(rows[0]);
}

export async function PUT(request) {
  await requireSuperuser(request, { fromBody: true });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const body = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'College id is required' }, { status: 400 });
  }

  const college_name = (body.college_name || '').trim();
  const country = (body.country || '').trim();
  const city = (body.city || '').trim();

  if (!college_name) {
    return NextResponse.json({ error: 'College name is required' }, { status: 400 });
  }

  if (!country) {
    return NextResponse.json({ error: 'Country is required' }, { status: 400 });
  }

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  const updateQuery = `
    UPDATE api_college
    SET college_name = $1, country = $2, city = $3
    WHERE id = $4
    RETURNING *
  `;
  const { rows } = await pool.query(updateQuery, [college_name, country, city, id]);

  if (!rows.length) {
    return NextResponse.json({ error: 'College record not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(request) {
  await requireSuperuser(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'College id is required' }, { status: 400 });
  }

  const deleteQuery = `DELETE FROM api_college WHERE id = $1 RETURNING *`;
  const { rows } = await pool.query(deleteQuery, [id]);

  if (!rows.length) {
    return NextResponse.json({ error: 'College record not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
