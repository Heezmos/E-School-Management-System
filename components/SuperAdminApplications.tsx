"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminApplications({ applications }:{ applications:any[] }){
  const router=useRouter();
  const [showForm,setShowForm]=useState(false);
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");

  async function create(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy("create"); setMessage("");
    const form=new FormData(e.currentTarget);
    const res=await fetch("/api/admin/applications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(form.entries()))});
    const data=await res.json(); setBusy("");
    if(!res.ok){setMessage(data.error||"Unable to create application.");return;}
    setShowForm(false); setMessage("Application added successfully."); router.refresh();
  }

  async function review(id:string,action:"approve"|"reject"){
    const ok=confirm(action==="approve"?"Approve this application and create the school tenant?":"Reject this school application?");
    if(!ok)return;
    setBusy(id+action); setMessage("");
    const res=await fetch("/api/admin/applications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({application_id:id,action})});
    const data=await res.json(); setBusy("");
    if(!res.ok){setMessage(data.error||"Unable to review application.");return;}
    setMessage(action==="approve"?`Application approved. ${data.school?.name||"School"} has been created.`:"Application rejected."); router.refresh();
  }

  const pending=applications.filter((a)=>a.status==="pending").length;
  const approved=applications.filter((a)=>a.status==="approved").length;
  const rejected=applications.filter((a)=>a.status==="rejected").length;

  return <>
    <section className="panel">
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        <div><h2>School Applications</h2><p>Review requests from schools that want to join the E-School platform.</p></div>
        <button className="primary" onClick={()=>setShowForm(v=>!v)}>{showForm?"Close":"+ Add Application"}</button>
      </div>
      {message&&<div className="empty" style={{marginTop:14}}>{message}</div>}
    </section>

    <section className="stats" style={{marginTop:18}}>
      <article className="stat"><div><small>Total Applications</small><div className="value">{applications.length}</div></div></article>
      <article className="stat"><div><small>Pending Review</small><div className="value">{pending}</div></div></article>
      <article className="stat"><div><small>Approved</small><div className="value">{approved}</div></div></article>
      <article className="stat"><div><small>Rejected</small><div className="value">{rejected}</div></div></article>
    </section>

    {showForm&&<section className="panel" style={{marginTop:18}}><h2>Add School Application</h2><p>This manual entry is useful for phone, email or in-person applications.</p><form className="form-grid" onSubmit={create} style={{marginTop:16}}>
      <label className="field"><span>School Name</span><input name="school_name" required /></label>
      <label className="field"><span>Preferred School Code</span><input name="school_code" placeholder="Optional" /></label>
      <label className="field"><span>Contact Person</span><input name="contact_name" required /></label>
      <label className="field"><span>Contact Email</span><input name="contact_email" type="email" required /></label>
      <label className="field"><span>Phone</span><input name="contact_phone" /></label>
      <label className="field"><span>City</span><input name="city" /></label>
      <label className="field"><span>Country</span><input name="country" defaultValue="Sierra Leone" /></label>
      <label className="field"><span>Address</span><input name="address" /></label>
      <label className="field" style={{gridColumn:"1 / -1"}}><span>Notes</span><textarea name="notes" rows={3} placeholder="Any additional information about the application" /></label>
      <div style={{gridColumn:"1 / -1",display:"flex",justifyContent:"flex-end"}}><button className="primary" disabled={busy==="create"}>{busy==="create"?"Saving...":"Save Application"}</button></div>
    </form></section>}

    <section className="panel" style={{marginTop:18}}><div className="panelhead"><div><h2>Application Register</h2><p>Approve suitable schools or reject applications that should not proceed.</p></div></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>SCHOOL</th><th>CONTACT</th><th>LOCATION</th><th>STATUS</th><th>SUBMITTED</th><th>ACTIONS</th></tr></thead><tbody>{applications.length?applications.map((a)=><tr key={a.id}><td><b>{a.school_name}</b><br/><small>{a.school_code||"Code assigned on approval"}</small></td><td>{a.contact_name}<br/><small>{a.contact_email}{a.contact_phone?` · ${a.contact_phone}`:""}</small></td><td>{[a.city,a.country].filter(Boolean).join(", ")||"—"}</td><td><span className={`pill ${a.status==="approved"?"greenpill":a.status==="pending"?"amberpill":""}`}>{a.status}</span></td><td>{new Date(a.created_at).toLocaleDateString()}</td><td>{a.status==="pending"?<div className="row-actions"><button className="mini-btn success-btn" disabled={!!busy} onClick={()=>review(a.id,"approve")}>Approve</button><button className="mini-btn warning-btn" disabled={!!busy} onClick={()=>review(a.id,"reject")}>Reject</button></div>:<span>Reviewed</span>}</td></tr>):<tr><td colSpan={6}>No school applications yet.</td></tr>}</tbody></table></div></section>
  </>;
}
