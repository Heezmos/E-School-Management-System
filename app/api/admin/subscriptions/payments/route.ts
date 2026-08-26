import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "super_admin") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const body = await request.json();
  const subscriptionId = String(body.school_subscription_id || "");
  const amount = Number(body.amount);
  if (!subscriptionId || !Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Subscription and a valid payment amount are required." }, { status: 400 });

  const admin = createAdminClient();
  const { data: subscription } = await admin.from("school_subscriptions").select("id,school_id,currency,starts_at,ends_at").eq("id", subscriptionId).maybeSingle();
  if (!subscription) return NextResponse.json({ error: "School subscription not found." }, { status: 404 });

  const { data, error } = await admin.from("subscription_payments").insert({
    school_subscription_id: subscription.id,
    school_id: subscription.school_id,
    amount,
    currency: String(body.currency || subscription.currency || "SLE").toUpperCase(),
    payment_date: body.payment_date || new Date().toISOString().slice(0,10),
    payment_method: String(body.payment_method || "").trim() || null,
    reference: String(body.reference || "").trim() || null,
    period_start: body.period_start || subscription.starts_at || null,
    period_end: body.period_end || subscription.ends_at || null,
    status: body.status || "paid",
    notes: String(body.notes || "").trim() || null,
    recorded_by: ctx.user.id
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ user_id: ctx.user.id, school_id: subscription.school_id, action: "record_subscription_payment", entity_type: "subscription_payment", entity_id: data.id, metadata: { subscription_id: subscription.id, amount, currency: body.currency || subscription.currency } });
  return NextResponse.json({ ok: true });
}
