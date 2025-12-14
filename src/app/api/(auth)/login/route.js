import pool from '../../../../connection/databaseConnection';
import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const res = await pool.query(
      "SELECT * FROM api_user WHERE email = $1",
      [email]
    );
    const user = res.rows[0];

    if (!user) {
      return NextResponse.json({ error: "Incorrect Email" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect Password" }, { status: 401 });
    }
    delete user.password;   
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
const fullInfo = user;
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        second_name: user?.rwandan_name
      },
      fullInfo,
      token
    });
  } catch (e) {
    console.error("Database error on login", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function GET(){
  const password = await bcrypt.hash("frankline",10);
  return NextResponse.json({message:"Hello World",password:password});
}
