"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type School = { id:string; name:string; school_code:string; email:string|null; phone:string|null; city:string|null; country:string|null; status:string; created_at:string };

export default function SuperAdminSchools({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [showForm,setShowForm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function createSchool(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage(""); setError("");
    const form=new FormData(e.currentTarget);
    const payload=Object.fromEntries(form.entries());
    const res=await fetch("/api/admin/schools",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await res.json(); setBusy(false);
    if(!res.ok){setError(data.error||"Unable to create school.");return;}
    setMessage(`School ${data.school.name} created successfully.`); setShowForm(false); router.refresh();
  }

  return <>
    <section className="premium-panel">
      <div className="panelhead" style={{alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:".11em",color:"#718096",textTransform:"uppercase",marginBottom:8}}>Tenant Management</div>
          <h2 style={{fontSize:22}}>Schools</h2>
          <p style={{color:"#718096",margin:"7px 0 0",maxWidth:680,lineHeight:1.6}}>Create and manage independent school workspaces. Each school receives its own backend identity and can later be assigned one or more School Administrators.</p>
        </div>
        <button className="premium-button" onClick={()=>setShowForm(v=>!v)}>{showForm?"Close Form":"+ Register School"}</button>
      </div>
      {error && <div className="error">{error}</div>}
      {message && <div style={{marginTop:14,padding:"12px 14px",borderRadius:12,background:"#eaf8f2",color:"#17865c",fontSize:13,fontWeight:700}}>{message}</div>}
    </section>

    {showForm && <section className="premium-panel" style={{marginTop:18}}>
      <div className="panelhead"><div><h2>Register New School</h2><p style={{color:"#718096",margin:"6px 0 0"}}>Enter the school's official platform information. You can create its first administrator after registration.</p></div><span className="badge">Step 1 of 2</span></div>
      <form onSubmit={createSchool} className="form-grid">
        <div className="field"><label>School Name</label><input name="name" required placeholder="e.g. Freetown International Academy" /></div>
        <div className="field"><label>School Code</label><input name="school_code" required placeholder="e.g. FIA001" /></div>
        <div className="field"><label>Official Email</label><input name="email" type="email" placeholder="school@example.com" /></div>
        <div className="field"><label>Phone</label><input name="phone" placeholder="+232..." /></div>
        <div className="field"><label>City</label><input name="city" placeholder="Freetown" /></div>
        <div className="field"><label>Country</label><input name="country" defaultValue="Sierra Leone" /></div>
        <div className="field" style={{gridColumn:"1 / -1"}}><label>Address</label><input name="address" placeholder="School address" /></div>
        <div style={{gridColumn:"1 / -1",display:"flex",justifyContent:"flex-end",gap:10}}>
          <button type="button" className="linkbtn" onClick={()=>setShowForm(false)}>Cancel</button>
          <button className="premium-button" disabled={busy}>{busy?"Creating school...":"Create School"}</button>
        </div>
      </form>
    </section>}

    <section className="premium-panel" style={{marginTop:18}}>
      <div className="panelhead"><div><h2>Registered Schools</h2><p style={{color:"#718096",margin:"6px 0 0"}}>{schools.length} school{schools.length===1?"":"s"} currently registered on E-School.</p></div></div>
      <div className="tablewrap"><table className="premium-table"><thead><tr><th>SCHOOL</th><th>CODE</th><th>LOCATION</th><th>CONTACT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
        {schools.length?schools.map(s=><tr key={s.id}><td><b>{s.name}</b><br/><small>{s.country||""}</small></td><td><b>{s.school_code}</b></td><td>{s.city||"—"}</td><td>{s.email||s.phone||"—"}</td><td><span className={`pill ${s.status==="active"?"greenpill":"amberpill"}`}>{s.status}</span></td><td><a className="premium-button" style={{display:"inline-block",padding:"8px 11px"}} href={`/super-admin/schools/${s.id}`}>Manage</a></td></tr>):<tr><td colSpan={6}><div className="empty">No schools registered yet. Use <b>Register School</b> to create the first tenant.</div></td></tr>}
      </tbody></table></div>
    </section>
  </>;
}
