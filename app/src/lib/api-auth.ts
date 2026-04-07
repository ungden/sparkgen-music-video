import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Verify the request is from an authenticated user.
 * Returns the user if authenticated, or a 401 NextResponse if not.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, error: null };
}
