import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Browser/server-safe public credentials for the E-School Supabase project.
// User authorization remains enforced by Supabase Auth and RLS.
const SUPABASE_URL = "https://lgeqqfiicjvzgadzckyx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZXFxZmlpY2p2emdhZHpja3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzM5MzMsImV4cCI6MjEwMzE0OTkzM30.bjDJgN33OJ3S29ZuG9w1O4s-Z_hkt8O5M_jeeSeHEMQ";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
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
