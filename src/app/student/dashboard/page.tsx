import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { StudentSidebar } from "@/components/student/StudentSidebar";
import {
  StudentDashboardLayout,
  type WindowData,
  type SlotData,
  type ProfessorProfile,
} from "@/components/student/StudentDashboardLayout";

import type { UserRole } from "@/types/database";

/**
 * Student Dashboard — Server Component.
 * Fetches upcoming consultation windows, their slots, and professor
 * profiles, then hands everything to the real-time `StudentDashboardLayout` client.
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
  // Use local timezone formatting so late-night PH time doesn't get pushed into yesterday UTC
  const { format } = await import("date-fns");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: windows } = await supabase
    .from("consultation_windows")
    .select("id, date, start_time, end_time, professor_id, topic")
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
    <div className="flex h-screen w-full overflow-hidden bg-white text-zinc-900">
      
      {/* Primary Slim Navigation */}
      <StudentSidebar studentName={profile.full_name} />

      {/* Main Structural Wrapper (Secondary Sidebar + Big Calendar) */}
      <StudentDashboardLayout
        initialWindows={windows ?? []}
        initialSlots={slots ?? []}
        professors={professors ?? []}
        currentUserId={user.id}
        studentName={profile.full_name}
      />

    </div>
  );
}
