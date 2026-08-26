"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminSubscriptions({ plans, schools, subscriptions }: { plans:any[]; schools:any[]; subscriptions:any[] }) {
  const router = useRouter();
  const [busy,setBusy] = useState("");

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
      <article className="stat"><div><small>Plans</small><div className="value">{plans.length}</div></div></article>
      <article className="stat"><div><small>Active Subscriptions</small><div className="value">{subscriptions.filter((s:any)=>s.status==="active").length}</div></div></article>
      <article className="stat"><div><small>Trials</small><div className="value">{subscriptions.filter((s:any)=>s.status==="trial").length}</div></div></article>
      <article className="stat"><div><small>Attention Needed</small><div className="value">{subscriptions.filter((s:any)=>["past_due","suspended","expired"].includes(s.status)).length}</div></div></article>
    </section>

    <section className="premium-grid" style={{marginTop:18}}>
      <article className="premium-panel"><div className="panelhead"><div><h2>Create Subscription Plan</h2><p className="note">Define the packages available to schools.</p></div></div><form className="form-grid" onSubmit={createPlan}>
        <label className="field"><span>Plan Name</span><input name="name" required placeholder="Standard"/></label>
        <label className="field"><span>Plan Code</span><input name="code" required placeholder="STANDARD"/></label>
        <label className="field"><span>Billing Cycle</span><select name="billing_cycle"><option value="monthly">Monthly</option><option value="termly">Termly</option><option value="annual">Annual</option><option value="custom">Custom</option></select></label>
        <label className="field"><span>Price</span><input name="price" type="number" min="0" step="0.01" required/></label>
        <label className="field"><span>Currency</span><input name="currency" defaultValue="SLE"/></label>
        <label className="field"><span>Max Students</span><input name="max_students" type="number" min="1"/></label>
        <label className="field"><span>Max Teachers</span><input name="max_teachers" type="number" min="1"/></label>
        <label className="field" style={{gridColumn:"1/-1"}}><span>Description</span><textarea name="description" rows={3}/></label>
        <button className="premium-button" disabled={!!busy}>{busy==="plan"?"Creating...":"Create Plan"}</button>
      </form></article>

      <article className="premium-panel"><div className="panelhead"><div><h2>Assign Subscription</h2><p className="note">Choose a school, plan and billing period.</p></div></div><form className="form-grid" onSubmit={assign}>
        <label className="field"><span>School</span><select name="school_id" required><option value="">Select school</option>{schools.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="field"><span>Plan</span><select name="plan_id" required><option value="">Select plan</option>{plans.filter((p:any)=>p.is_active).map((p:any)=><option key={p.id} value={p.id}>{p.name} · {p.currency} {Number(p.price).toFixed(2)}</option>)}</select></label>
        <label className="field"><span>Status</span><select name="status"><option value="active">Active</option><option value="trial">Trial</option><option value="past_due">Past Due</option><option value="suspended">Suspended</option></select></label>
        <label className="field"><span>Start Date</span><input name="starts_at" type="date" required/></label>
        <label className="field"><span>End Date</span><input name="ends_at" type="date"/></label>
        <label className="field"><span>Amount Override</span><input name="amount" type="number" min="0" step="0.01" placeholder="Use plan price"/></label>
        <label className="field"><span>Currency</span><input name="currency" defaultValue="SLE"/></label>
        <label className="field" style={{gridColumn:"1/-1"}}><span>Notes</span><textarea name="notes" rows={3}/></label>
        <button className="premium-button" disabled={!!busy}>{busy==="assign"?"Assigning...":"Assign Subscription"}</button>
      </form></article>
    </section>

    <section className="premium-panel" style={{marginTop:18}}><div className="panelhead"><div><h2>Subscription Plans</h2><p className="note">Current packages available on the platform.</p></div></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>PLAN</th><th>PRICE</th><th>CYCLE</th><th>LIMITS</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{plans.length?plans.map((p:any)=><tr key={p.id}><td><b>{p.name}</b><br/><small>{p.code}</small></td><td>{p.currency} {Number(p.price).toFixed(2)}</td><td>{p.billing_cycle}</td><td>{p.max_students?`${p.max_students} students`:"Unlimited students"}<br/><small>{p.max_teachers?`${p.max_teachers} teachers`:"Unlimited teachers"}</small></td><td><span className={`pill ${p.is_active?"greenpill":"amberpill"}`}>{p.is_active?"Active":"Inactive"}</span></td><td><button className="mini-btn" disabled={!!busy} onClick={()=>togglePlan(p.id,!p.is_active)}>{p.is_active?"Deactivate":"Activate"}</button></td></tr>):<tr><td colSpan={6}>No subscription plans yet.</td></tr>}</tbody></table></div></section>

    <section className="premium-panel" style={{marginTop:18}}><div className="panelhead"><div><h2>School Subscriptions</h2><p className="note">Manage each school's current access plan and subscription status.</p></div></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>SCHOOL</th><th>PLAN</th><th>PERIOD</th><th>AMOUNT</th><th>STATUS</th><th>MANAGE</th></tr></thead><tbody>{subscriptions.length?subscriptions.map((s:any)=><tr key={s.id}><td><b>{s.schools?.name||"School"}</b><br/><small>{s.schools?.school_code||""}</small></td><td>{s.subscription_plans?.name||"—"}<br/><small>{s.subscription_plans?.billing_cycle||""}</small></td><td>{s.starts_at}<br/><small>{s.ends_at?`to ${s.ends_at}`:"No end date"}</small></td><td>{s.currency} {Number(s.amount||0).toFixed(2)}</td><td><span className={`pill ${["active","trial"].includes(s.status)?"greenpill":"amberpill"}`}>{s.status.replace("_"," ")}</span></td><td><select value={s.status} disabled={!!busy} onChange={(e)=>changeStatus(s.id,e.target.value)}><option value="trial">Trial</option><option value="active">Active</option><option value="past_due">Past Due</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select></td></tr>):<tr><td colSpan={6}>No school subscriptions assigned yet.</td></tr>}</tbody></table></div></section>
  </>;
}
