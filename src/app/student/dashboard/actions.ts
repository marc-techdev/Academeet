"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod/v4";

// ── Zod schema ──────────────────────────────────────────────

const bookSlotSchema = z.object({
  slot_id: z.string().uuid("Invalid slot ID."),
  agenda: z
    .string()
    .min(10, "Agenda must be at least 10 characters. Please describe your thesis topic or technical issue."),
});

// ── Result shape ────────────────────────────────────────────

export interface BookSlotResult {
  success?: boolean;
  error?: string;
}

/**
 * Server Action — reserves an open slot for the authenticated student.
 * Sets `student_id`, `status = 'booked'`, and the `agenda` text.
 *
 * @param _prev  Previous action state (unused, required by useActionState).
 * @param formData  FormData containing `slot_id` and `agenda`.
 */
export async function bookSlot(
  _prev: BookSlotResult,
  formData: FormData
): Promise<BookSlotResult> {
  const raw = {
    slot_id: formData.get("slot_id") as string,
    agenda: formData.get("agenda") as string,
  };

  // ── 1. Validate ───────────────────────────────────────────
  const parsed = bookSlotSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { slot_id, agenda } = parsed.data;

  // ── 2. Get authenticated user ─────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  // ── 3. Update the slot (only if still open) ───────────────
  const { data, error } = await supabase
    .from("slots")
    .update({
      student_id: user.id,
      status: "booked",
      agenda,
    } as never)
    .eq("id", slot_id)
    .eq("status", "open")
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return {
      error:
        "This slot is no longer available. It may have been booked by another student.",
    };
  }

  // ── 4. Revalidate both dashboards ─────────────────────────
  revalidatePath("/student/dashboard");
  revalidatePath("/professor/dashboard");

  return { success: true };
}
