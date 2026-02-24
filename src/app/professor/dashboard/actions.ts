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

export interface DeleteWindowResult {
  success?: boolean;
  error?: string;
}

/**
 * Server Action — deletes a consultation window and its associated slots.
 * RLS ensures professors can only delete their own windows.
 */
export async function deleteConsultationWindow(windowId: string): Promise<DeleteWindowResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("consultation_windows")
    .delete()
    .eq("id", windowId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/professor/dashboard");
  return { success: true };
}

export interface EditWindowResult {
  success?: boolean;
  error?: string;
  slotsCreated?: number;
}

/**
 * Server Action — edits an existing consultation window.
 * It strictly prevents editing if ANY slot in the window is already booked.
 * If safe to edit, it deletes the old unbooked slots, updates the window,
 * and generates fresh slots for the new time range.
 */
export async function editConsultationWindow(
  windowId: string,
  _prev: EditWindowResult,
  formData: FormData
): Promise<EditWindowResult> {
  const raw = {
    date: formData.get("date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
  };

  // 1. Validate form data
  const parsed = windowSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, start_time, end_time } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  // 2. Check if window has any booked slots (safety check)
  const { data: bookedSlots, error: checkError } = await supabase
    .from("slots")
    .select("id")
    .eq("window_id", windowId)
    .eq("status", "booked")
    .limit(1);

  if (checkError) return { error: "Failed to verify existing slots." };
  
  if (bookedSlots && bookedSlots.length > 0) {
    return { error: "Cannot edit this window because it already has booked appointments. Please cancel them first or create a new window." };
  }

  // 3. Delete existing (open) slots for this window
  const { error: deleteSlotsError } = await supabase
    .from("slots")
    .delete()
    .eq("window_id", windowId);

  if (deleteSlotsError) return { error: "Failed to clear old slots." };

  // 4. Update the consultation window itself
  const { error: updateWindowError } = await supabase
    .from("consultation_windows")
    .update({
      date,
      start_time: `${start_time}:00`,
      end_time: `${end_time}:00`,
    } as never)
    .eq("id", windowId)
    .eq("professor_id", user.id); // Double check RLS/ownership

  if (updateWindowError) return { error: "Failed to update window." };

  // 5. Generate new slots
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
      window_id: windowId,
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

  const { error: insertSlotsError } = await supabase
    .from("slots")
    .insert(slots as never[]);

  if (insertSlotsError) return { error: "Failed to create new slots." };

  revalidatePath("/professor/dashboard");
  return { success: true, slotsCreated: slots.length };
}
