import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { format, parseISO } from "date-fns";
import {
  User as UserIcon,
  Mail,
  IdCard,
  Shield,
  CalendarClock,
  Clock,
  ArrowLeft,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

import type { UserRole, SlotStatus } from "@/types/database";

/**
 * Profile Page — accessible by any authenticated user.
 * Shows user details and, for students, upcoming appointments.
 */
export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, id_number, role")
    .eq("id", user.id)
    .single<{
      full_name: string;
      email: string;
      id_number: string;
      role: UserRole;
    }>();

  if (!profile) redirect("/login");

  // ── Student: Fetch upcoming appointments ──────────────────
  let appointments: {
    id: string;
    start_time: string;
    end_time: string;
    status: SlotStatus;
    agenda: string | null;
    professor_name: string;
  }[] = [];

  if (profile.role === "student") {
    const { data: bookedSlots } = await supabase
      .from("slots")
      .select("id, start_time, end_time, status, agenda, professor_id")
      .eq("student_id", user.id)
      .eq("status", "booked")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .returns<
        {
          id: string;
          start_time: string;
          end_time: string;
          status: SlotStatus;
          agenda: string | null;
          professor_id: string;
        }[]
      >();

    if (bookedSlots && bookedSlots.length > 0) {
      const profIds = [...new Set(bookedSlots.map((s) => s.professor_id))];
      const { data: profs } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", profIds)
        .returns<{ id: string; full_name: string }[]>();

      const profMap = new Map((profs ?? []).map((p) => [p.id, p.full_name]));

      appointments = bookedSlots.map((s) => ({
        id: s.id,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
        agenda: s.agenda,
        professor_name: profMap.get(s.professor_id) ?? "Unknown",
      }));
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dashboardHref =
    profile.role === "professor"
      ? "/professor/dashboard"
      : "/student/dashboard";

  const variant = profile.role === "professor" ? "professor" : "student";
  const accentFrom =
    profile.role === "professor" ? "from-blue-600" : "from-emerald-600";
  const accentTo =
    profile.role === "professor" ? "to-indigo-600" : "to-teal-600";

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-slate-50/30 to-zinc-100/20 dark:from-zinc-950 dark:via-zinc-900/10 dark:to-zinc-950/5">
      <Header variant={variant} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Back link */}
        <a
          href={dashboardHref}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </a>

        {/* Profile Card */}
        <Card className="mb-8 border-zinc-200/60 shadow-sm dark:border-zinc-800/60">
          <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8 sm:flex-row sm:items-start">
            <Avatar className={`h-20 w-20 text-2xl font-bold bg-linear-to-br ${accentFrom} ${accentTo} text-white shadow-lg`}>
              <AvatarFallback className={`bg-linear-to-br ${accentFrom} ${accentTo} text-white text-2xl font-bold`}>
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.full_name}
                </h1>
                <Badge
                  variant="outline"
                  className="mt-1 capitalize"
                >
                  {profile.role}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  {profile.id_number}
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Role: <span className="font-medium text-foreground capitalize">{profile.role}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student: Upcoming Appointments */}
        {profile.role === "student" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-600" />
              Upcoming Appointments
            </h2>

            {appointments.length === 0 ? (
              <Card className="border-dashed border-zinc-300 dark:border-zinc-700">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarClock className="mb-3 h-10 w-10 text-zinc-400" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming appointments. Head to the dashboard to book a slot!
                  </p>
                  <a href="/student/dashboard">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Browse Slots
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {appointments.map((appt) => (
                  <Card
                    key={appt.id}
                    className="border-zinc-200/60 shadow-sm dark:border-zinc-800/60"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Prof. {appt.professor_name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        >
                          Confirmed
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(parseISO(appt.start_time), "EEE, MMM d · h:mm a")}
                        {" – "}
                        {format(parseISO(appt.end_time), "h:mm a")}
                      </CardDescription>
                    </CardHeader>
                    {appt.agenda && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Agenda:</span>{" "}
                          {appt.agenda}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
