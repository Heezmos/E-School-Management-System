import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { label:"Dashboard", href:"/school-admin", icon:"⌂", group:"OVERVIEW" }, { label:"School Setup", href:"/school-admin/setup", icon:"⚙", group:"OVERVIEW" }, { label:"User Management", href:"/school-admin/users", icon:"♙", group:"PEOPLE" }, { label:"Teachers", href:"/school-admin/teachers", icon:"♟", group:"PEOPLE" }, { label:"Students", href:"/school-admin/students", icon:"♚", group:"PEOPLE" }, { label:"Parents & Guardians", href:"/school-admin/parents", icon:"♧", group:"PEOPLE" }, { label:"Classes", href:"/school-admin/classes", icon:"▦", group:"ACADEMICS" }, { label:"Subjects", href:"/school-admin/subjects", icon:"▤", group:"ACADEMICS" }, { label:"Assessments", href:"/school-admin/assessments", icon:"✓", group:"ACADEMICS" }, { label:"Attendance", href:"/school-admin/attendance", icon:"◷", group:"ACADEMICS" }, { label:"Results & Reports", href:"/school-admin/results", icon:"▥", group:"ACADEMICS" }, { label:"Analytics", href:"/school-admin/analytics", icon:"⌁", group:"ACADEMICS" }
];
export default async function AssessmentsPage() {
 const ctx=await getPrimaryRole(); if(ctx.role!=="school_admin") redirect("/");
 const supabase=await createClient();
 const {data}=await supabase.from("assessments").select("id,title,assessment_date,maximum_score,weight_percentage,status,classes(name),subjects(name),teachers(profiles(first_name,last_name))").eq("school_id",ctx.schoolId).order("assessment_date",{ascending:false});
 return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}><section className="hero"><div><h1>Assessments</h1><p>Teacher-created assessments and review workflow.</p></div></section><section className="premium-panel"><div className="tablewrap"><table className="premium-table"><thead><tr><th>TITLE</th><th>CLASS</th><th>SUBJECT</th><th>MAX</th><th>WEIGHT</th><th>STATUS</th></tr></thead><tbody>{data?.length?data.map((a:any)=><tr key={a.id}><td><b>{a.title}</b></td><td>{a.classes?.name||"—"}</td><td>{a.subjects?.name||"—"}</td><td>{a.maximum_score}</td><td>{a.weight_percentage}%</td><td><span className="pill amberpill">{a.status}</span></td></tr>):<tr><td colSpan={6}>No assessments yet.</td></tr>}</tbody></table></div></section></PremiumShell>;
}
