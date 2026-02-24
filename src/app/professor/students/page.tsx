import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfessorSidebar } from "@/components/professor/ProfessorSidebar";
import { StudentProfileDialog } from "@/components/professor/StudentProfileDialog";
import { Users, Mail, GraduationCap } from "lucide-react";
import type { User } from "@/types/database";

export default async function ProfessorStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single<{ full_name: string; role: string }>();

  if (!profile || profile.role !== "professor") redirect("/login");

  const { data: students } = (await supabase
    .from("users")
    .select("id, full_name, email, id_number")
    .eq("role", "student")
    .order("full_name")) as { data: User[] | null };

  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900 font-sans selection:bg-[#ff5757]/20">
      <ProfessorSidebar professorName={profile.full_name} department="Professor" />
      <main className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
        <div className="flex items-center justify-between mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Students Directory
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden animate-in slide-in-from-bottom-6 duration-700">
          <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Registered Students
              <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-xs font-semibold">
                {students?.length || 0} Total
              </span>
            </h2>
          </div>
          
          <div className="divide-y divide-zinc-100">
            {students && students.length > 0 ? (
              students.map((student) => (
                <div key={student.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                      {student.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900">{student.full_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                        <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {student.id_number}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {student.email}</span>
                      </div>
                    </div>
                  </div>
                  <StudentProfileDialog student={student} />
                </div>
              ))
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500">
                <Users className="w-12 h-12 text-zinc-300 mb-4" />
                <p className="text-lg font-medium text-zinc-900">No students found</p>
                <p className="text-sm mt-1">There are currently no registered students in the system.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
