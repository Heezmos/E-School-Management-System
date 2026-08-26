import { createBrowserClient } from "@supabase/ssr";

// These are browser-safe Supabase client credentials for the E-School project.
// Authentication and data authorization are enforced by Supabase Auth and RLS.
const SUPABASE_URL = "https://lgeqqfiicjvzgadzckyx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZXFxZmlpY2p2emdhZHpja3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzM5MzMsImV4cCI6MjEwMzE0OTkzM30.bjDJgN33OJ3S29ZuG9w1O4s-Z_hkt8O5M_jeeSeHEMQ";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
