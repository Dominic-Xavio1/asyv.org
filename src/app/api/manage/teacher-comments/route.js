import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

// GET - Fetch teacher comments for a student
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
            `SELECT tc.id, tc.teacher_name, tc.teacher_role, tc.comment, tc.report_id,
                    ar.year, ar.combination, ar.student_id
             FROM teacher_comments tc
             LEFT JOIN academic_reports ar ON tc.report_id = ar.id
             WHERE ar.student_id = $1
             ORDER BY ar.year DESC, tc.id DESC`,
            [studentId]
        );

        return NextResponse.json({ 
            success: true,
            comments: result.rows 
        }, { status: 200 });
    } catch (err) {
        console.error("Error in GET /api/manage/teacher-comments:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// POST - Create new teacher comment
export async function POST(request) {
    try {
        const body = await request.json();
        const { report_id, teacher_name, teacher_role, comment } = body;

        if (!report_id || !teacher_name || !comment) {
            return NextResponse.json({ 
                error: "Report ID, teacher name, and comment are required" 
            }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO teacher_comments (report_id, teacher_name, teacher_role, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING id, report_id, teacher_name, teacher_role, comment`,
            [report_id, teacher_name, teacher_role || null, comment]
        );

        return NextResponse.json({ 
            success: true,
            message: "Teacher comment created successfully",
            comment: result.rows[0]
        }, { status: 201 });
    } catch (err) {
        console.error("Error in POST /api/manage/teacher-comments:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// PUT - Update teacher comment
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, teacher_name, teacher_role, comment } = body;

        if (!id) {
            return NextResponse.json({ 
                error: "Comment ID is required" 
            }, { status: 400 });
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (teacher_name !== undefined) {
            updateFields.push(`teacher_name = $${paramCount++}`);
            updateValues.push(teacher_name);
        }
        if (teacher_role !== undefined) {
            updateFields.push(`teacher_role = $${paramCount++}`);
            updateValues.push(teacher_role);
        }
        if (comment !== undefined) {
            updateFields.push(`comment = $${paramCount++}`);
            updateValues.push(comment);
        }

        if (updateFields.length === 0) {
            return NextResponse.json({ 
                error: "No fields to update" 
            }, { status: 400 });
        }

        updateValues.push(id);
        const whereClause = `id = $${paramCount}`;

        const updateQuery = `
            UPDATE teacher_comments 
            SET ${updateFields.join(', ')}
            WHERE ${whereClause}
            RETURNING id, report_id, teacher_name, teacher_role, comment
        `;

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return NextResponse.json({ 
                error: "Teacher comment not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            message: "Teacher comment updated successfully",
            comment: result.rows[0]
        }, { status: 200 });
    } catch (err) {
        console.error("Error in PUT /api/manage/teacher-comments:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}

// DELETE - Delete teacher comment
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ 
                error: "Comment ID is required" 
            }, { status: 400 });
        }

        // Check if comment exists
        const existingComment = await pool.query(
            "SELECT id FROM teacher_comments WHERE id = $1",
            [id]
        );

        if (existingComment.rows.length === 0) {
            return NextResponse.json({ 
                error: "Teacher comment not found" 
            }, { status: 404 });
        }

        // Delete the comment
        await pool.query("DELETE FROM teacher_comments WHERE id = $1", [id]);

        return NextResponse.json({ 
            success: true,
            message: "Teacher comment deleted successfully"
        }, { status: 200 });
    } catch (err) {
        console.error("Error in DELETE /api/manage/teacher-comments:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}
