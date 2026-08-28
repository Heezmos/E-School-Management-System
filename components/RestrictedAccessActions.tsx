"use client";import{createClient}from"@/lib/supabase/client";
export default function RestrictedAccessActions(){async function signOut(){const s=createClient();await s.auth.signOut();location.href="/login"}return <button className="access-submit" onClick={signOut}>Sign out securely</button>}
