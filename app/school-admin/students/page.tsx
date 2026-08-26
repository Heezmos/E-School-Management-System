import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import StudentCreateForm from "./StudentCreateForm";
import StudentEnrollmentManager from "@/components/StudentEnrollmentManager";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=[{label:"Dashboard",href:"/school-admin",icon:"⌂",group:"OVERVIEW"},{label:"School Setup",href:"/school-admin/setup",icon:"⚙",group:"OVERVIEW"},{label:"User Management",href:"/school-admin/users",icon:"♙",group:"PEOPLE"},{label:"Teachers",href:"/school-admin/teachers",icon:"♟",group:"PEOPLE"},{label:"Students",href:"/school-admin/students",icon:"♚",group:"PEOPLE"},{label:"Parents & Guardians",href:"/school-admin/parents",icon:"♧",group:"PEOPLE"},{label:"Classes",href:"/school-admin/classes",icon:"▦",group:"ACADEMICS"},{label:"Subjects",href:"/school-admin/subjects",icon:"▤",group:"ACADEMICS"},{label:"Assessments",href:"/school-admin/assessments",icon:"✓",group:"ACADEMICS"},{label:"Attendance",href:"/school-admin/attendance",icon:"◷",group:"ACADEMICS"},{label:"Results & Reports",href:"/school-admin/results",icon:"▥",group:"ACADEMICS"},{label:"Analytics",href:"/school-admin/analytics",icon:"⌁",group:"ACADEMICS"}];

export default async function StudentsPage(){
 const ctx=await getPrimaryRole(); if(ctx.role!=="school_admin") redirect("/"); const supabase=await createClient(); const schoolId=ctx.schoolId!;
 const [students,years,classes,enrollments]=await Promise.all([
  supabase.from("students").select("id,student_number,admission_number,first_name,last_name,status,created_at").eq("school_id",schoolId).order("created_at",{ascending:false}),
  supabase.from("academic_years").select("id,name,is_current").eq("school_id",schoolId).order("start_date",{ascending:false}),
  supabase.from("classes").select("id,name,academic_year_id,status").eq("school_id",schoolId).eq("status","active").order("name"),
  supabase.from("student_enrollments").select("id,enrollment_status,promotion_status,students(student_number,first_name,last_name),academic_years(name),classes(name)").eq("school_id",schoolId).order("created_at",{ascending:false})
 ]);
 const studentOptions=(students.data||[]).filter((s:any)=>s.status==="active").map((s:any)=>({id:s.id,label:`${s.first_name} ${s.last_name}`,extra:s.student_number}));
 const yearOptions=(years.data||[]).map((y:any)=>({id:y.id,label:`${y.name}${y.is_current?" (Current)":""}`}));
 const classOptions=(classes.data||[]).map((c:any)=>({id:c.id,label:c.name,extra:c.academic_year_id}));
 const enrollmentRows=(enrollments.data||[]).map((e:any)=>({id:e.id,student:`${e.students?.first_name||""} ${e.students?.last_name||""}`.trim(),student_number:e.students?.student_number||"",year:e.academic_years?.name||"—",class_name:e.classes?.name||"—",status:e.enrollment_status,promotion_status:e.promotion_status||null}));
 return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}>
  <section className="hero"><div><h1>Students & Enrollment</h1><p>Manage student records and place each learner into the correct class and academic year.</p></div></section>
  <section className="stats"><article className="stat"><div><small>Total Students</small><div className="value">{students.data?.length||0}</div></div></article><article className="stat"><div><small>Active Enrollments</small><div className="value">{enrollmentRows.filter((e:any)=>e.status==="active").length}</div></div></article><article className="stat"><div><small>Classes</small><div className="value">{classOptions.length}</div></div></article><article className="stat"><div><small>Academic Years</small><div className="value">{yearOptions.length}</div></div></article></section>
  <section className="premium-grid" style={{marginTop:18}}><article className="premium-panel"><div className="panelhead"><h2>Student Directory</h2></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>ADMISSION</th><th>STATUS</th></tr></thead><tbody>{students.data?.length?students.data.map((s:any)=><tr key={s.id}><td><b>{s.first_name} {s.last_name}</b></td><td>{s.student_number}</td><td>{s.admission_number||"—"}</td><td><span className={`pill ${s.status==="active"?"greenpill":"amberpill"}`}>{s.status}</span></td></tr>):<tr><td colSpan={4}>No student records yet.</td></tr>}</tbody></table></div></article><StudentCreateForm/></section>
  <div style={{marginTop:18}}><StudentEnrollmentManager students={studentOptions} years={yearOptions} classes={classOptions} enrollments={enrollmentRows}/></div>
 </PremiumShell>;
}
