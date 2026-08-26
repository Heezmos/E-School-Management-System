import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lgeqqfiicjvzgadzckyx.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_vcRfuM8Ae_qupz95DcHXLw_GHRJ5HOw";

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}
