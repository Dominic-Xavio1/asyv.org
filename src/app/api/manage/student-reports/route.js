import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

// GET - Fetch student reports
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
            `SELECT id, student_id, title, description, report_file, report_type, created_at, updated_at
             FROM student_reports 
             WHERE student_id = $1 
             ORDER BY created_at DESC`,
            [studentId]
        );

        return NextResponse.json({
            success: true,
            reports: result.rows
        }, { status: 200 });
    } catch (err) {
        console.error("Error in GET /api/manage/student-reports:", err);
        return NextResponse.json({
            error: "Internal Server Error",
            details: err.message
        }, { status: 500 });
    }
}

// POST - Create new student report
export async function POST(request) {
    try {
        // Check superuser permissions
        const authCheck = await requireSuperuser(request);
        if (!authCheck.ok) {
            return NextResponse.json({
                error: authCheck.error
            }, { status: authCheck.status });
        }

        const body = await request.json();
        const { student_id, title, description, report_file, report_type, requestingUserId } = body;

        if (!student_id || !title) {
            return NextResponse.json({
                error: "Student ID and title are required"
            }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO student_reports (student_id, title, description, report_file, report_type, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, student_id, title, description, report_file, report_type, created_at, created_by`,
            [student_id, title, description || null, report_file || null, report_type || 'academic', requestingUserId]
        );

        return NextResponse.json({
            success: true,
            message: "Student report created successfully",
            report: result.rows[0]
        }, { status: 201 });
    } catch (err) {
        console.error("Error in POST /api/manage/student-reports:", err);
        return NextResponse.json({
            error: "Internal Server Error",
            details: err.message
        }, { status: 500 });
    }
}

// PUT - Update student report
export async function PUT(request) {
    try {
        // Check superuser permissions
        const authCheck = await requireSuperuser(request);
        if (!authCheck.ok) {
            return NextResponse.json({
                error: authCheck.error
            }, { status: authCheck.status });
        }

        const body = await request.json();
        console.log("Body ", body);
        const { id, title, description, report_file, report_type, requestingUserId } = body;

        if (!id) {
            return NextResponse.json({
                error: "Report ID is required"
            }, { status: 400 });
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${paramCount++}`);
            updateValues.push(title);
        }
        if (description !== undefined) {
            updateFields.push(`description = $${paramCount++}`);
            updateValues.push(description);
        }
        if (report_file !== undefined) {
            updateFields.push(`report_file = $${paramCount++}`);
            updateValues.push(report_file);
        }
        if (report_type !== undefined) {
            updateFields.push(`report_type = $${paramCount++}`);
            updateValues.push(report_type);
        }

        if (updateFields.length === 0) {
            return NextResponse.json({
                error: "No fields to update"
            }, { status: 400 });
        }

        updateValues.push(id);
        const whereClause = `id = $${paramCount}`;

        const updateQuery = `
            UPDATE student_reports 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE ${whereClause}
            RETURNING id, student_id, title, description, report_file, report_type, created_at, updated_at
        `;

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return NextResponse.json({
                error: "Student report not found"
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Student report updated successfully",
            report: result.rows[0]
        }, { status: 200 });
    } catch (err) {
        console.error("Error in PUT /api/manage/student-reports:", err);
        return NextResponse.json({
            error: "Internal Server Error",
            details: err.message
        }, { status: 500 });
    }
}

// DELETE - Delete student report
export async function DELETE(request) {
    try {
        // Check superuser permissions
        const authCheck = await requireSuperuser(request);
        if (!authCheck.ok) {
            return NextResponse.json({
                error: authCheck.error
            }, { status: authCheck.status });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({
                error: "Report ID is required"
            }, { status: 400 });
        }

        // Check if report exists
        const existingReport = await pool.query(
            "SELECT id FROM student_reports WHERE id = $1",
            [id]
        );

        if (existingReport.rows.length === 0) {
            return NextResponse.json({
                error: "Student report not found"
            }, { status: 404 });
        }

        // Delete the report
        await pool.query("DELETE FROM student_reports WHERE id = $1", [id]);

        return NextResponse.json({
            success: true,
            message: "Student report deleted successfully"
        }, { status: 200 });
    } catch (err) {
        console.error("Error in DELETE /api/manage/student-reports:", err);
        return NextResponse.json({
            error: "Internal Server Error",
            details: err.message
        }, { status: 500 });
    }
}
