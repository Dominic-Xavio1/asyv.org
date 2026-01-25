import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

// GET - Fetch academic reports for a student
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ 
                error: "Student ID is required" 
            }, { status: 400 });
        }

        const result = await pool.query(
            `SELECT id, student_id, year, combination, report_card, grade 
             FROM academic_reports 
             WHERE student_id = $1 
             ORDER BY year DESC`,
            [studentId]
        );

        return NextResponse.json({ 
            success: true,
            reports: result.rows 
        }, { status: 200 });
    } catch (err) {
        console.error("Error in GET /api/manage/academic-reports:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// POST - Create new academic report
export async function POST(request) {
    try {
        const body = await request.json();
        const { student_id, year, combination, report_card, grade } = body;

        if (!student_id || !year) {
            return NextResponse.json({ 
                error: "Student ID and year are required" 
            }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO academic_reports (student_id, year, combination, report_card, grade)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, student_id, year, combination, report_card, grade`,
            [student_id, year, combination || null, report_card || null, grade || null]
        );

        return NextResponse.json({ 
            success: true,
            message: "Academic report created successfully",
            report: result.rows[0]
        }, { status: 201 });
    } catch (err) {
        console.error("Error in POST /api/manage/academic-reports:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// PUT - Update academic report
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, year, combination, report_card, grade } = body;

        if (!id) {
            return NextResponse.json({ 
                error: "Report ID is required" 
            }, { status: 400 });
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (year !== undefined) {
            updateFields.push(`year = $${paramCount++}`);
            updateValues.push(year);
        }
        if (combination !== undefined) {
            updateFields.push(`combination = $${paramCount++}`);
            updateValues.push(combination);
        }
        if (report_card !== undefined) {
            updateFields.push(`report_card = $${paramCount++}`);
            updateValues.push(report_card);
        }
        if (grade !== undefined) {
            updateFields.push(`grade = $${paramCount++}`);
            updateValues.push(grade);
        }

        if (updateFields.length === 0) {
            return NextResponse.json({ 
                error: "No fields to update" 
            }, { status: 400 });
        }

        updateValues.push(id);
        const whereClause = `id = $${paramCount}`;

        const updateQuery = `
            UPDATE academic_reports 
            SET ${updateFields.join(', ')}
            WHERE ${whereClause}
            RETURNING id, student_id, year, combination, report_card, grade
        `;

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return NextResponse.json({ 
                error: "Academic report not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            message: "Academic report updated successfully",
            report: result.rows[0]
        }, { status: 200 });
    } catch (err) {
        console.error("Error in PUT /api/manage/academic-reports:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// DELETE - Delete academic report
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ 
                error: "Report ID is required" 
            }, { status: 400 });
        }

        // Check if report exists
        const existingReport = await pool.query(
            "SELECT id FROM academic_reports WHERE id = $1",
            [id]
        );

        if (existingReport.rows.length === 0) {
            return NextResponse.json({ 
                error: "Academic report not found" 
            }, { status: 404 });
        }

        // Delete the report
        await pool.query("DELETE FROM academic_reports WHERE id = $1", [id]);

        return NextResponse.json({ 
            success: true,
            message: "Academic report deleted successfully"
        }, { status: 200 });
    } catch (err) {
        console.error("Error in DELETE /api/manage/academic-reports:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}
