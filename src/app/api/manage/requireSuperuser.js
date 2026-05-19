import pool from "../../../connection/databaseConnection"

export async function requireSuperuser(request, { fromBody = false } = {}) {
  let userId = request.headers.get("x-user-id");
  if (!userId && !fromBody) {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get("requestingUserId");
  }
  if (fromBody) {
    try {
      const body = await request.clone().json();
      userId = userId || body?.requestingUserId;
    } catch (_) {}
  }
  if (!userId) {
    return { ok: false, status: 401, error: "Requesting user ID required (x-user-id or requestingUserId)" };
  }
  const r = await pool.query("SELECT is_superuser,is_crc FROM api_user WHERE id = $1", [userId]);
  if (r.rows.length === 0) {
    return { ok: false, status: 404, error: "User not found" };
  }
  if (!r.rows[0].is_superuser && !r.rows[0].is_crc) {
    console.log("Super user fetched ",r.rows[0]);
    return { ok: false, status: 403, error: "Superuser only" };
  }
  return { ok: true, userId };
}
