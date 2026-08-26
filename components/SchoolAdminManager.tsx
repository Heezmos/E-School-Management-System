"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SchoolAdminManager.module.css";

type AdminRow = {
  user_id:string;
  first_name:string;
  last_name:string;
  email:string;
  is_active:boolean;
  must_change_password:boolean;
};

export default function SchoolAdminManager({ schoolId, admins }: { schoolId:string; admins:AdminRow[] }) {
  const router = useRouter();
  const [editing,setEditing] = useState<AdminRow|null>(null);
  const [busy,setBusy] = useState<string|null>(null);
  const [message,setMessage] = useState("");

  async function updateAdmin(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); if(!editing) return; setBusy(editing.user_id); setMessage("");
    const f=new FormData(e.currentTarget);
    const payload:any={first_name:f.get("first_name"),last_name:f.get("last_name"),email:f.get("email")};
    const temp=String(f.get("temporary_password")||""); if(temp) payload.temporary_password=temp;
    const r=await fetch(`/api/admin/schools/${schoolId}/admins/${editing.user_id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json(); setBusy(null);
    if(!r.ok){setMessage(d.error||"Unable to update administrator.");return;}
    setMessage("Administrator updated successfully."); setEditing(null); router.refresh();
  }

  async function toggleAdmin(a:AdminRow){
    setBusy(a.user_id); setMessage("");
    const r=await fetch(`/api/admin/schools/${schoolId}/admins/${a.user_id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_active:!a.is_active})});
    const d=await r.json(); setBusy(null);
    if(!r.ok){setMessage(d.error||"Unable to change status.");return;}
    setMessage(a.is_active?"Administrator deactivated.":"Administrator reactivated."); router.refresh();
  }

  async function removeAdmin(a:AdminRow){
    const name=`${a.first_name} ${a.last_name}`.trim()||a.email;
    if(!confirm(`Remove ${name} as a School Admin? This action cannot be undone.`)) return;
    setBusy(a.user_id); setMessage("");
    const r=await fetch(`/api/admin/schools/${schoolId}/admins/${a.user_id}`,{method:"DELETE"});
    const d=await r.json(); setBusy(null);
    if(!r.ok){setMessage(d.error||"Unable to remove administrator.");return;}
    setMessage("Administrator removed from this school."); router.refresh();
  }

  return <section className={`panel ${styles.wrap}`}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>ACCESS CONTROL</span><h2>School Administrators</h2><p>Manage every administrator attached to this school tenant.</p></div><span className={styles.count}>{admins.length}</span></div>
    {message&&<div className={styles.message}>{message}</div>}
    <div className="tablewrap"><table className="premium-table"><thead><tr><th>ADMINISTRATOR</th><th>EMAIL</th><th>FIRST LOGIN</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
      {admins.length?admins.map(a=><tr key={a.user_id}><td><b>{`${a.first_name} ${a.last_name}`.trim()||"Unnamed Admin"}</b></td><td>{a.email}</td><td>{a.must_change_password?<span className="pill amberpill">Password change required</span>:<span className="pill greenpill">Completed</span>}</td><td><span className={`pill ${a.is_active?"greenpill":"amberpill"}`}>{a.is_active?"Active":"Inactive"}</span></td><td><div className={styles.actions}><button className={styles.btn} onClick={()=>setEditing(a)}>Edit</button><button className={styles.btn} disabled={busy===a.user_id} onClick={()=>toggleAdmin(a)}>{a.is_active?"Deactivate":"Activate"}</button><button className={`${styles.btn} ${styles.danger}`} disabled={busy===a.user_id} onClick={()=>removeAdmin(a)}>Remove</button></div></td></tr>):<tr><td colSpan={5}>No School Admin has been assigned yet.</td></tr>}
    </tbody></table></div>

    {editing&&<div className={styles.backdrop} onClick={()=>setEditing(null)}><div className={styles.modal} onClick={e=>e.stopPropagation()}><div className={styles.modalHead}><div><span className={styles.eyebrow}>EDIT ADMINISTRATOR</span><h2>Update School Admin</h2></div><button className={styles.close} onClick={()=>setEditing(null)}>×</button></div><form onSubmit={updateAdmin} className={styles.form}><label><span>First Name</span><input name="first_name" defaultValue={editing.first_name} required/></label><label><span>Last Name</span><input name="last_name" defaultValue={editing.last_name} required/></label><label className={styles.wide}><span>Email Address</span><input name="email" type="email" defaultValue={editing.email} required/></label><label className={styles.wide}><span>Reset Temporary Password <small>(optional)</small></span><input name="temporary_password" type="password" minLength={8} placeholder="Leave blank to keep current password"/><small className={styles.hint}>If set, the admin will be forced to create a new password at their next login.</small></label><div className={`${styles.formActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={()=>setEditing(null)}>Cancel</button><button className="primary" disabled={busy===editing.user_id}>{busy===editing.user_id?"Saving...":"Save Changes"}</button></div></form></div></div>}
  </section>;
}
