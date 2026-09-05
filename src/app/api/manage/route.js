import pool from "../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import * as bcrypt from 'bcrypt';

export async function GET() {
    try{
        // Fetch all columns except password
        const users = await pool.query(
            "SELECT id, first_name, rwandan_name, email, username, is_alumni, is_student, is_crc, is_superuser,is_staff,gender, phone FROM api_user"
        );
        const response = users.rows;
        return NextResponse.json(response, { status: 200 });
    }catch(err){
        console.error("Error in GET /api/manage:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { 
            first_name, 
            is_staff,
            rwandan_name, 
            email, 
            username, 
            password, 
            is_student, 
            is_alumni, 
            gender,
            is_crc, 
            is_superuser, 
            phone 
        } = body;

        // Validate required fields
        if (!email || !password || !first_name) {
            return NextResponse.json({ 
                error: "Email, password, and first_name are required" 
            }, { status: 400 });
        }
        if(is_student && is_alumni){
            return NextResponse.json({ 
                error: "User cannot be both a student and an alumni" 
            }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            "SELECT id FROM api_user WHERE email = $1",
            [email]
        );
        const phoneCheck = await pool.query(
            "SELECT id FROM api_user WHERE phone = $1",
            [phone]
        );
       

        if (existingUser.rows.length > 0) {
            return NextResponse.json({ 
                error: "User with this email already exists" 
            }, { status: 409 });
        }

        if (phoneCheck.rows.length > 0) {
            return NextResponse.json({ 
                error: "User with this phone number already exists" 
            }, { status: 409 });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await pool.query(
            `INSERT INTO api_user (
                first_name, rwandan_name, email, password, 
                is_student, is_alumni, is_crc, is_superuser, phone, is_staff, gender
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, first_name, rwandan_name, email, username, 
                      is_alumni, is_student, is_crc, is_superuser, phone, is_staff, gender`,
            [
                first_name || null,
                rwandan_name || null,
                email,
                hashedPassword,
                is_student || false,
                is_alumni || false,
                is_crc || false,
                is_superuser || false,
                phone || null,
                is_staff || false,
                gender || null
            ]
        );

        return NextResponse.json({ 
            success: true, 
            message: "User created successfully",
            user: result.rows[0]
        }, { status: 201 });

    } catch (err) {
        console.error("Error in POST /api/manage:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { 
            id,
            first_name, 
            rwandan_name, 
            email, 
            username, 
            is_staff,
            password, 
            is_student, 
            is_alumni, 
            is_crc, 
            is_superuser, 
            phone,
            gender
        } = body;

        if (!id) {
            return NextResponse.json({ 
                error: "User ID is required" 
            }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await pool.query(
            "SELECT id FROM api_user WHERE id = $1",
            [id]
        );

        if (existingUser.rows.length === 0) {
            return NextResponse.json({ 
                error: "User not found" 
            }, { status: 404 });
        }

        // Check if email is being changed and if it's already taken
        if (email) {
            const emailCheck = await pool.query(
                "SELECT id FROM api_user WHERE email = $1 AND id != $2",
                [email, id]
            );
            if (emailCheck.rows.length > 0) {
                return NextResponse.json({ 
                    error: "Email already taken by another user" 
                }, { status: 409 });
            }
        }
        const isAlumniCheck = is_alumni !== undefined ? is_alumni : existingUser.rows[0].is_alumni;
        const isStudentCheck = is_student !== undefined ? is_student : existingUser.rows[0].is_student;
        
        if(isStudentCheck && isAlumniCheck){
            return NextResponse.json({ 
                error: "User cannot be both a student and an alumni" 
            }, { status: 400 });
        }
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (first_name !== undefined) {
            updateFields.push(`first_name = $${paramCount++}`);
            updateValues.push(first_name);
        }
        if (rwandan_name !== undefined) {
            updateFields.push(`rwandan_name = $${paramCount++}`);
            updateValues.push(rwandan_name);
        }
        if (email !== undefined) {
            updateFields.push(`email = $${paramCount++}`);
            updateValues.push(email);
        }
        if (username !== undefined) {
            updateFields.push(`username = $${paramCount++}`);
            updateValues.push(username);
        }
        if (password !== undefined && password !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push(`password = $${paramCount++}`);
            updateValues.push(hashedPassword);
        }
        if (is_student !== undefined) {
            updateFields.push(`is_student = $${paramCount++}`);
            updateValues.push(is_student);
        }
        if (is_alumni !== undefined) {
            updateFields.push(`is_alumni = $${paramCount++}`);
            updateValues.push(is_alumni);
        }
        if (is_crc !== undefined) {
            updateFields.push(`is_crc = $${paramCount++}`);
            updateValues.push(is_crc);
        }
        if (is_superuser !== undefined) {
            updateFields.push(`is_superuser = $${paramCount++}`);
            updateValues.push(is_superuser);
        }
        if (phone !== undefined) {
            updateFields.push(`phone = $${paramCount++}`);
            updateValues.push(phone);
        }
        if (is_staff !== undefined) {
            updateFields.push(`is_staff = $${paramCount++}`);
            updateValues.push(is_staff);
        }
        if (gender !== undefined) {
            updateFields.push(`gender = $${paramCount++}`);
            updateValues.push(gender);
        }
        if (updateFields.length === 0) {
            return NextResponse.json({ 
                error: "No fields to update" 
            }, { status: 400 });
        }
        updateValues.push(id);
        const whereClause = `id = $${paramCount}`;

        const updateQuery = `
            UPDATE api_user 
            SET ${updateFields.join(', ')}
            WHERE ${whereClause}
            RETURNING id, first_name, rwandan_name, email, username, 
                      is_alumni, is_student, is_crc, is_superuser, phone,
                      is_staff, gender
        `;

        const result = await pool.query(updateQuery, updateValues);

        return NextResponse.json({ 
            success: true, 
            message: "User updated successfully",
            user: result.rows[0]
        }, { status: 200 });

    } catch (err) {
        console.error("Error in PUT /api/manage:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ 
                error: "User ID is required" 
            }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await pool.query(
            "SELECT id, email FROM api_user WHERE id = $1",
            [id]
        );

        if (existingUser.rows.length === 0) {
            return NextResponse.json({ 
                error: "User not found" 
            }, { status: 404 });
        }

        // Delete user
        await pool.query("DELETE FROM api_user WHERE id = $1", [id]);

        return NextResponse.json({ 
            success: true, 
            message: "User deleted successfully"
        }, { status: 200 });

    } catch (err) {
        console.error("Error in DELETE /api/manage:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}