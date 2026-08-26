import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "super_admin") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const body = await request.json();
  const name = String(body.name || "").trim();
  const code = String(body.code || "").trim().toUpperCase();
  const price = Number(body.price || 0);
  if (!name || !code || !Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Plan name, code and valid price are required." }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("subscription_plans").insert({
    name, code, description: String(body.description || "").trim() || null,
    billing_cycle: body.billing_cycle || "monthly", price,
    currency: String(body.currency || "SLE").trim().toUpperCase(),
    max_students: body.max_students ? Number(body.max_students) : null,
    max_teachers: body.max_teachers ? Number(body.max_teachers) : null,
    is_active: true
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ user_id: ctx.user.id, action: "create_subscription_plan", entity_type: "subscription_plan", entity_id: data.id, metadata: { name, code } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "super_admin") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const body = await request.json();
  const admin = createAdminClient();
  const { error } = await admin.from("subscription_plans").update({ is_active: !!body.is_active, updated_at: new Date().toISOString() }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
