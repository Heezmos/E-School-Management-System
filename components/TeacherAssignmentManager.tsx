"use client";
import { FormEvent,useState } from "react";
import { useRouter } from "next/navigation";

type Option={id:string;label:string;extra?:string};
type Assignment={id:string;teacher:string;teacher_number:string;year:string;term:string;class_name:string;subject:string;assignment_type:string;status:string};

export default function TeacherAssignmentManager({teachers,years,terms,classes,subjects,assignments}:{teachers:Option[];years:Option[];terms:(Option&{extra?:string})[];classes:(Option&{extra?:string})[];subjects:Option[];assignments:Assignment[]}){
 const router=useRouter(); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMsg("");const f=new FormData(e.currentTarget);const body=Object.fromEntries(f.entries());const r=await fetch("/api/school-admin/teacher-assignments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();setBusy(false);if(!r.ok){setMsg(d.error||"Unable to create assignment.");return;}setMsg("Teacher assignment created.");(e.currentTarget as HTMLFormElement).reset();router.refresh();}
 async function toggle(a:Assignment){setMsg("");const r=await fetch("/api/school-admin/teacher-assignments",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:a.id,status:a.status==="active"?"inactive":"active"})});const d=await r.json();if(!r.ok){setMsg(d.error||"Unable to update assignment.");return;}router.refresh();}
 async function remove(a:Assignment){if(!confirm(`Remove ${a.teacher}'s ${a.subject} assignment from ${a.class_name}?`))return;const r=await fetch(`/api/school-admin/teacher-assignments?id=${a.id}`,{method:"DELETE"});const d=await r.json();if(!r.ok){setMsg(d.error||"Unable to remove assignment.");return;}router.refresh();}
 return <>
  <section className="premium-panel"><div className="panelhead"><div><h2>Assign Teacher</h2><p className="note">Connect a teacher to a class, subject, academic year and optional term.</p></div></div>
   <form className="form-grid" onSubmit={submit}>
    <div className="field"><label>Teacher</label><select name="teacher_id" required><option value="">Select teacher</option>{teachers.map(x=><option key={x.id} value={x.id}>{x.label}{x.extra?` · ${x.extra}`:""}</option>)}</select></div>
    <div className="field"><label>Academic Year</label><select name="academic_year_id" required><option value="">Select year</option>{years.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
    <div className="field"><label>Term</label><select name="term_id"><option value="">Whole year / no term</option>{terms.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
    <div className="field"><label>Class</label><select name="class_id" required><option value="">Select class</option>{classes.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
    <div className="field"><label>Subject</label><select name="subject_id" required><option value="">Select subject</option>{subjects.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
    <div className="field"><label>Assignment Type</label><select name="assignment_type" defaultValue="subject_teacher"><option value="subject_teacher">Subject Teacher</option><option value="class_teacher">Class Teacher</option><option value="assistant_teacher">Assistant Teacher</option></select></div>
    <div style={{gridColumn:"1/-1"}}><button className="premium-button" disabled={busy}>{busy?"Assigning...":"Create Assignment"}</button></div>
   </form>{msg&&<div className="system-message" style={{marginTop:14}}>{msg}</div>}
  </section>
  <section className="premium-panel" style={{marginTop:18}}><div className="panelhead"><div><h2>Teaching Assignments</h2><p className="note">These assignments control what each teacher can work with in their portal.</p></div><span className="count-badge">{assignments.length}</span></div>
   <div className="tablewrap"><table className="premium-table"><thead><tr><th>TEACHER</th><th>CLASS</th><th>SUBJECT</th><th>YEAR / TERM</th><th>TYPE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{assignments.length?assignments.map(a=><tr key={a.id}><td><b>{a.teacher}</b><br/><small>{a.teacher_number}</small></td><td>{a.class_name}</td><td>{a.subject}</td><td>{a.year}<br/><small>{a.term}</small></td><td>{a.assignment_type.replaceAll("_"," ")}</td><td><span className={`pill ${a.status==="active"?"greenpill":"amberpill"}`}>{a.status}</span></td><td><div className="admin-actions"><button className="mini-btn" onClick={()=>toggle(a)}>{a.status==="active"?"Deactivate":"Activate"}</button><button className="mini-btn danger-btn" onClick={()=>remove(a)}>Remove</button></div></td></tr>):<tr><td colSpan={7}>No teaching assignments yet.</td></tr>}</tbody></table></div>
  </section>
 </>;
}
