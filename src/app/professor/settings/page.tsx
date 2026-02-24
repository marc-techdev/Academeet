import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfessorSidebar } from "@/components/professor/ProfessorSidebar";

export default async function ProfessorSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single<{ full_name: string; role: string }>();

  if (!profile || profile.role !== "professor") redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900 font-sans selection:bg-[#ff5757]/20">
      <ProfessorSidebar professorName={profile.full_name} department="Professor" />
      <main className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
        <div className="flex items-center justify-between mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Account Settings
          </h1>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 flex-1 flex flex-col animate-in zoom-in-95 duration-500">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-zinc-800 mb-6 border-b border-zinc-100 pb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Full Name</label>
                <div className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900">{profile.full_name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Email Address</label>
                <div className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900">{user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Role</label>
                <div className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 capitalize">{profile.role}</div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-zinc-800 mb-6 border-b border-zinc-100 pb-4 mt-10">System Preferences</h2>
            <p className="text-sm text-zinc-500">
              Notification preferences, calendar syncing, and account deletion options will be available here soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
