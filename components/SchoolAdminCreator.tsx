"use client";
import { FormEvent,useState } from "react";
import { useRouter } from "next/navigation";

export default function SchoolAdminCreator({schoolId,schoolName}:{schoolId:string;schoolName:string}){
 const router=useRouter(); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");setError("");
  const f=new FormData(e.currentTarget);
  const password=String(f.get("password")||""); const confirm=String(f.get("confirm_password")||"");
  if(password!==confirm){setBusy(false);setError("Temporary passwords do not match.");return;}
  const payload={...Object.fromEntries(f.entries()),school_id:schoolId,role:"school_admin"}; delete (payload as any).confirm_password;
  const r=await fetch("/api/admin/users/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const d=await r.json();setBusy(false);
  if(!r.ok){setError(d.error||"Unable to create administrator.");return;}
  setMessage("School Administrator created. They must use the temporary password for first login and will be required to set a new password immediately.");
  (e.target as HTMLFormElement).reset();router.refresh();
 }
 return <section className="premium-panel onboarding-card" style={{marginTop:18}}>
  <div className="panelhead"><div><h2>Create School Administrator</h2><p className="section-copy">Create the first administrator for <b>{schoolName}</b>. Their access will be locked to this school automatically.</p></div><span className="badge">Secure setup</span></div>
  <form onSubmit={submit} className="form-grid onboarding-form">
   <div className="field"><label>First Name</label><input name="first_name" required placeholder="First name" /></div>
   <div className="field"><label>Last Name</label><input name="last_name" required placeholder="Last name" /></div>
   <div className="field" style={{gridColumn:"1 / -1"}}><label>Login Email</label><input name="email" type="email" required placeholder="admin@school.com" /></div>
   <div className="field"><label>Temporary Password</label><input name="password" type="password" minLength={8} required placeholder="Minimum 8 characters" /></div>
   <div className="field"><label>Confirm Temporary Password</label><input name="confirm_password" type="password" minLength={8} required placeholder="Re-enter temporary password" /></div>
   <div className="credential-note" style={{gridColumn:"1 / -1"}}><b>First-login security:</b> the administrator signs in with this temporary password and E-School immediately forces them to create and confirm a new private password before entering the school dashboard.</div>
   <div style={{gridColumn:"1 / -1",display:"flex",justifyContent:"flex-end"}}><button className="premium-button" disabled={busy}>{busy?"Creating administrator...":"Create School Admin"}</button></div>
  </form>
  {error&&<div className="error">{error}</div>}{message&&<div className="success-box">{message}</div>}
 </section>;
}
