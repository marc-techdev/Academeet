import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfessorSidebar } from "@/components/professor/ProfessorSidebar";
import { Users, Clock, CalendarCheck, TrendingUp, BarChart2 } from "lucide-react";
import type { Slot } from "@/types/database";

export default async function ProfessorStatisticPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single<{ full_name: string; role: string }>();

  if (!profile || profile.role !== "professor") redirect("/login");

  // Fetch some aggregate data for visualization
  const { count: upcomingCount } = await supabase
    .from("slots")
    .select("*", { count: 'exact', head: true })
    .eq("status", "booked")
    .eq("professor_id", user.id)
    .gte("start_time", new Date().toISOString());

  const { count: completedCount } = await supabase
    .from("slots")
    .select("*", { count: 'exact', head: true })
    .eq("status", "booked")
    .eq("professor_id", user.id)
    .lt("start_time", new Date().toISOString());

  const { data: allBookedSlots } = (await supabase
    .from("slots")
    .select("start_time, end_time")
    .eq("status", "booked")
    .eq("professor_id", user.id)) as { data: Slot[] | null };

  let totalMinutes = 0;
  allBookedSlots?.forEach(slot => {
    const start = new Date(slot.start_time).getTime();
    const end = new Date(slot.end_time).getTime();
    if (!isNaN(start) && !isNaN(end)) {
      totalMinutes += (end - start) / 60000;
    }
  });
  const totalHours = (totalMinutes / 60).toFixed(1);

  const { count: openCount } = await supabase
    .from("slots")
    .select("*", { count: 'exact', head: true })
    .eq("status", "open")
    .eq("professor_id", user.id);

  const totalSlots = (openCount || 0) + (allBookedSlots?.length || 0);
  const bookedPerc = totalSlots > 0 ? Math.round(((allBookedSlots?.length || 0) / totalSlots) * 100) : 0;
  const openPerc = totalSlots > 0 ? Math.round(((openCount || 0) / totalSlots) * 100) : 0;

  const { count: studentCount } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true })
    .eq("role", "student");

  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900 font-sans selection:bg-[#ff5757]/20">
      <ProfessorSidebar professorName={profile.full_name} department="Professor" />
      <main className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
        <div className="flex items-center justify-between mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Consultation Statistics
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in zoom-in-95 duration-500">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Unique Students</p>
              <p className="text-2xl font-bold text-zinc-900">{studentCount || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-zinc-900">{upcomingCount || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Completed Sessions</p>
              <p className="text-2xl font-bold text-zinc-900">{completedCount || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="bg-[#ff5757]/10 w-12 h-12 rounded-xl flex items-center justify-center text-[#ff5757] shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Total Hours</p>
              <p className="text-2xl font-bold text-zinc-900">{totalHours} hrs</p>
            </div>
          </div>

        </div>

        <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 flex-1 flex flex-col animate-in slide-in-from-bottom-6 duration-700">
          <h2 className="text-xl font-bold text-zinc-800 mb-6 border-b border-zinc-100 pb-4">Activity Overview</h2>
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
            <h3 className="text-lg font-bold text-zinc-800 mb-2">Slot Status Distribution</h3>
            <p className="text-sm text-zinc-500 mb-6">A clear breakdown of your generated consultation slots.</p>
            
            <div className="flex h-6 rounded-full overflow-hidden mb-4 border border-zinc-100 shadow-inner">
              <div style={{ width: `${bookedPerc}%` }} className="bg-emerald-500 h-full transition-all duration-1000 ease-out" />
              <div style={{ width: `${openPerc}%` }} className="bg-zinc-200 h-full transition-all duration-1000 ease-out" />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-semibold text-zinc-700">Booked ({bookedPerc}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-200" />
                <span className="font-semibold text-zinc-700">Open ({openPerc}%)</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-6 text-center border-t border-zinc-100 pt-6">Advanced timeline analytics coming soon.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
