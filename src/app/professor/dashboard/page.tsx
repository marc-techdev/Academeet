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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateWindowForm } from "@/components/professor/CreateWindowForm";
import { BookedSlotDialog } from "@/components/professor/BookedSlotDialog";
import { Header } from "@/components/layout/Header";

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

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-blue-50/30 to-indigo-50/20 dark:from-zinc-950 dark:via-blue-950/10 dark:to-indigo-950/5">
      <Header variant="professor" />

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Greeting */}
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, Professor {profile.full_name} 👋
          </h1>
          <p className="text-muted-foreground">
            Manage your consultation windows and upcoming appointments.
          </p>
        </div>

        {/* Create Window Form */}
        <div className="mb-10">
          <CreateWindowForm />
        </div>

        {/* Existing Windows */}
        <section>
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            Your Consultation Windows
          </h2>

          {(!windows || windows.length === 0) && (
            <Card className="border-dashed border-zinc-300 dark:border-zinc-700">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="mb-3 h-10 w-10 text-zinc-400" />
                <p className="text-sm text-muted-foreground">
                  No consultation windows yet. Use the form above to create your
                  first one.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6">
            {windows?.map((w) => {
              const slots = slotsByWindow.get(w.id) ?? [];
              const bookedCount = slots.filter(
                (s) => s.status === "booked"
              ).length;

              return (
                <Card
                  key={w.id}
                  className="border-zinc-200/60 shadow-sm dark:border-zinc-800/60"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                        {format(parseISO(w.date), "EEEE, MMMM d, yyyy")}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {bookedCount}/{slots.length} booked
                      </span>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {w.start_time.slice(0, 5)} — {w.end_time.slice(0, 5)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No slots generated.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {slots.map((slot) =>
                          slot.status === "booked" && slot.student ? (
                            <BookedSlotDialog
                              key={slot.id}
                              slot={{
                                id: slot.id,
                                start_time: slot.start_time,
                                end_time: slot.end_time,
                                agenda: slot.agenda,
                                studentName: slot.student.full_name,
                                studentIdNumber: slot.student.id_number,
                              }}
                            />
                          ) : (
                            <div
                              key={slot.id}
                              className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/30"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">
                                    {format(parseISO(slot.start_time), "h:mm a")}
                                  </span>
                                  <span className="text-muted-foreground">–</span>
                                  <span className="font-medium">
                                    {format(parseISO(slot.end_time), "h:mm a")}
                                  </span>
                                </div>
                                {statusBadge(slot.status)}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
