"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod/v4";

// ── Zod schema ──────────────────────────────────────────────

const signUpSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  full_name: z.string().min(2, "Full name is required."),
  id_number: z.string().min(1, "ID number is required."),
  role: z.enum(["student", "professor"], {
    message: "Please select a role.",
  }),
});

// ── Result shape ────────────────────────────────────────────

export interface SignUpResult {
  error?: string;
}

/**
 * Server Action — creates a Supabase Auth account with profile data
 * in user_metadata. A database trigger on auth.users automatically
 * inserts the corresponding row in public.users.
 */
export async function signUpUser(
  _prev: SignUpResult,
  formData: FormData
): Promise<SignUpResult> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    full_name: formData.get("full_name") as string,
    id_number: formData.get("id_number") as string,
    role: formData.get("role") as string,
  };

  // ── 1. Validate ───────────────────────────────────────────
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password, full_name, id_number, role } = parsed.data;

  const supabase = await createClient();

  // ── 2. Create auth account (trigger handles profile) ──────
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, id_number, role },
    },
  });

  if (authError) {
    // Handle unique constraint on id_number from the trigger
    if (authError.message.includes("23505") || authError.message.includes("duplicate")) {
      return {
        error: "This ID number is already registered. Please use a different one or log in.",
      };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Account creation failed. Please try again." };
  }

  // ── 3. Redirect to dashboard ──────────────────────────────
  const destination =
    role === "professor" ? "/professor/dashboard" : "/student/dashboard";

  redirect(destination);
}
