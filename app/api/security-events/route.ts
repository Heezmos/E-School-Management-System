import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_ACTIONS = new Set(["login_failed"]);
const AUTH_ACTIONS = new Set(["login_success","logout","password_changed"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  if (!PUBLIC_ACTIONS.has(action) && !AUTH_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Unsupported security event." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !PUBLIC_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Unauthorized security event." }, { status: 401 });
  }

  let schoolId: string | null = null;
  if (user) {
    const { data: roles } = await supabase.from("user_school_roles").select("school_id,role,created_at").eq("user_id", user.id).eq("is_active", true);
    const schoolIds = [...new Set((roles || []).map((r:any)=>r.school_id).filter(Boolean))];
    schoolId = schoolIds.length === 1 ? schoolIds[0] : null;
  }

  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
  const agent = (request.headers.get("user-agent") || "").slice(0, 300);
  // Never persist a caller-supplied email for an authenticated event. Use the
  // authenticated identity; public failed-login attempts remain intentionally
  // unattributed to a user account.
  const email = String(user?.email || (PUBLIC_ACTIONS.has(action) ? body.email : "") || "").trim().toLowerCase().slice(0, 320) || null;

  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    school_id: schoolId,
    user_id: user?.id || null,
    action,
    entity_type: "authentication",
    entity_id: user?.id || null,
    new_values: { email, ip_address: ip, user_agent: agent, source: "e_school_web" },
    reason: "Automatically recorded authentication security event"
  });

  if (error) return NextResponse.json({ error: "Unable to record security event." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
