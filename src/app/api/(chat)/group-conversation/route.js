import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "groups");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

/**
 * POST /api/group-conversation
 * Create a new group conversation
 * Body: FormData with name, description, members (JSON array), created_by, image (file)
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get("name");
    const description = formData.get("description") || "";
    const members = formData.get("members"); // JSON string array of user IDs
    const created_by = formData.get("created_by");
    const imageFile = formData.get("image");

    // Validation
    if (!name || !created_by || !members) {
      return NextResponse.json(
        { success: false, message: "name, created_by, and members are required" },
        { status: 400 }
      );
    }

    let membersArray;
    try {
      membersArray = JSON.parse(members);
      if (!Array.isArray(membersArray) || membersArray.length === 0) {
        return NextResponse.json(
          { success: false, message: "members must be a non-empty array" },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "members must be a valid JSON array" },
        { status: 400 }
      );
    }

    // Ensure creator is included in members
    if (!membersArray.includes(String(created_by))) {
      membersArray.push(String(created_by));
    }

    // Handle image upload
    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      await ensureUploadDir();
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `group-${timestamp}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/groups/${filename}`;
    }

    // Insert group conversation
    const result = await pool.query(
      `INSERT INTO group_conversation (name, description, members, created_by, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, members, created_by, image, created_at`,
      [
        name,
        description,
        membersArray, // Store as JSON string
        created_by,
        imageUrl,
      ]
    );

    const group = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          ...group,
          members: membersArray, // Return as array for convenience
        },
        message: "Group created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating group conversation:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error creating group conversation",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/group-conversation?userId=123
 * Get all groups for a user (groups where user is a member)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Get all groups where user is a member
    const result = await pool.query(
        `SELECT id, name, description, members, created_by, image, created_at
         FROM group_conversation
         WHERE $1 = ANY(members) -- Check if userId exists in the native array
         ORDER BY created_at DESC`,
        [userId] 
      );
    const groups = result.rows;

    return NextResponse.json(
      {
        success: true,
        data: groups,
        message: "Groups fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching group conversations:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching group conversations",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
