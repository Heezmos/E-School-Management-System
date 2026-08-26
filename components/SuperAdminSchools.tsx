"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type School = { id:string; name:string; school_code:string; email:string|null; phone:string|null; city:string|null; country:string|null; status:string; created_at:string };

export default function SuperAdminSchools({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [showForm,setShowForm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function createSchool(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const form=new FormData(e.currentTarget);
    const payload=Object.fromEntries(form.entries());
    const res=await fetch("/api/admin/schools",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await res.json(); setBusy(false);
    if(!res.ok){setMessage(data.error||"Unable to create school.");return;}
    setMessage(`School ${data.school.name} created successfully.`); setShowForm(false); router.refresh();
  }

  return <>
    <section className="panel">
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        <div><h2>Schools</h2><p>Register and manage school tenants on the E-School platform.</p></div>
        <button className="primary" onClick={()=>setShowForm(v=>!v)}>{showForm?"Close":"+ Add School"}</button>
      </div>
      {message && <div className="empty" style={{marginTop:14}}>{message}</div>}
    </section>

    {showForm && <section className="panel" style={{marginTop:18}}><h2>Register New School</h2>
      <form onSubmit={createSchool} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginTop:16}}>
        <label>School Name<input name="name" required placeholder="e.g. Freetown International Academy" /></label>
        <label>School Code<input name="school_code" required placeholder="e.g. FIA001" /></label>
        <label>Official Email<input name="email" type="email" placeholder="school@example.com" /></label>
        <label>Phone<input name="phone" placeholder="+232..." /></label>
        <label>City<input name="city" placeholder="Freetown" /></label>
        <label>Country<input name="country" defaultValue="Sierra Leone" /></label>
        <label style={{gridColumn:"1 / -1"}}>Address<input name="address" placeholder="School address" /></label>
        <div style={{gridColumn:"1 / -1",display:"flex",justifyContent:"flex-end"}}><button className="primary" disabled={busy}>{busy?"Creating...":"Create School"}</button></div>
      </form>
    </section>}

    <section className="panel" style={{marginTop:18}}><h2>Registered Schools</h2>
      <div className="tablewrap"><table className="premium-table"><thead><tr><th>SCHOOL</th><th>CODE</th><th>LOCATION</th><th>CONTACT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
        {schools.length?schools.map(s=><tr key={s.id}><td><b>{s.name}</b><br/><small>{s.country||""}</small></td><td>{s.school_code}</td><td>{s.city||"—"}</td><td>{s.email||s.phone||"—"}</td><td><span className="pill greenpill">{s.status}</span></td><td><a className="linkbtn" href={`/super-admin/schools/${s.id}`}>Manage</a></td></tr>):<tr><td colSpan={6}>No schools registered yet. Use Add School to create the first tenant.</td></tr>}
      </tbody></table></div>
    </section>
  </>;
}
