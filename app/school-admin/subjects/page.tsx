import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { label:"Dashboard", href:"/school-admin", icon:"⌂", group:"OVERVIEW" }, { label:"School Setup", href:"/school-admin/setup", icon:"⚙", group:"OVERVIEW" }, { label:"User Management", href:"/school-admin/users", icon:"♙", group:"PEOPLE" }, { label:"Teachers", href:"/school-admin/teachers", icon:"♟", group:"PEOPLE" }, { label:"Students", href:"/school-admin/students", icon:"♚", group:"PEOPLE" }, { label:"Parents & Guardians", href:"/school-admin/parents", icon:"♧", group:"PEOPLE" }, { label:"Classes", href:"/school-admin/classes", icon:"▦", group:"ACADEMICS" }, { label:"Subjects", href:"/school-admin/subjects", icon:"▤", group:"ACADEMICS" }, { label:"Assessments", href:"/school-admin/assessments", icon:"✓", group:"ACADEMICS" }, { label:"Attendance", href:"/school-admin/attendance", icon:"◷", group:"ACADEMICS" }, { label:"Results & Reports", href:"/school-admin/results", icon:"▥", group:"ACADEMICS" }, { label:"Analytics", href:"/school-admin/analytics", icon:"⌁", group:"ACADEMICS" }
];
export default async function SubjectsPage() {
  const ctx=await getPrimaryRole(); if(ctx.role!=="school_admin") redirect("/");
  const supabase=await createClient();
  const {data}=await supabase.from("subjects").select("id,name,code,status").eq("school_id",ctx.schoolId).order("name");
  return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}><section className="hero"><div><h1>Subjects</h1><p>Subjects configured for this school.</p></div></section><section className="premium-panel"><div className="tablewrap"><table className="premium-table"><thead><tr><th>SUBJECT</th><th>CODE</th><th>STATUS</th></tr></thead><tbody>{data?.length?data.map((s:any)=><tr key={s.id}><td><b>{s.name}</b></td><td>{s.code||"—"}</td><td><span className="pill greenpill">{s.status}</span></td></tr>):<tr><td colSpan={3}>No subjects configured.</td></tr>}</tbody></table></div></section></PremiumShell>;
}
