import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "super_admin") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const body = await request.json();
  if (!body.school_id || !body.plan_id || !body.starts_at) return NextResponse.json({ error: "School, plan and start date are required." }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("school_subscriptions").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("school_id", body.school_id).in("status", ["trial","active","past_due","suspended"]);
  const { data: plan } = await admin.from("subscription_plans").select("price,currency").eq("id", body.plan_id).maybeSingle();
  if (!plan) return NextResponse.json({ error: "Subscription plan not found." }, { status: 404 });
  const { data, error } = await admin.from("school_subscriptions").insert({
    school_id: body.school_id, plan_id: body.plan_id,
    status: body.status || "active", starts_at: body.starts_at,
    ends_at: body.ends_at || null,
    amount: body.amount === "" || body.amount == null ? plan.price : Number(body.amount),
    currency: String(body.currency || plan.currency || "SLE").toUpperCase(),
    notes: String(body.notes || "").trim() || null,
    created_by: ctx.user.id
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ user_id: ctx.user.id, school_id: body.school_id, action: "assign_school_subscription", entity_type: "school_subscription", entity_id: data.id, metadata: { plan_id: body.plan_id, status: body.status || "active" } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "super_admin") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const body = await request.json();
  const allowed = new Set(["trial","active","past_due","suspended","cancelled","expired"]);
  if (!allowed.has(body.status)) return NextResponse.json({ error: "Invalid subscription status." }, { status: 400 });
  const admin = createAdminClient();
  const { data: current } = await admin.from("school_subscriptions").select("school_id").eq("id", body.id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  const { error } = await admin.from("school_subscriptions").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ user_id: ctx.user.id, school_id: current.school_id, action: "change_subscription_status", entity_type: "school_subscription", entity_id: body.id, metadata: { status: body.status } });
  return NextResponse.json({ ok: true });
}
