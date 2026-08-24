import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { label:"Dashboard", href:"/school-admin", icon:"⌂", group:"OVERVIEW" }, { label:"School Setup", href:"/school-admin/setup", icon:"⚙", group:"OVERVIEW" }, { label:"User Management", href:"/school-admin/users", icon:"♙", group:"PEOPLE" }, { label:"Teachers", href:"/school-admin/teachers", icon:"♟", group:"PEOPLE" }, { label:"Students", href:"/school-admin/students", icon:"♚", group:"PEOPLE" }, { label:"Parents & Guardians", href:"/school-admin/parents", icon:"♧", group:"PEOPLE" }, { label:"Classes", href:"/school-admin/classes", icon:"▦", group:"ACADEMICS" }, { label:"Subjects", href:"/school-admin/subjects", icon:"▤", group:"ACADEMICS" }, { label:"Assessments", href:"/school-admin/assessments", icon:"✓", group:"ACADEMICS" }, { label:"Attendance", href:"/school-admin/attendance", icon:"◷", group:"ACADEMICS" }, { label:"Results & Reports", href:"/school-admin/results", icon:"▥", group:"ACADEMICS" }, { label:"Analytics", href:"/school-admin/analytics", icon:"⌁", group:"ACADEMICS" }
];
export default async function AttendancePage() {
 const ctx=await getPrimaryRole(); if(ctx.role!=="school_admin") redirect("/");
 const supabase=await createClient();
 const {data}=await supabase.from("attendance_sessions").select("id,attendance_date,status,classes(name),terms(name)").eq("school_id",ctx.schoolId).order("attendance_date",{ascending:false}).limit(50);
 return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}><section className="hero"><div><h1>Attendance</h1><p>Daily class attendance sessions.</p></div></section><section className="premium-panel"><div className="tablewrap"><table className="premium-table"><thead><tr><th>DATE</th><th>CLASS</th><th>TERM</th><th>STATUS</th></tr></thead><tbody>{data?.length?data.map((s:any)=><tr key={s.id}><td>{s.attendance_date}</td><td><b>{s.classes?.name||"—"}</b></td><td>{s.terms?.name||"—"}</td><td><span className="pill greenpill">{s.status}</span></td></tr>):<tr><td colSpan={4}>No attendance sessions yet.</td></tr>}</tbody></table></div></section></PremiumShell>;
}
