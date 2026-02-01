import pool from "../../../connection/databaseConnection"

/**
 * Verify requesting user is alumni. Get userId from header x-user-id or query/body userId.
 * Returns { ok: true, userId } or { ok: false, status, error }.
 */
export async function requireAlumni(request, { fromBody = false } = {}) {
  let userId = request.headers.get("x-user-id");
  if (!userId && !fromBody) {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get("userId");
  }
  if (fromBody) {
    try {
      const body = await request.clone().json();
      userId = userId || body?.userId;
    } catch (_) {}
  }
  if (!userId) {
    return { ok: false, status: 401, error: "User ID required (x-user-id or userId)" };
  }
  const r = await pool.query("SELECT is_alumni FROM api_user WHERE id = $1", [userId]);
  if (r.rows.length === 0) {
    return { ok: false, status: 404, error: "User not found" };
  }
  if (!r.rows[0].is_alumni) {
    return { ok: false, status: 403, error: "Alumni only" };
  }
  return { ok: true, userId: String(userId) };
}
