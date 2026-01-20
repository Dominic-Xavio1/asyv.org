import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";

/**
 * PUT /api/notifications/[id]
 * Mark notification as read or update it
 * Body: { is_read: true/false, is_deleted: true/false }
 */
export async function PUT(request, { params }) {
  try {
    const { id } =await params;
    const body = await request.json();
    const { is_read, is_deleted, userId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Verify notification belongs to user if userId is provided
    if (userId) {
      const check = await pool.query(
        "SELECT recipient_id FROM notifications WHERE id = $1",
        [id]
      );

      if (check.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "Notification not found" },
          { status: 404 }
        );
      }

      if (String(check.rows[0].recipient_id) !== String(userId)) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (is_read !== undefined) {
      if (is_read) {
        updates.push(`is_read = TRUE`);
        updates.push(`read_at = CURRENT_TIMESTAMP`);
      } else {
        updates.push(`is_read = FALSE`);
        updates.push(`read_at = NULL`);
      }
    }

    if (is_deleted !== undefined) {
      updates.push(`is_deleted = $${paramCount}`);
      values.push(is_deleted);
      paramCount++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "No updates provided" },
        { status: 400 }
      );
    }

    values.push(id);
    const query = `
      UPDATE notifications 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, recipient_id, sender_id, type, title, message, link, is_read, read_at, created_at, is_deleted
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: "Notification updated successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating notification:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error updating notification",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification (soft delete by setting is_deleted = true)
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Verify notification belongs to user
    if (userId) {
      const check = await pool.query(
        "SELECT recipient_id FROM notifications WHERE id = $1",
        [id]
      );

      if (check.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "Notification not found" },
          { status: 404 }
        );
      }

      if (String(check.rows[0].recipient_id) !== String(userId)) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    // Soft delete
    const result = await pool.query(
      `UPDATE notifications 
       SET is_deleted = TRUE 
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notification deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting notification:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error deleting notification",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
