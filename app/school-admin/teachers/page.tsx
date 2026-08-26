import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import TeacherAssignmentManager from "@/components/TeacherAssignmentManager";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=[{label:"Dashboard",href:"/school-admin",icon:"⌂",group:"OVERVIEW"},{label:"School Setup",href:"/school-admin/setup",icon:"⚙",group:"OVERVIEW"},{label:"User Management",href:"/school-admin/users",icon:"♙",group:"PEOPLE"},{label:"Teachers",href:"/school-admin/teachers",icon:"♟",group:"PEOPLE"},{label:"Students",href:"/school-admin/students",icon:"♚",group:"PEOPLE"},{label:"Parents & Guardians",href:"/school-admin/parents",icon:"♧",group:"PEOPLE"},{label:"Classes",href:"/school-admin/classes",icon:"▦",group:"ACADEMICS"},{label:"Subjects",href:"/school-admin/subjects",icon:"▤",group:"ACADEMICS"},{label:"Assessments",href:"/school-admin/assessments",icon:"✓",group:"ACADEMICS"},{label:"Attendance",href:"/school-admin/attendance",icon:"◷",group:"ACADEMICS"},{label:"Results & Reports",href:"/school-admin/results",icon:"▥",group:"ACADEMICS"},{label:"Analytics",href:"/school-admin/analytics",icon:"⌁",group:"ACADEMICS"}];

export default async function TeachersPage(){
 const ctx=await getPrimaryRole(); if(ctx.role!=="school_admin") redirect("/"); const supabase=await createClient(); const schoolId=ctx.schoolId!;
 const [teachers,years,terms,classes,subjects,assignments]=await Promise.all([
  supabase.from("teachers").select("id,teacher_number,employment_status,specialization,profiles(first_name,last_name,email)").eq("school_id",schoolId).order("created_at",{ascending:false}),
  supabase.from("academic_years").select("id,name,is_current,status").eq("school_id",schoolId).order("start_date",{ascending:false}),
  supabase.from("terms").select("id,name,academic_year_id,status").eq("school_id",schoolId).order("sequence_number"),
  supabase.from("classes").select("id,name,academic_year_id,status").eq("school_id",schoolId).eq("status","active").order("name"),
  supabase.from("subjects").select("id,name,code,status").eq("school_id",schoolId).eq("status","active").order("name"),
  supabase.from("teacher_assignments").select("id,assignment_type,status,teachers(teacher_number,profiles(first_name,last_name)),academic_years(name),terms(name),classes(name),subjects(name)").eq("school_id",schoolId).order("created_at",{ascending:false})
 ]);
 const teacherOptions=(teachers.data||[]).filter((t:any)=>t.employment_status==="active").map((t:any)=>({id:t.id,label:`${t.profiles?.first_name||""} ${t.profiles?.last_name||""}`.trim()||t.teacher_number,extra:t.teacher_number}));
 const yearOptions=(years.data||[]).map((y:any)=>({id:y.id,label:`${y.name}${y.is_current?" (Current)":""}`}));
 const termOptions=(terms.data||[]).map((t:any)=>({id:t.id,label:t.name,extra:t.academic_year_id}));
 const classOptions=(classes.data||[]).map((c:any)=>({id:c.id,label:c.name,extra:c.academic_year_id}));
 const subjectOptions=(subjects.data||[]).map((s:any)=>({id:s.id,label:s.name,extra:s.code||""}));
 const assignmentRows=(assignments.data||[]).map((a:any)=>({id:a.id,teacher:`${a.teachers?.profiles?.first_name||""} ${a.teachers?.profiles?.last_name||""}`.trim()||"Teacher",teacher_number:a.teachers?.teacher_number||"",year:a.academic_years?.name||"—",term:a.terms?.name||"Whole year",class_name:a.classes?.name||"—",subject:a.subjects?.name||"—",assignment_type:a.assignment_type,status:a.status}));
 return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}>
  <section className="hero"><div><h1>Teachers & Assignments</h1><p>Manage teaching staff and precisely control the classes and subjects assigned to each teacher.</p></div></section>
  <section className="stats"><article className="stat"><div><small>Total Teachers</small><div className="value">{teachers.data?.length||0}</div></div></article><article className="stat"><div><small>Active Assignments</small><div className="value">{assignmentRows.filter((a:any)=>a.status==="active").length}</div></div></article><article className="stat"><div><small>Active Classes</small><div className="value">{classOptions.length}</div></div></article><article className="stat"><div><small>Subjects</small><div className="value">{subjectOptions.length}</div></div></article></section>
  <section className="premium-panel" style={{marginTop:18}}><div className="panelhead"><h2>Teacher Directory</h2></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>TEACHER</th><th>NUMBER</th><th>SPECIALIZATION</th><th>STATUS</th></tr></thead><tbody>{teachers.data?.length?teachers.data.map((t:any)=><tr key={t.id}><td><b>{t.profiles?.first_name} {t.profiles?.last_name}</b><br/><small>{t.profiles?.email}</small></td><td>{t.teacher_number}</td><td>{t.specialization||"—"}</td><td><span className={`pill ${t.employment_status==="active"?"greenpill":"amberpill"}`}>{t.employment_status}</span></td></tr>):<tr><td colSpan={4}>No teachers yet. Create teacher accounts from User Management.</td></tr>}</tbody></table></div></section>
  <div style={{marginTop:18}}><TeacherAssignmentManager teachers={teacherOptions} years={yearOptions} terms={termOptions} classes={classOptions} subjects={subjectOptions} assignments={assignmentRows}/></div>
 </PremiumShell>;
}
