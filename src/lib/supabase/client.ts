import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton: the browser only ever needs one Supabase client per tab. Creating
// new instances in render bodies gives each component a fresh reference on
// every render, which invalidates useEffect / useCallback deps that include
// `supabase` — cascading refetches and form remounts.
let browserClient: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
