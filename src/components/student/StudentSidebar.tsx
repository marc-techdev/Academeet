"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface StudentSidebarProps {
  studentName: string;
}

export function StudentSidebar({ studentName }: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLinks = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  ];

  return (
    <aside className="w-20 bg-[#5438dc] flex-col pt-8 pb-6 items-center shadow-lg z-20 hidden md:flex h-screen sticky top-0 shrink-0">
      {/* Brand Icon Only */}
      <div className="flex items-center justify-center mb-10 text-white hover:text-white/80 transition-colors cursor-pointer">
        <GraduationCap className="h-8 w-8" />
      </div>

      {/* Navigation - Icons Only */}
      <nav className="flex-1 space-y-4 w-full px-2 flex flex-col items-center">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              title={link.name}
              className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 group relative ${
                isActive 
                  ? "bg-white/20 text-white shadow-inner" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="h-6 w-6" />
              {isActive && (
                <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-md" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile and Logout */}
      <div className="flex flex-col items-center gap-6 mt-auto">
        <button 
          onClick={handleSignOut}
          title="Sign Out"
          className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 text-white/60 hover:text-red-300 hover:bg-white/10"
        >
          <LogOut className="h-6 w-6" />
        </button>

        <Avatar className="h-10 w-10 border-2 border-white/20 shadow-md ring-2 ring-transparent hover:ring-white/40 transition-all cursor-pointer">
          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${studentName}`} />
          <AvatarFallback className="bg-cyan-100 text-cyan-800 font-bold">
            {studentName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>
    </aside>
  );
}
