"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { UserRole } from "@/types/database";

/** Shape returned to the client when login fails. */
export interface LoginResult {
  error?: string;
}

/**
 * Server Action — authenticates a user with email + password,
 * then redirects to the correct role-based dashboard.
 * If the public profile doesn't exist yet (e.g. trigger didn't fire),
 * it creates one from the auth user's metadata.
 */
export async function loginAction(
  _prev: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  // ── 1. Authenticate with Supabase Auth ────────────────────
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  const user = authData.user;
  if (!user) {
    return { error: "Could not retrieve authenticated user." };
  }

  // ── 2. Fetch the user's role from the public `users` table ──
  let { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  // Handle case where query fails (e.g. no rows)
  if (!profile && profileError?.code === 'PGRST116') {
     profile = null;
  }

  // ── 2b. Fallback: create profile from user_metadata ───────
  // This handles the case where the DB trigger didn't fire
  if (!profile && user.user_metadata) {
    const meta = user.user_metadata;
    const { data: newProfile, error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email ?? email,
        full_name: meta.full_name ?? "Unknown",
        id_number: meta.id_number ?? "000000",
        role: meta.role ?? "student",
      } as never)
      .select("role")
      .single<{ role: UserRole }>();

    if (insertError) {
      return { error: `Profile creation failed: ${insertError.message}` };
    }

    profile = newProfile;
  }

  if (!profile) {
    return { error: "User profile not found. Please sign up again." };
  }

  // ── 3. Redirect to the appropriate dashboard ──────────────
  const destination =
    profile.role === "professor"
      ? "/professor/dashboard"
      : "/student/dashboard";

  redirect(destination);
}
