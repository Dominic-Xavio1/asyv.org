import pool from '../../../connection/databaseConnection';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'profiles');

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function GET(){
    try{
        const res = await pool.query("SELECT id, username, email, full_name, bio, location, phone, interests, skills, social_media, profile_image, created_by FROM user_profile");
        const users = res.rows;
        return NextResponse.json({users});
    }catch(e){
        console.error("Database error on fetching users",e);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
export async function POST(request) {
  try {
    const formData = await request.formData();
    const befInterest = JSON.stringify(formData.get("interests"))
    const befSkill = JSON.stringify(formData.get("skills"))
    const befSocialmedia = JSON.stringify(formData.get("socialMedia"))
    const fullName = formData.get('fullName');
    const username = formData.get('username');
    const email = formData.get('email');
    const bio = formData.get('bio');
    const location = formData.get('location');
    const created_by = formData.get("created_by");
    const phone = formData.get('phone');
    let interests = JSON.parse(befInterest);
    let skills = JSON.parse(befSkill);
    let socialMedia = JSON.parse(befSocialmedia);
    const imageFile = formData.get('profileImage');
    console.log("Received profile data:", { fullName, username, email, bio, location, phone });
    if(!fullName || !username || !email) {
      return NextResponse.json({ error: "Full name, username, and email are required" }, { status: 400 });
    }

    let profileImageUrl = null;

    if(imageFile && imageFile.size > 0) {
      await ensureUploadDir();
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `${email}-${timestamp}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      profileImageUrl = `/uploads/profiles/${filename}`;
      console.log("Image saved to:", profileImageUrl);
    }
    const existingProfile = await pool.query(
      "SELECT id, profile_image FROM user_profile WHERE email = $1",
      [email]
    );

    if(existingProfile.rows.length > 0) {
      const updateImageUrl = profileImageUrl || existingProfile.rows[0].profile_image;  
      const result = await pool.query(
        `UPDATE user_profile 
         SET full_name = $1, username = $2, bio = $3, location = $4, phone = $5, 
             interests = $6, skills = $7, social_media = $8, profile_image = $9, updated_at = CURRENT_TIMESTAMP
         WHERE email = $10
         RETURNING id, username, email, full_name, bio, location, phone, interests, skills, social_media, profile_image as profile_image_url, created_by`,  
        [
          fullName,
          username,
          bio || null,
          location || null,
          phone || null,
          JSON.stringify(interests || []),
          JSON.stringify(skills || []),
          JSON.stringify(socialMedia || {}),
          updateImageUrl,
          email
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        profile: result.rows[0]
      });
    } else {
      const result = await pool.query(
        `INSERT INTO user_profile (email, username, full_name, bio, location, phone, interests, skills, social_media, profile_image, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, username, email, full_name, bio, location, phone, interests, skills, social_media, profile_image as profile_image_url, created_by`,
        [
          email,
          username,
          fullName,
          bio || null,
          location || null,
          phone || null,
          JSON.stringify(interests || []),
          JSON.stringify(skills || []),
          JSON.stringify(socialMedia || {}),
          profileImageUrl,
          created_by
        ]
      );
      return NextResponse.json({
        success: true,
        message: "Profile created successfully",
        profile: result.rows[0]
      }, { status: 201 });
    }
  } catch (err) {
    console.error("Error in POST /api/users:", err);
    if(err.code === '23505') {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Failed to create/update profile" }, { status: 500 });
  }
}
