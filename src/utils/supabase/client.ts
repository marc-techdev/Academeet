import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client configured for use in Next.js **Client Components**.
 *
 * This client automatically manages auth tokens via browser cookies and is
 * safe to instantiate multiple times — `@supabase/ssr` de-duplicates under
 * the hood with a singleton pattern.
 *
 * @returns A typed Supabase browser client instance.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
