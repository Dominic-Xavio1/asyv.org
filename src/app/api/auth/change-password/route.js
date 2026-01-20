import pool from '../../../../connection/databaseConnection';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    if (!userId || !currentPassword || !newPassword) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { success: false, error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT id, password FROM api_user WHERE id = $1',
      [userId]
    );

    const users = result.rows;

    if (users.length === 0) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return Response.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    const sameAsCurrentPassword = await bcrypt.compare(newPassword, user.password);
    if (sameAsCurrentPassword) {
      return Response.json(
        { success: false, error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE api_user SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    return Response.json(
      { success: true, message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    return Response.json(
      { success: false, error: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
