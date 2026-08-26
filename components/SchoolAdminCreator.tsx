"use client";
import { FormEvent,useState } from "react";
import { useRouter } from "next/navigation";

export default function SchoolAdminCreator({schoolId,schoolName}:{schoolId:string;schoolName:string}){
 const router=useRouter(); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const f=new FormData(e.currentTarget);const payload={...Object.fromEntries(f.entries()),school_id:schoolId,role:"school_admin"};const r=await fetch("/api/admin/users/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();setBusy(false);if(!r.ok){setMessage(d.error||"Unable to create administrator.");return;}setMessage("School Administrator created and linked to this school.");(e.target as HTMLFormElement).reset();router.refresh();}
 return <section className="panel" style={{marginTop:18}}><h2>Create School Administrator</h2><p>This account will automatically be assigned to <b>{schoolName}</b> as its School Admin.</p><form onSubmit={submit} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginTop:16}}><label>First Name<input name="first_name" required /></label><label>Last Name<input name="last_name" required /></label><label style={{gridColumn:"1 / -1"}}>Login Email<input name="email" type="email" required placeholder="admin@school.com" /></label><div style={{gridColumn:"1 / -1",display:"flex",justifyContent:"flex-end"}}><button className="primary" disabled={busy}>{busy?"Creating...":"Create School Admin"}</button></div></form>{message&&<div className="empty" style={{marginTop:14}}>{message}</div>}</section>;
}
