"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart2, 
  Settings,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface ProfessorSidebarProps {
  professorName: string;
  department?: string;
}

export function ProfessorSidebar({ professorName, department = "Faculty Member" }: ProfessorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLinks = [
    { name: "Dashboard", href: "/professor/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/professor/students", icon: Users },
    { name: "Statistic", href: "/professor/statistic", icon: BarChart2 },
    { name: "Settings", href: "/professor/settings", icon: Settings },
  ];

  return (
    <aside className="w-72 bg-white flex-col pt-8 pb-6 px-6 shadow-sm z-10 hidden md:flex h-full sticky top-0 border-r border-zinc-100">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-10 px-2 text-[#ff5757]">
        <GraduationCap className="h-6 w-6" />
        <span className="font-bold text-xl text-zinc-900 tracking-tight">AcadeMeet_</span>
      </div>

      {/* Profile Card */}
      <div className="bg-zinc-50 rounded-2xl p-6 flex flex-col items-center mb-8 relative overflow-hidden border border-zinc-100/50">
        {/* Decorative thin circles in background */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full border-[0.5px] border-zinc-200/60" />
        <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-[0.5px] border-zinc-200/60" />
        
        <div className="relative mb-3">
          <Avatar className="h-20 w-20 border-2 border-white shadow-sm ring-1 ring-zinc-100">
            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${professorName}`} />
            <AvatarFallback className="bg-cyan-100 text-cyan-800 text-xl font-bold">
              {professorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <h3 className="font-bold text-zinc-900 mt-2 text-center leading-tight">{professorName}</h3>
        <p className="text-xs text-zinc-500 mt-1">{department}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? "text-[#ff5757] font-semibold bg-white" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-[#ff5757]" : "text-zinc-400 group-hover:text-zinc-600"}`} />
              {link.name}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ff5757] rounded-r-md" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-zinc-100 pt-6">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-zinc-500 hover:text-red-500 hover:bg-red-50 font-medium w-full text-left"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

    </aside>
  );
}
