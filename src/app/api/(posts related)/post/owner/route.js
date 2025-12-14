import pool from "../../../../../connection/databaseConnection"
import { NextResponse } from "next/server"


export async function POST(request){
    try{
        const inf =await request.json()
        let userId= Number(inf.userId)

const response = await pool.query("SELECT * FROM api_post WHERE created_by=$1",[userId]);
const data = response.rows
return NextResponse.json({success:true,posts:data,requesteData:userId});
    }catch(err){
        console.log("Error fetching user's post ",err.message)
        return NextResponse.json({message:"Error fetching user's post",error:err.message,dataSend:request.json()})
    }
}