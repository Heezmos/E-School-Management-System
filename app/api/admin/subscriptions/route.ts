import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function addBillingPeriod(start: string, cycle: string) {
  const date = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (cycle === "monthly") date.setUTCMonth(date.getUTCMonth() + 1);
  else if (cycle === "termly") date.setUTCMonth(date.getUTCMonth() + 4);
  else if (cycle === "annual") date.setUTCFullYear(date.getUTCFullYear() + 1);
  else return null;
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0,10);
}

export async function POST(request: Request) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "super_admin") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const body = await request.json();
  if (!body.school_id || !body.plan_id || !body.starts_at) return NextResponse.json({ error: "School, plan and start date are required." }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("school_subscriptions").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("school_id", body.school_id).in("status", ["trial","active","past_due","suspended"]);
  const { data: plan } = await admin.from("subscription_plans").select("price,currency,billing_cycle,trial_days").eq("id", body.plan_id).maybeSingle();
  if (!plan) return NextResponse.json({ error: "Subscription plan not found." }, { status: 404 });
  const calculatedEnd = body.ends_at || addBillingPeriod(body.starts_at, plan.billing_cycle);
  const { data, error } = await admin.from("school_subscriptions").insert({
    school_id: body.school_id,
    plan_id: body.plan_id,
    status: body.status || "active",
    starts_at: body.starts_at,
    ends_at: calculatedEnd,
    amount: body.amount === "" || body.amount == null ? plan.price : Number(body.amount),
    currency: String(body.currency || plan.currency || "SLE").toUpperCase(),
    notes: String(body.notes || "").trim() || null,
    created_by: ctx.user.id
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ user_id: ctx.user.id, school_id: body.school_id, action: "assign_school_subscription", entity_type: "school_subscription", entity_id: data.id, metadata: { plan_id: body.plan_id, status: body.status || "active", ends_at: calculatedEnd } });
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
