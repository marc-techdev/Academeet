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

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single<{ full_name: string; email: string; role: UserRole }>();

  if (!profile || profile.role !== "professor") redirect("/login");

  // ── Fetch windows + slots ─────────────────────────────────
  const { data: windows } = await supabase
    .from("consultation_windows")
    .select("id, date, start_time, end_time")
    .eq("professor_id", user.id)
    .order("date", { ascending: true })
    .returns<
      { id: string; date: string; start_time: string; end_time: string }[]
    >();

  // Fetch all slots for this professor — join with the student profile
  const windowIds = windows?.map((w) => w.id) ?? [];

  const { data: allSlots } = windowIds.length
    ? await supabase
        .from("slots")
        .select(
          "id, window_id, start_time, end_time, status, student_id, agenda, student:users!student_id(full_name, id_number)"
        )
        .in("window_id", windowIds)
        .order("start_time", { ascending: true })
        .returns<SlotWithStudent[]>()
    : { data: [] as SlotWithStudent[] };

  // Group slots by window
  const slotsByWindow = new Map<string, SlotWithStudent[]>();
  for (const slot of allSlots ?? []) {
    const arr = slotsByWindow.get(slot.window_id) ?? [];
    arr.push(slot);
    slotsByWindow.set(slot.window_id, arr);
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
  const windowsMap = new Map((windows ?? []).map(w => [w.id, w]));
  const slotsWithDate = (allSlots ?? []).map(slot => ({
    ...slot,
    date: windowsMap.get(slot.window_id)?.date || "Unknown Date"
  }));
  const bookedSlotsList = slotsWithDate.filter(s => s.status === "booked");

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
