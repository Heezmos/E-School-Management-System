import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lgeqqfiicjvzgadzckyx.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_vcRfuM8Ae_qupz95DcHXLw_GHRJ5HOw";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot always write cookies.
          }
        }
      }
    }
  );
}
