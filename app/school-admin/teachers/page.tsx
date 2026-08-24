import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { label:"Dashboard", href:"/school-admin", icon:"⌂", group:"OVERVIEW" }, { label:"School Setup", href:"/school-admin/setup", icon:"⚙", group:"OVERVIEW" },
  { label:"User Management", href:"/school-admin/users", icon:"♙", group:"PEOPLE" }, { label:"Teachers", href:"/school-admin/teachers", icon:"♟", group:"PEOPLE" },
  { label:"Students", href:"/school-admin/students", icon:"♚", group:"PEOPLE" }, { label:"Parents & Guardians", href:"/school-admin/parents", icon:"♧", group:"PEOPLE" },
  { label:"Classes", href:"/school-admin/classes", icon:"▦", group:"ACADEMICS" }, { label:"Subjects", href:"/school-admin/subjects", icon:"▤", group:"ACADEMICS" },
  { label:"Assessments", href:"/school-admin/assessments", icon:"✓", group:"ACADEMICS" }, { label:"Attendance", href:"/school-admin/attendance", icon:"◷", group:"ACADEMICS" },
  { label:"Results & Reports", href:"/school-admin/results", icon:"▥", group:"ACADEMICS" }, { label:"Analytics", href:"/school-admin/analytics", icon:"⌁", group:"ACADEMICS" }
];

export default async function TeachersPage() {
  const ctx = await getPrimaryRole(); if(ctx.role!=="school_admin") redirect("/");
  const supabase = await createClient();
  const { data } = await supabase.from("teachers").select("id,teacher_number,employment_status,specialization,profiles(first_name,last_name,email)").eq("school_id",ctx.schoolId).order("created_at",{ascending:false});
  return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}><section className="hero"><div><h1>Teachers</h1><p>Live teacher records from Supabase.</p></div></section><section className="premium-panel"><div className="tablewrap"><table className="premium-table"><thead><tr><th>TEACHER</th><th>NUMBER</th><th>SPECIALIZATION</th><th>STATUS</th></tr></thead><tbody>{data?.length ? data.map((t:any)=><tr key={t.id}><td><b>{t.profiles?.first_name} {t.profiles?.last_name}</b><br/><small>{t.profiles?.email}</small></td><td>{t.teacher_number}</td><td>{t.specialization||"—"}</td><td><span className="pill greenpill">{t.employment_status}</span></td></tr>) : <tr><td colSpan={4}>No teachers yet. Create teacher accounts from User Management.</td></tr>}</tbody></table></div></section></PremiumShell>;
}
