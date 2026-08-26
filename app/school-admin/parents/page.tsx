import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import GuardianLinkManager from "@/components/GuardianLinkManager";
import ParentCreateForm from "@/components/ParentCreateForm";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=[{label:"Dashboard",href:"/school-admin",icon:"⌂",group:"OVERVIEW"},{label:"School Setup",href:"/school-admin/setup",icon:"⚙",group:"OVERVIEW"},{label:"User Management",href:"/school-admin/users",icon:"♙",group:"PEOPLE"},{label:"Teachers",href:"/school-admin/teachers",icon:"♟",group:"PEOPLE"},{label:"Students",href:"/school-admin/students",icon:"♚",group:"PEOPLE"},{label:"Parents & Guardians",href:"/school-admin/parents",icon:"♧",group:"PEOPLE"},{label:"Classes",href:"/school-admin/classes",icon:"▦",group:"ACADEMICS"},{label:"Subjects",href:"/school-admin/subjects",icon:"▤",group:"ACADEMICS"},{label:"Assessments",href:"/school-admin/assessments",icon:"✓",group:"ACADEMICS"},{label:"Attendance",href:"/school-admin/attendance",icon:"◷",group:"ACADEMICS"},{label:"Results & Reports",href:"/school-admin/results",icon:"▥",group:"ACADEMICS"},{label:"Analytics",href:"/school-admin/analytics",icon:"⌁",group:"ACADEMICS"}];

export default async function ParentsPage(){
 const ctx=await getPrimaryRole(); if(ctx.role!=="school_admin") redirect("/"); const supabase=await createClient(); const schoolId=ctx.schoolId!;
 const [guardians,students,links]=await Promise.all([
  supabase.from("guardians").select("id,occupation,address,profiles(first_name,last_name,email,phone,is_active)").eq("school_id",schoolId).order("created_at",{ascending:false}),
  supabase.from("students").select("id,student_number,first_name,last_name,status").eq("school_id",schoolId).eq("status","active").order("last_name"),
  supabase.from("student_guardians").select("id,relationship,is_primary,can_receive_notifications,guardians(profiles(first_name,last_name,email)),students(student_number,first_name,last_name)").eq("school_id",schoolId).order("created_at",{ascending:false})
 ]);
 const guardianOptions=(guardians.data||[]).map((g:any)=>({id:g.id,label:`${g.profiles?.first_name||""} ${g.profiles?.last_name||""}`.trim()||"Guardian",extra:g.profiles?.email||""}));
 const studentOptions=(students.data||[]).map((s:any)=>({id:s.id,label:`${s.first_name} ${s.last_name}`,extra:s.student_number}));
 const linkRows=(links.data||[]).map((l:any)=>({id:l.id,guardian:`${l.guardians?.profiles?.first_name||""} ${l.guardians?.profiles?.last_name||""}`.trim()||"Guardian",guardian_email:l.guardians?.profiles?.email||"",student:`${l.students?.first_name||""} ${l.students?.last_name||""}`.trim(),student_number:l.students?.student_number||"",relationship:l.relationship,is_primary:l.is_primary,can_receive_notifications:l.can_receive_notifications}));
 return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}>
  <section className="hero"><div><h1>Parents & Guardians</h1><p>Create guardian accounts and control exactly which students each parent is allowed to monitor.</p></div></section>
  <section className="stats"><article className="stat"><div><small>Guardians</small><div className="value">{guardians.data?.length||0}</div></div></article><article className="stat"><div><small>Linked Relationships</small><div className="value">{linkRows.length}</div></div></article><article className="stat"><div><small>Primary Guardians</small><div className="value">{linkRows.filter((x:any)=>x.is_primary).length}</div></div></article><article className="stat"><div><small>Students</small><div className="value">{students.data?.length||0}</div></div></article></section>
  <ParentCreateForm/>
  <section className="premium-panel" style={{marginTop:18}}><div className="panelhead"><div><h2>Guardian Directory</h2><p className="note">All parent and guardian accounts created under this school.</p></div></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>GUARDIAN</th><th>EMAIL</th><th>PHONE</th><th>OCCUPATION</th><th>STATUS</th></tr></thead><tbody>{guardians.data?.length?guardians.data.map((g:any)=><tr key={g.id}><td><b>{g.profiles?.first_name} {g.profiles?.last_name}</b></td><td>{g.profiles?.email||"—"}</td><td>{g.profiles?.phone||"—"}</td><td>{g.occupation||"—"}</td><td><span className={`pill ${g.profiles?.is_active!==false?"greenpill":"amberpill"}`}>{g.profiles?.is_active!==false?"Active":"Inactive"}</span></td></tr>):<tr><td colSpan={5}>No parent or guardian accounts yet.</td></tr>}</tbody></table></div></section>
  <div style={{marginTop:18}}><GuardianLinkManager guardians={guardianOptions} students={studentOptions} links={linkRows}/></div>
 </PremiumShell>;
}
