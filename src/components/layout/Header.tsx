import { GraduationCap, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/signout/actions";

interface HeaderProps {
  /** Accent color theme — blue/indigo for professors, emerald/teal for students. */
  variant?: "professor" | "student";
}

/**
 * Shared application header with Academeet branding, profile link, and sign-out.
 * Uses a Server Action for secure sign-out.
 */
export function Header({ variant = "professor" }: HeaderProps) {
  const gradientClass =
    variant === "professor"
      ? "from-blue-600 to-indigo-600 shadow-blue-600/20"
      : "from-emerald-600 to-teal-600 shadow-emerald-600/20";

  return (
    <header className="border-b border-zinc-200/60 bg-white/70 backdrop-blur-lg dark:border-zinc-800/60 dark:bg-zinc-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br ${gradientClass} text-white shadow-md`}
          >
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Academeet
          </span>
        </div>

        <div className="flex items-center gap-1">
          <a href="/profile">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </a>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
