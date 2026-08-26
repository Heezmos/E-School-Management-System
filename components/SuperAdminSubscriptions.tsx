"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function daysRemaining(endDate?: string | null) {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}

function money(currency:string, amount:number) {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}

export default function SuperAdminSubscriptions({ plans, schools, subscriptions, payments }: { plans:any[]; schools:any[]; subscriptions:any[]; payments:any[] }) {
  const router = useRouter();
  const [busy,setBusy] = useState("");
  const [paymentSubscription,setPaymentSubscription] = useState("");

  const paymentTotals = useMemo(() => {
    const map = new Map<string,number>();
    payments.filter((p:any)=>p.status==="paid").forEach((p:any)=>map.set(p.currency,(map.get(p.currency)||0)+Number(p.amount||0)));
    return [...map.entries()];
  },[payments]);

  async function createPlan(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy("plan");
    const f=new FormData(e.currentTarget);
    const r=await fetch("/api/admin/subscriptions/plans",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f.entries()))});
    const d=await r.json(); setBusy("");
    if(!r.ok) return alert(d.error||"Unable to create plan.");
    (e.currentTarget as HTMLFormElement).reset(); router.refresh();
  }

  async function assign(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy("assign");
    const f=new FormData(e.currentTarget);
    const r=await fetch("/api/admin/subscriptions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f.entries()))});
    const d=await r.json(); setBusy("");
    if(!r.ok) return alert(d.error||"Unable to assign subscription.");
    (e.currentTarget as HTMLFormElement).reset(); router.refresh();
  }

  async function recordPayment(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy("payment");
    const f=new FormData(e.currentTarget);
    const r=await fetch("/api/admin/subscriptions/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f.entries()))});
    const d=await r.json(); setBusy("");
    if(!r.ok) return alert(d.error||"Unable to record payment.");
    (e.currentTarget as HTMLFormElement).reset(); setPaymentSubscription(""); router.refresh();
  }

  async function changeStatus(id:string,status:string) {
    setBusy(id+status);
    const r=await fetch("/api/admin/subscriptions",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});
    const d=await r.json(); setBusy("");
    if(!r.ok) return alert(d.error||"Unable to update subscription.");
    router.refresh();
  }

  async function togglePlan(id:string,is_active:boolean) {
    setBusy(id);
    const r=await fetch("/api/admin/subscriptions/plans",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,is_active})});
    const d=await r.json(); setBusy("");
    if(!r.ok) return alert(d.error||"Unable to update plan.");
    router.refresh();
  }

  return <>
    <section className="stats">
      <article className="stat"><div><small>Available Plans</small><div className="value">{plans.filter((p:any)=>p.is_active).length}</div></div></article>
      <article className="stat"><div><small>Paying Schools</small><div className="value">{subscriptions.filter((s:any)=>s.status==="active").length}</div></div></article>
      <article className="stat"><div><small>Payments Recorded</small><div className="value">{payments.filter((p:any)=>p.status==="paid").length}</div></div></article>
      <article className="stat"><div><small>Expiring ≤30 Days</small><div className="value">{subscriptions.filter((s:any)=>{const d=daysRemaining(s.ends_at);return d!==null&&d>=0&&d<=30&&["active","trial"].includes(s.status)}).length}</div></div></article>
    </section>

    <section className="premium-panel" style={{marginTop:18}}>
      <div className="panelhead"><div><h2>Payment Statistics</h2><p className="note">Platform-wide value of successful payments, grouped by currency.</p></div></div>
      <div className="stats">
        {paymentTotals.length ? paymentTotals.map(([currency,total])=><article className="stat" key={currency}><div><small>Total Paid · {currency}</small><div className="value" style={{fontSize:26}}>{money(currency,total)}</div></div></article>) : <div className="empty">No successful subscription payments recorded yet.</div>}
      </div>
    </section>

    <section className="premium-panel" style={{marginTop:18}}>
      <div className="panelhead"><div><h2>Payment Plans for Schools</h2><p className="note">Detailed packages schools can choose when subscribing to E-School.</p></div></div>
      <div className="premium-grid">
        {plans.length ? plans.map((p:any)=><article className="premium-panel" key={p.id} style={{margin:0}}>
          <div className="panelhead"><div><h2>{p.name}</h2><small>{p.code} · {p.billing_cycle}</small></div><span className={`pill ${p.is_active?"greenpill":"amberpill"}`}>{p.is_active?"Available":"Unavailable"}</span></div>
          <div className="value" style={{fontSize:30}}>{money(p.currency,Number(p.price))}</div>
          <p className="note">per {p.billing_cycle === "termly" ? "term" : p.billing_cycle === "annual" ? "year" : p.billing_cycle === "monthly" ? "month" : "billing period"}</p>
          {Number(p.setup_fee||0)>0&&<p><b>Setup fee:</b> {money(p.currency,Number(p.setup_fee))}</p>}
          <p><b>Capacity:</b> {p.max_students?`${p.max_students} students`:"Unlimited students"} · {p.max_teachers?`${p.max_teachers} teachers`:"Unlimited teachers"}</p>
          {p.trial_days>0&&<p><b>Trial:</b> {p.trial_days} days</p>}
          {p.grace_period_days>0&&<p><b>Payment grace:</b> {p.grace_period_days} days</p>}
          {p.description&&<p>{p.description}</p>}
          {Array.isArray(p.features)&&p.features.length>0&&<div>{p.features.map((f:string,i:number)=><div className="action" key={i}><div className="aico">✓</div><div><strong>{f}</strong></div></div>)}</div>}
          <button className="mini-btn" disabled={!!busy} onClick={()=>togglePlan(p.id,!p.is_active)}>{p.is_active?"Deactivate":"Activate"}</button>
        </article>) : <div className="empty">No payment plans have been created yet.</div>}
      </div>
    </section>

    <section className="premium-grid" style={{marginTop:18}}>
      <article className="premium-panel"><div className="panelhead"><div><h2>Create Payment Plan</h2><p className="note">Define pricing, limits, trial period and included services.</p></div></div><form className="form-grid" onSubmit={createPlan}>
        <label className="field"><span>Plan Name</span><input name="name" required placeholder="Standard"/></label>
        <label className="field"><span>Plan Code</span><input name="code" required placeholder="STANDARD"/></label>
        <label className="field"><span>Billing Cycle</span><select name="billing_cycle"><option value="monthly">Monthly</option><option value="termly">Termly</option><option value="annual">Annual</option><option value="custom">Custom</option></select></label>
        <label className="field"><span>Recurring Price</span><input name="price" type="number" min="0" step="0.01" required/></label>
        <label className="field"><span>Setup Fee</span><input name="setup_fee" type="number" min="0" step="0.01" defaultValue="0"/></label>
        <label className="field"><span>Currency</span><input name="currency" defaultValue="SLE"/></label>
        <label className="field"><span>Trial Days</span><input name="trial_days" type="number" min="0" defaultValue="0"/></label>
        <label className="field"><span>Grace Period Days</span><input name="grace_period_days" type="number" min="0" defaultValue="0"/></label>
        <label className="field"><span>Max Students</span><input name="max_students" type="number" min="1"/></label>
        <label className="field"><span>Max Teachers</span><input name="max_teachers" type="number" min="1"/></label>
        <label className="field" style={{gridColumn:"1/-1"}}><span>Description</span><textarea name="description" rows={3}/></label>
        <label className="field" style={{gridColumn:"1/-1"}}><span>Included Features</span><textarea name="features" rows={5} placeholder={'One feature per line\nStudent management\nParent portal\nAttendance & results'}/></label>
        <button className="premium-button" disabled={!!busy}>{busy==="plan"?"Creating...":"Create Payment Plan"}</button>
      </form></article>

      <article className="premium-panel"><div className="panelhead"><div><h2>Assign School Plan</h2><p className="note">Start a school's billing period. End date is calculated automatically for standard cycles if left blank.</p></div></div><form className="form-grid" onSubmit={assign}>
        <label className="field"><span>School</span><select name="school_id" required><option value="">Select school</option>{schools.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="field"><span>Plan</span><select name="plan_id" required><option value="">Select plan</option>{plans.filter((p:any)=>p.is_active).map((p:any)=><option key={p.id} value={p.id}>{p.name} · {money(p.currency,Number(p.price))}</option>)}</select></label>
        <label className="field"><span>Status</span><select name="status"><option value="active">Active</option><option value="trial">Trial</option><option value="past_due">Past Due</option><option value="suspended">Suspended</option></select></label>
        <label className="field"><span>Start Date</span><input name="starts_at" type="date" required/></label>
        <label className="field"><span>End Date (optional)</span><input name="ends_at" type="date"/></label>
        <label className="field"><span>Amount Override</span><input name="amount" type="number" min="0" step="0.01" placeholder="Use plan price"/></label>
        <label className="field"><span>Currency</span><input name="currency" defaultValue="SLE"/></label>
        <label className="field" style={{gridColumn:"1/-1"}}><span>Notes</span><textarea name="notes" rows={3}/></label>
        <button className="premium-button" disabled={!!busy}>{busy==="assign"?"Assigning...":"Assign Subscription"}</button>
      </form></article>
    </section>

    <section className="premium-panel" style={{marginTop:18}}><div className="panelhead"><div><h2>School Payment Breakdown</h2><p className="note">Current plan, amount due, amount paid, outstanding balance and time remaining for every school.</p></div></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>SCHOOL</th><th>PLAN</th><th>BILLING PERIOD</th><th>DUE</th><th>PAID</th><th>BALANCE</th><th>TIME LEFT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{subscriptions.length?subscriptions.map((s:any)=>{const paid=payments.filter((p:any)=>p.school_subscription_id===s.id&&p.status==="paid").reduce((n:number,p:any)=>n+Number(p.amount||0),0);const balance=Math.max(0,Number(s.amount||0)-paid);const days=daysRemaining(s.ends_at);return <tr key={s.id}><td><b>{s.schools?.name||"School"}</b><br/><small>{s.schools?.school_code||""}</small></td><td>{s.subscription_plans?.name||"—"}<br/><small>{s.subscription_plans?.billing_cycle||""}</small></td><td>{s.starts_at}<br/><small>{s.ends_at?`to ${s.ends_at}`:"Open-ended"}</small></td><td>{money(s.currency,Number(s.amount||0))}</td><td>{money(s.currency,paid)}</td><td><b>{money(s.currency,balance)}</b></td><td>{days===null?"—":days<0?`${Math.abs(days)} days overdue`:days===0?"Ends today":`${days} days remaining`}</td><td><span className={`pill ${["active","trial"].includes(s.status)?"greenpill":"amberpill"}`}>{s.status.replace("_"," ")}</span></td><td><button className="mini-btn" onClick={()=>setPaymentSubscription(s.id)}>Record Payment</button><br/><select value={s.status} disabled={!!busy} onChange={(e)=>changeStatus(s.id,e.target.value)} style={{marginTop:6}}><option value="trial">Trial</option><option value="active">Active</option><option value="past_due">Past Due</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select></td></tr>}):<tr><td colSpan={9}>No school subscriptions assigned yet.</td></tr>}</tbody></table></div></section>

    <section className="premium-grid" style={{marginTop:18}}>
      <article className="premium-panel"><div className="panelhead"><div><h2>Record School Payment</h2><p className="note">Capture manual bank, cash, mobile money or other subscription payments.</p></div></div><form className="form-grid" onSubmit={recordPayment}>
        <label className="field" style={{gridColumn:"1/-1"}}><span>School Subscription</span><select name="school_subscription_id" required value={paymentSubscription} onChange={(e)=>setPaymentSubscription(e.target.value)}><option value="">Select subscription</option>{subscriptions.map((s:any)=><option key={s.id} value={s.id}>{s.schools?.name} · {s.subscription_plans?.name}</option>)}</select></label>
        <label className="field"><span>Amount Paid</span><input name="amount" type="number" min="0.01" step="0.01" required/></label>
        <label className="field"><span>Currency</span><input name="currency" defaultValue="SLE"/></label>
        <label className="field"><span>Payment Date</span><input name="payment_date" type="date" required/></label>
        <label className="field"><span>Payment Method</span><select name="payment_method"><option value="bank_transfer">Bank Transfer</option><option value="mobile_money">Mobile Money</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option></select></label>
        <label className="field"><span>Reference</span><input name="reference" placeholder="Receipt / transaction reference"/></label>
        <label className="field"><span>Payment Status</span><select name="status"><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
        <label className="field" style={{gridColumn:"1/-1"}}><span>Notes</span><textarea name="notes" rows={3}/></label>
        <button className="premium-button" disabled={!!busy}>{busy==="payment"?"Recording...":"Record Payment"}</button>
      </form></article>

      <article className="premium-panel"><div className="panelhead"><div><h2>Recent Payments</h2><p className="note">Latest subscription payment transactions.</p></div></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>SCHOOL</th><th>DATE</th><th>AMOUNT</th><th>METHOD</th><th>REFERENCE</th><th>STATUS</th></tr></thead><tbody>{payments.length?payments.slice(0,20).map((p:any)=><tr key={p.id}><td><b>{p.schools?.name||"School"}</b></td><td>{p.payment_date}</td><td>{money(p.currency,Number(p.amount))}</td><td>{p.payment_method?.replace("_"," ")||"—"}</td><td>{p.reference||"—"}</td><td><span className={`pill ${p.status==="paid"?"greenpill":"amberpill"}`}>{p.status}</span></td></tr>):<tr><td colSpan={6}>No payments recorded yet.</td></tr>}</tbody></table></div></article>
    </section>
  </>;
}
