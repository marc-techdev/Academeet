"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod/v4";
import { addMinutes, parse, isBefore } from "date-fns";

// ── Zod schema ──────────────────────────────────────────────

const windowSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format."),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time."),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time."),
  })
  .refine(
    (data) => data.end_time > data.start_time,
    { message: "End time must be after start time." }
  );

// ── Result shape ────────────────────────────────────────────

export interface CreateWindowResult {
  success?: boolean;
  error?: string;
  slotsCreated?: number;
}

/**
 * Server Action — creates a consultation window and auto-generates
 * 15-minute slots for the given time range.
 *
 * @param _prev  Previous action state (unused, required by useActionState).
 * @param formData  FormData with `date`, `start_time`, `end_time`.
 */
export async function createConsultationWindow(
  _prev: CreateWindowResult,
  formData: FormData
): Promise<CreateWindowResult> {
  const raw = {
    date: formData.get("date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
  };

  // ── 1. Validate ───────────────────────────────────────────
  const parsed = windowSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, start_time, end_time } = parsed.data;

  // ── 2. Get authenticated user ─────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  // ── 3. Insert consultation window ─────────────────────────
  const { data: window, error: windowError } = await supabase
    .from("consultation_windows")
    .insert({
      professor_id: user.id,
      date,
      start_time: `${start_time}:00`,   // TIME expects HH:MM:SS
      end_time: `${end_time}:00`,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (windowError || !window) {
    return { error: windowError?.message ?? "Failed to create window." };
  }

  // ── 4. Calculate 15-minute intervals ──────────────────────
  const baseDate = parse(date, "yyyy-MM-dd", new Date());
  const startDt = parse(start_time, "HH:mm", baseDate);
  const endDt = parse(end_time, "HH:mm", baseDate);

  const slots: {
    window_id: string;
    professor_id: string;
    start_time: string;
    end_time: string;
    status: "open";
  }[] = [];
  let cursor = startDt;

  while (isBefore(addMinutes(cursor, 15), endDt) || addMinutes(cursor, 15).getTime() === endDt.getTime()) {
    const slotEnd = addMinutes(cursor, 15);
    slots.push({
      window_id: window.id,
      professor_id: user.id,
      start_time: cursor.toISOString(),
      end_time: slotEnd.toISOString(),
      status: "open",
    });
    cursor = slotEnd;
  }

  if (slots.length === 0) {
    return { error: "Time range is too short for at least one 15-minute slot." };
  }

  // ── 5. Batch insert slots ─────────────────────────────────
  const { error: slotsError } = await supabase
    .from("slots")
    .insert(slots as never[]);

  if (slotsError) {
    return { error: slotsError.message };
  }

  // ── 6. Revalidate and return ──────────────────────────────
  revalidatePath("/professor/dashboard");

  return { success: true, slotsCreated: slots.length };
}
