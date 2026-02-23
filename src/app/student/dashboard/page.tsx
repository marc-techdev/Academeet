import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { Header } from "@/components/layout/Header";
import {
  SlotGrid,
  type WindowData,
  type SlotData,
  type ProfessorProfile,
} from "@/components/student/SlotGrid";

import type { UserRole, SlotStatus } from "@/types/database";

/**
 * Student Dashboard — Server Component.
 * Fetches upcoming consultation windows, their slots, and professor
 * profiles, then hands everything to the real-time `SlotGrid` client.
 */
export default async function StudentDashboardPage() {
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

  if (!profile || profile.role !== "student") redirect("/login");

  // ── Fetch upcoming windows ────────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  const { data: windows } = await supabase
    .from("consultation_windows")
    .select("id, date, start_time, end_time, professor_id")
    .gte("date", today)
    .order("date", { ascending: true })
    .returns<WindowData[]>();

  // ── Fetch slots for those windows ─────────────────────────
  const windowIds = windows?.map((w) => w.id) ?? [];

  const { data: slots } = windowIds.length
    ? await supabase
        .from("slots")
        .select("id, window_id, professor_id, student_id, start_time, end_time, status, agenda")
        .in("window_id", windowIds)
        .order("start_time", { ascending: true })
        .returns<SlotData[]>()
    : { data: [] as SlotData[] };

  // ── Fetch professor profiles ──────────────────────────────
  const professorIds = [
    ...new Set((windows ?? []).map((w) => w.professor_id)),
  ];

  const { data: professors } = professorIds.length
    ? await supabase
        .from("users")
        .select("id, full_name")
        .in("id", professorIds)
        .returns<ProfessorProfile[]>()
    : { data: [] as ProfessorProfile[] };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-emerald-50/30 to-teal-50/20 dark:from-zinc-950 dark:via-emerald-950/10 dark:to-teal-950/5">
      <Header variant="student" />

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {profile.full_name} 👋
          </h1>
          <p className="text-muted-foreground">
            Browse available consultation slots and book your next appointment.
            Slots update in <span className="font-medium text-emerald-600 dark:text-emerald-400">real-time</span> — no refresh needed.
          </p>
        </div>

        {/* Real-time slot grid */}
        <SlotGrid
          initialWindows={windows ?? []}
          initialSlots={slots ?? []}
          professors={professors ?? []}
          currentUserId={user.id}
        />
      </main>
    </div>
  );
}
