import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ 
                error: "User ID is required" 
            }, { status: 400 });
        }

        
        // Fetch user basic information
        const userResult = await pool.query(
            `SELECT id, first_name, rwandan_name, email, username, is_alumni, 
                    is_student, is_crc, is_superuser, is_staff, gender, phone 
             FROM api_user 
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ 
                error: "User not found" 
            }, { status: 404 });
        }

        const user = userResult.rows[0];
        const response = { user };

        // If user is alumni, fetch employment data
        if (user.is_alumni) {
            const kidResult = await pool.query(
                `SELECT id, current_country, marital_status 
                 FROM api_kid 
                 WHERE user_id = $1 LIMIT 1`,
                [userId]
            );
            if (kidResult.rows.length > 0) {
                response.kid = kidResult.rows[0];
                
                const leapResult = await pool.query(
                    `SELECT kl.id, kl.kid_id, kl.leap_id, l.ep, l.leap_category 
                     FROM api_kidleap kl JOIN api_leap l ON kl.leap_id = l.id
                     WHERE kl.kid_id = $1 ORDER BY kl.id`,
                    [response.kid.id]
                );
                response.kidLeap = leapResult.rows;
                console.log("Kid Leap Data:", leapResult.rows);
            }

            const employmentResult = await pool.query(
                `SELECT id, title, industry, company, on_going, alumn_id 
                 FROM api_employment 
                 WHERE alumn_id = $1
                 ORDER BY id DESC`,
                [userId]
            );
            const educationResult = await pool.query(
                `SELECT fe.id, fe.degree, fe.level, fe.scholarship,fe.scholarship_details,fe.enrolled,c.college_name,c.country,c.city
                 FROM api_furthereducation AS fe JOIN api_college AS c ON fe.college_id = c.id
                 WHERE fe.alumn_id = $1`,
                [userId]
            );
            if(educationResult.rows.length>0){
                response.furtherEducation = educationResult.rows;
            }
            response.employment = employmentResult.rows;
            console.log("Employment Data:", employmentResult.rows);
            console.log("Further Education Data:", educationResult.rows);

        }

        // If user is student, fetch academic data
        if (user.is_student) {
            // Fetch academic reports
            const academicReportsResult = await pool.query(
                `SELECT report_id, student_id, year, combination, report_card, grade 
                 FROM academic_reports 
                 WHERE student_id = $1 
                 ORDER BY year DESC`,
                [userId]
            );
            response.academicReports = academicReportsResult.rows;

            // Fetch teacher comments (join with academic_reports to get report_id)
            const teacherCommentsResult = await pool.query(
                `SELECT tc.comment_id, tc.teacher_name, tc.teacher_role, tc.comment, tc.report_id,
                        ar.year, ar.combination, ar.student_id
                 FROM teacher_comments tc
                 LEFT JOIN academic_reports ar ON tc.report_id = ar.report_id
                 WHERE ar.student_id = $1
                 ORDER BY ar.year DESC, tc.report_id DESC`,
                [userId]
            );
            response.teacherComments = teacherCommentsResult.rows;
        }

        return NextResponse.json(response, { status: 200 });
    } catch (err) {
        console.error("Error in GET /api/manage/details:", err);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: err.message 
        }, { status: 500 });
    }
}
