import { NextResponse } from 'next/server';
import { getOnlineUsersWithProfile, getOnlineUsersCount } from '@/services/online-users/onlineUsersService';

/**
 * GET /api/online-users
 * 
 * Fetches the list of currently online users with their profile information.
 * 
 * Query parameters:
 * - excludeUserId (optional): User ID to exclude from the results
 * - countOnly (optional): If true, returns only the count of online users
 * 
 * @returns {NextResponse} JSON response with online users list or count
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeUserId = searchParams.get('excludeUserId');
    const countOnly = searchParams.get('countOnly') === 'true';

    if (countOnly) {
      // Return only the count
      const count = await getOnlineUsersCount(excludeUserId);
      return NextResponse.json({
        success: true,
        count,
      });
    }

    // Return full list of online users with profile data
    const onlineUsers = await getOnlineUsersWithProfile(excludeUserId);
    const count = onlineUsers.length;

    return NextResponse.json({
      success: true,
      data: onlineUsers,
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch online users',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
