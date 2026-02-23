import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js middleware that:
 * 1. Refreshes the Supabase auth session on every request.
 * 2. Redirects unauthenticated users to `/login`.
 * 3. Enforces role-based access on `/professor/*` and `/student/*` routes.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — IMPORTANT: do not remove this line
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Public routes (no auth required) ──────────────────────
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // If user is already logged in and tries to visit login/signup, send to dashboard
  if (user && isPublicPath) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // If no profile exists (e.g. trigger failed), sign out and let them through
    if (!profile) {
      await supabase.auth.signOut();
      return supabaseResponse;
    }

    const destination =
      profile.role === "professor"
        ? "/professor/dashboard"
        : "/student/dashboard";

    return NextResponse.redirect(new URL(destination, request.url));
  }

  // If not logged in and trying to access a protected route → login
  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Role-based route guards ───────────────────────────────
  if (user) {
    const isProfessorRoute = pathname.startsWith("/professor");
    const isStudentRoute = pathname.startsWith("/student");

    if (isProfessorRoute || isStudentRoute) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // Profile not found — redirect to login
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Professor trying to access student routes → professor dashboard
      if (isStudentRoute && profile.role !== "student") {
        return NextResponse.redirect(
          new URL("/professor/dashboard", request.url)
        );
      }

      // Student trying to access professor routes → student dashboard
      if (isProfessorRoute && profile.role !== "professor") {
        return NextResponse.redirect(
          new URL("/student/dashboard", request.url)
        );
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico   (favicon)
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
