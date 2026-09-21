import { getSession } from "./session";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN"]);

/**
 * Returns the session if it belongs to an admin, otherwise null.
 * Every /api/admin/* route must check this first — these endpoints
 * use the service-role Supabase client, which bypasses RLS, so the
 * role check here is the only thing standing between "logged in" and
 * "can create/delete school data".
 */
export async function requireAdminSession() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.has(session.role)) return null;
  return session;
}
