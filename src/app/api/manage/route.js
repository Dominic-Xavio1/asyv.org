import pool from "../../../connection/databaseConnection";
import { NextResponse } from "next/server";


export async function GET() {
    try{
const users = await pool.query("SELECT id, first_name, rwandan_name, email,is_alumni,is_student,phone FROM api_user");
const response  = users.rows;
return NextResponse.json(response, { status: 200 });
    }catch(err){
        console.error("Error in GET /api/manage:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}