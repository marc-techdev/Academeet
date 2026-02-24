import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Clock,
  User as UserIcon,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ProfessorSidebar } from "@/components/professor/ProfessorSidebar";
import { ProfessorHeaderActions } from "@/components/professor/ProfessorHeaderActions";
import { ProfessorBookingsGrid } from "@/components/professor/ProfessorBookingsGrid";

import type { UserRole } from "@/types/database";
import type { SlotStatus } from "@/types/database";

/** Slot shape after joining with the student profile. */
interface SlotWithStudent {
  id: string;
  window_id: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  student_id: string | null;
  agenda: string | null;
  student: { full_name: string; id_number: string } | null;
}

/**
 * Professor Dashboard — Server Component.
 * Displays greeting, consultation window creation form, and
 * a list of existing windows with their generated slots.
 * Booked slots show the student's name and their agenda.
 */
export default async function ProfessorDashboardPage() {
  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ── Fetch profile and windows+slots in parallel ───────────
  // Note: we can't reliably put `supabase` queries into Promise.all if they use the same
  // un-awaited client context in some older Supabase versions, but here it's safe.
  // Alternatively, we get the profile first, then get the windows + slots in one query!

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single<{ full_name: string; email: string; role: UserRole }>();

  if (!profile || profile.role !== "professor") redirect("/login");

  // Fetch windows and their nested slots in one go using foreign key relationship
  const { data: windowsData } = await supabase
    .from("consultation_windows")
    .select(`
      id, date, start_time, end_time, topic,
      slots (
        id, window_id, start_time, end_time, status, student_id, agenda,
        student:users!student_id(full_name, id_number)
      )
    `)
    .eq("professor_id", user.id)
    .order("date", { ascending: true })
    .returns<
      {
        id: string;
        date: string;
        start_time: string;
        end_time: string;
        topic: string;
        slots: SlotWithStudent[];
      }[]
    >();

  const windows = windowsData?.map(w => ({
    id: w.id,
    date: w.date,
    start_time: w.start_time,
    end_time: w.end_time,
    topic: w.topic,
  })) ?? [];

  // Flatten slots and group them by window
  const allSlots: SlotWithStudent[] = [];
  const slotsByWindow = new Map<string, SlotWithStudent[]>();

  for (const w of windowsData ?? []) {
    const wSlots = w.slots ?? [];
    slotsByWindow.set(w.id, wSlots);
    allSlots.push(...wSlots);
  }

  // ── Status color helper ───────────────────────────────────
  function statusBadge(status: SlotStatus) {
    const map: Record<SlotStatus, { bg: string; text: string; label: string }> =
      {
        open: {
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
          text: "text-emerald-700 dark:text-emerald-400",
          label: "Open",
        },
        booked: {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-700 dark:text-blue-400",
          label: "Booked",
        },
        cancelled: {
          bg: "bg-zinc-100 dark:bg-zinc-800",
          text: "text-zinc-500 dark:text-zinc-400",
          label: "Cancelled",
        },
      };
    const s = map[status];
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}
      >
        {s.label}
      </span>
    );
  }

  // ── Notification Logic ────────────────────────────────────
  const windowsMap = new Map((windows ?? []).map((w) => [w.id, w]));
  const slotsWithDate = (allSlots ?? []).map((slot) => ({
    ...slot,
    date: windowsMap.get(slot.window_id)?.date || "Unknown Date",
  }));

  const now = new Date();
  const bookedSlotsList = slotsWithDate.filter((s) => {
    if (s.status !== "booked") return false;

    // Build the Full Date-Time string robustly
    let endStr = s.end_time;
    if (!endStr.includes("T")) {
      endStr = `${s.date}T${s.end_time}`;
    }

    try {
      const parsedEnd = parseISO(endStr);
      // Filter out slots that have already finished
      if (parsedEnd < now) return false;
      return true;
    } catch {
      return false;
    }
  });

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900 font-sans selection:bg-[#ff5757]/20">
      <ProfessorSidebar professorName={profile.full_name} department="Professor" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
        {/* Top Header / Actions */}
        <div className="flex items-center justify-between mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Schedule
          </h1>
          <div className="flex items-center gap-3">
             <ProfessorHeaderActions bookedSlots={bookedSlotsList} />
          </div>
        </div>

        {/* Existing Windows Calendar Grid -> Will become Vertical Timeline */}
        <ProfessorBookingsGrid windows={windows ?? []} slotsByWindow={slotsByWindow} />
      </main>
    </div>
  );
}
