import pool from '../../../../connection/databaseConnection'
import { NextResponse } from 'next/server'


export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const alumnId = searchParams.get('alumnId');

       

        if (alumnId) {
            const q = `SELECT fe.id, fe.degree, fe.level, fe.scholarship, fe.scholarship_details, fe.enrolled, fe.college_id, c.college_name, c.country, c.city
                       FROM api_furthereducation AS fe
                       LEFT JOIN api_college AS c ON fe.college_id = c.id
                       WHERE fe.alumn_id = $1
                       ORDER BY fe.id DESC`;
            const result = await pool.query(q, [alumnId]);
            return NextResponse.json({ success: true, furtherEducation: result.rows }, { status: 200 });
        }

        // fallback: return all with joined user name and college details
        const response = await pool.query(
            `SELECT fe.id, fe.alumn_id, fe.degree, fe.level, fe.scholarship, fe.scholarship_details, fe.enrolled, fe.college_id,
                    c.college_name, c.country, c.city,
                    u.rwandan_name, u.first_name
             FROM api_furthereducation AS fe
             JOIN api_user AS u ON fe.alumn_id = u.id
             LEFT JOIN api_college AS c ON fe.college_id = c.id`
        );
        const data = response.rows;
        return NextResponse.json({ success: true, furtherEducation: data }, { status: 200 });
    } catch (error) {
        console.error('Error fetching further education data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - create further education (and optionally college)
export async function POST(request) {
    try {
        const body = await request.json();
        const { alumn_id, degree, level, scholarship, scholarship_details, enrolled, college_id, college } = body;

        if (!alumn_id || !degree) {
            return NextResponse.json({ error: 'Alumni ID and degree are required' }, { status: 400 });
        }

        let finalCollegeId = college_id || null;
        if (!finalCollegeId && college && (college.college_name || college.country || college.city)) {
            const colRes = await pool.query(
                `INSERT INTO api_college (college_name, country, city) VALUES ($1, $2, $3) RETURNING id`,
                [college.college_name || null, college.country || null, college.city || null]
            );
            finalCollegeId = colRes.rows[0].id;
        }

        const insertRes = await pool.query(
            `INSERT INTO api_furthereducation (alumn_id, degree, level, scholarship, scholarship_details, enrolled, college_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, alumn_id, degree, level, scholarship, scholarship_details, enrolled, college_id`,
            [alumn_id, degree, level || null, scholarship || null, scholarship_details || null, enrolled !== undefined ? enrolled : false, finalCollegeId]
        );

        const fe = insertRes.rows[0];
        let collegeRow = null;
        if (fe.college_id) {
            const c = await pool.query('SELECT id, college_name, country, city FROM api_college WHERE id = $1', [fe.college_id]);
            collegeRow = c.rows[0] || null;
        }

        return NextResponse.json({ success: true, message: 'Further education created', furtherEducation: fe, college: collegeRow }, { status: 201 });
    } catch (error) {
        console.error('Error creating further education:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

// PUT - update further education and optionally its college
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, degree, level, scholarship, scholarship_details, alumn_id, enrolled, college_id, college } = body;

        if (!id) {
            return NextResponse.json({ error: 'FurtherEducation ID is required' }, { status: 400 });
        }

        // handle college create/update
        let finalCollegeId = college_id || null;
        if (college) {
            if (finalCollegeId) {
                // update existing college
                const updateFields = [];
                const updateValues = [];
                let p = 1;
                if (college.college_name !== undefined) { updateFields.push(`college_name = $${p++}`); updateValues.push(college.college_name); }
                if (college.country !== undefined) { updateFields.push(`country = $${p++}`); updateValues.push(college.country); }
                if (college.city !== undefined) { updateFields.push(`city = $${p++}`); updateValues.push(college.city); }
                if (updateFields.length > 0) {
                    updateValues.push(finalCollegeId);
                    await pool.query(`UPDATE api_college SET ${updateFields.join(', ')} WHERE id = $${p}`, updateValues);
                }
            } else if (college.college_name || college.country || college.city) {
                const colRes = await pool.query(
                    `INSERT INTO api_college (college_name, country, city) VALUES ($1, $2, $3) RETURNING id`,
                    [college.college_name || null, college.country || null, college.city || null]
                );
                finalCollegeId = colRes.rows[0].id;
            }
        }

        const updateFields = [];
        const updateValues = [];
        let param = 1;
        if (alumn_id !== undefined) { updateFields.push(`alumn_id = $${param++}`); updateValues.push(alumn_id); }
        if (degree !== undefined) { updateFields.push(`degree = $${param++}`); updateValues.push(degree); }
        if (level !== undefined) { updateFields.push(`level = $${param++}`); updateValues.push(level); }
        if (scholarship !== undefined) { updateFields.push(`scholarship = $${param++}`); updateValues.push(scholarship); }
        if (scholarship_details !== undefined) { updateFields.push(`scholarship_details = $${param++}`); updateValues.push(scholarship_details); }
        if (enrolled !== undefined) { updateFields.push(`enrolled = $${param++}`); updateValues.push(enrolled); }
        if (finalCollegeId !== undefined) { updateFields.push(`college_id = $${param++}`); updateValues.push(finalCollegeId); }

        if (updateFields.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        updateValues.push(id);
        const q = `UPDATE api_furthereducation SET ${updateFields.join(', ')} WHERE id = $${param} RETURNING id, alumn_id, degree, level, scholarship, scholarship_details, enrolled, college_id`;
        const res = await pool.query(q, updateValues);
        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Further education record not found' }, { status: 404 });
        }

        const fe = res.rows[0];
        let collegeRow = null;
        if (fe.college_id) {
            const c = await pool.query('SELECT id, college_name, country, city FROM api_college WHERE id = $1', [fe.college_id]);
            collegeRow = c.rows[0] || null;
        }

        return NextResponse.json({ success: true, message: 'Further education updated', furtherEducation: fe, college: collegeRow }, { status: 200 });
    } catch (error) {
        console.error('Error updating further education:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

// DELETE - delete further education record
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'FurtherEducation ID is required' }, { status: 400 });
        }

        const existing = await pool.query('SELECT id FROM api_furthereducation WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return NextResponse.json({ error: 'Further education record not found' }, { status: 404 });
        }

        await pool.query('DELETE FROM api_furthereducation WHERE id = $1', [id]);
        return NextResponse.json({ success: true, message: 'Further education deleted' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting further education:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}