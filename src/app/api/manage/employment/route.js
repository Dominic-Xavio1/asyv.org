import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

// GET - Fetch employment records for an alumni
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const alumnId = searchParams.get('alumnId');

        if (!alumnId) {
            return NextResponse.json({ 
                error: "Alumni ID is required" 
            }, { status: 400 });
        }

        const result = await pool.query(
            `SELECT id, title, industry, company, ongoing, alumn_id 
             FROM api_employment 
             WHERE alumn_id = $1
             ORDER BY id DESC`,
            [alumnId]
        );

        return NextResponse.json({ 
            success: true,
            employment: result.rows 
        }, { status: 200 });
    } catch (err) {
        console.error("Error in GET /api/manage/employment:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// POST - Create new employment record
export async function POST(request) {
    try {
        const body = await request.json();
        const { alumn_id, title, industry, company, ongoing } = body;

        if (!alumn_id || !title) {
            return NextResponse.json({ 
                error: "Alumni ID and title are required" 
            }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO api_employment (alumn_id, title, industry, company, ongoing)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, title, industry, company, ongoing, alumn_id`,
            [
                alumn_id, 
                title, 
                industry || null, 
                company || null, 
                ongoing !== undefined ? ongoing : false
            ]
        );

        return NextResponse.json({ 
            success: true,
            message: "Employment record created successfully",
            employment: result.rows[0]
        }, { status: 201 });
    } catch (err) {
        console.error("Error in POST /api/manage/employment:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// PUT - Update employment record
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, title, industry, company, ongoing } = body;

        if (!id) {
            return NextResponse.json({ 
                error: "Employment ID is required" 
            }, { status: 400 });
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${paramCount++}`);
            updateValues.push(title);
        }
        if (industry !== undefined) {
            updateFields.push(`industry = $${paramCount++}`);
            updateValues.push(industry);
        }
        if (company !== undefined) {
            updateFields.push(`company = $${paramCount++}`);
            updateValues.push(company);
        }
        if (ongoing !== undefined) {
            updateFields.push(`ongoing = $${paramCount++}`);
            updateValues.push(ongoing);
        }

        if (updateFields.length === 0) {
            return NextResponse.json({ 
                error: "No fields to update" 
            }, { status: 400 });
        }

        updateValues.push(id);
        const whereClause = `id = $${paramCount}`;

        const updateQuery = `
            UPDATE api_employment 
            SET ${updateFields.join(', ')}
            WHERE ${whereClause}
            RETURNING id, title, industry, company, ongoing, alumn_id
        `;

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return NextResponse.json({ 
                error: "Employment record not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            message: "Employment record updated successfully",
            employment: result.rows[0]
        }, { status: 200 });
    } catch (err) {
        console.error("Error in PUT /api/manage/employment:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// DELETE - Delete employment record
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ 
                error: "Employment ID is required" 
            }, { status: 400 });
        }

        // Check if employment exists
        const existingEmployment = await pool.query(
            "SELECT id FROM api_employment WHERE id = $1",
            [id]
        );

        if (existingEmployment.rows.length === 0) {
            return NextResponse.json({ 
                error: "Employment record not found" 
            }, { status: 404 });
        }

        // Delete the employment record
        await pool.query("DELETE FROM api_employment WHERE id = $1", [id]);

        return NextResponse.json({ 
            success: true,
            message: "Employment record deleted successfully"
        }, { status: 200 });
    } catch (err) {
        console.error("Error in DELETE /api/manage/employment:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}
