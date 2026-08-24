import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { label:"Dashboard", href:"/school-admin", icon:"⌂", group:"OVERVIEW" }, { label:"School Setup", href:"/school-admin/setup", icon:"⚙", group:"OVERVIEW" }, { label:"User Management", href:"/school-admin/users", icon:"♙", group:"PEOPLE" }, { label:"Teachers", href:"/school-admin/teachers", icon:"♟", group:"PEOPLE" }, { label:"Students", href:"/school-admin/students", icon:"♚", group:"PEOPLE" }, { label:"Parents & Guardians", href:"/school-admin/parents", icon:"♧", group:"PEOPLE" }, { label:"Classes", href:"/school-admin/classes", icon:"▦", group:"ACADEMICS" }, { label:"Subjects", href:"/school-admin/subjects", icon:"▤", group:"ACADEMICS" }, { label:"Assessments", href:"/school-admin/assessments", icon:"✓", group:"ACADEMICS" }, { label:"Attendance", href:"/school-admin/attendance", icon:"◷", group:"ACADEMICS" }, { label:"Results & Reports", href:"/school-admin/results", icon:"▥", group:"ACADEMICS" }, { label:"Analytics", href:"/school-admin/analytics", icon:"⌁", group:"ACADEMICS" }
];
export default async function ResultsPage() {
 const ctx=await getPrimaryRole(); if(ctx.role!=="school_admin") redirect("/");
 const supabase=await createClient();
 const {data}=await supabase.from("report_cards").select("id,overall_percentage,overall_grade,class_position,status,students(first_name,last_name,student_number),classes(name),terms(name)").eq("school_id",ctx.schoolId).order("created_at",{ascending:false});
 return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}><section className="hero"><div><h1>Results & Report Cards</h1><p>Review generated report cards and publication status.</p></div></section><section className="premium-panel"><div className="tablewrap"><table className="premium-table"><thead><tr><th>STUDENT</th><th>CLASS</th><th>TERM</th><th>AVERAGE</th><th>GRADE</th><th>STATUS</th></tr></thead><tbody>{data?.length?data.map((r:any)=><tr key={r.id}><td><b>{r.students?.first_name} {r.students?.last_name}</b><br/><small>{r.students?.student_number}</small></td><td>{r.classes?.name||"—"}</td><td>{r.terms?.name||"—"}</td><td>{r.overall_percentage ?? "—"}</td><td>{r.overall_grade||"—"}</td><td><span className="pill amberpill">{r.status}</span></td></tr>):<tr><td colSpan={6}>No report cards generated yet.</td></tr>}</tbody></table></div></section></PremiumShell>;
}
