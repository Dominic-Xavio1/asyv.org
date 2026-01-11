import pool from "../../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
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
 * PUT /api/group-conversation/[groupId]
 * Update a group conversation
 */
export async function PUT(request, { params }) {
  try {
    const { groupId } = params;
    const formData = await request.formData();

    const name = formData.get("name");
    const description = formData.get("description") || "";
    const members = formData.get("members");
    const imageFile = formData.get("image");
    const removeImage = formData.get("removeImage") === "true";

    if (!groupId) {
      return NextResponse.json(
        { success: false, message: "groupId is required" },
        { status: 400 }
      );
    }

    // Check if group exists and user is creator
    const existingGroup = await pool.query(
      `SELECT * FROM group_conversation WHERE id = $1`,
      [groupId]
    );

    if (existingGroup.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }

    const group = existingGroup.rows[0];
    let membersArray = group.members;
    if (typeof membersArray === 'string') {
      membersArray = JSON.parse(membersArray);
    }

    // Handle image
    let imageUrl = group.image;
    if (removeImage) {
      // Delete old image if exists
      if (imageUrl) {
        try {
          const oldImagePath = join(process.cwd(), "public", imageUrl);
          await unlink(oldImagePath);
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }
      imageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
      // Delete old image
      if (imageUrl) {
        try {
          const oldImagePath = join(process.cwd(), "public", imageUrl);
          await unlink(oldImagePath);
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }
      // Upload new image
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

    // Update members if provided
    if (members) {
      try {
        membersArray = JSON.parse(members);
        if (!Array.isArray(membersArray)) {
          return NextResponse.json(
            { success: false, message: "members must be a valid JSON array" },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { success: false, message: "members must be a valid JSON array" },
          { status: 400 }
        );
      }
    }

    // Update group
    const result = await pool.query(
      `UPDATE group_conversation 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           members = COALESCE($3, members),
           image = COALESCE($4, image)
       WHERE id = $5
       RETURNING id, name, description, members, created_by, image, created_at`,
      [
        name || group.name,
        description !== null ? description : group.description,
        JSON.stringify(membersArray),
        imageUrl !== undefined ? imageUrl : group.image,
        groupId,
      ]
    );

    const updatedGroup = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          ...updatedGroup,
          members: typeof updatedGroup.members === 'string' 
            ? JSON.parse(updatedGroup.members) 
            : updatedGroup.members,
        },
        message: "Group updated successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating group conversation:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error updating group conversation",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/group-conversation/[groupId]
 * Delete a group conversation
 */
export async function DELETE(request, { params }) {
  try {
    const { groupId } = params;

    if (!groupId) {
      return NextResponse.json(
        { success: false, message: "groupId is required" },
        { status: 400 }
      );
    }

    // Get group to delete image
    const groupResult = await pool.query(
      `SELECT image FROM group_conversation WHERE id = $1`,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }

    // Delete image if exists
    const imageUrl = groupResult.rows[0].image;
    if (imageUrl) {
      try {
        const imagePath = join(process.cwd(), "public", imageUrl);
        await unlink(imagePath);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

    // Delete group
    await pool.query(
      `DELETE FROM group_conversation WHERE id = $1`,
      [groupId]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Group deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting group conversation:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error deleting group conversation",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
