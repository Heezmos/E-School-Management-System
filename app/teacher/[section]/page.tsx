import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import TeacherAcademicWorkspace from "@/components/TeacherAcademicWorkspace";
import TeacherAttendanceWorkspace from "@/components/TeacherAttendanceWorkspace";
import TeacherRemarksWorkspace from "@/components/TeacherRemarksWorkspace";
import TeacherAnalytics from "@/components/TeacherAnalytics";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=["Dashboard","My Classes","Assessments","Scores","Attendance","Student Feedback","Analytics","Announcements"];

export default async function TeacherSectionPage({params}:{params:Promise<{section:string}>}) {
  const ctx=await getPrimaryRole(); if(ctx.role!=="teacher") redirect("/");
  const {section}=await params; const title=section.split("-").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
  const s=await createClient();

  if(["assessments","scores","attendance","student-feedback","analytics"].includes(section)) {
    const {data:t}=await s.from("teachers").select("id").eq("profile_id",ctx.user.id).eq("school_id",ctx.schoolId).maybeSingle();
    if(!t) return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Teacher" title={title} subtitle="Teacher academic workspace" nav={nav}><div className="empty">Teacher profile not found.</div></DashboardShell>;
    const {data:assignments}=await s.from("teacher_assignments").select("id,academic_year_id,term_id,class_id,subject_id,classes(name),subjects(name)").eq("teacher_id",t.id).eq("status","active");
    const yearIds=[...new Set((assignments||[]).map((a:any)=>a.academic_year_id))];
    const classIds=[...new Set((assignments||[]).map((a:any)=>a.class_id))];
    const {data:terms}=yearIds.length?await s.from("terms").select("id,name,academic_year_id").in("academic_year_id",yearIds):{data:[]};
    const {data:students}=classIds.length?await s.from("student_enrollments").select("student_id,class_id,academic_year_id,students(first_name,last_name,student_number)").eq("school_id",ctx.schoolId).eq("enrollment_status","active").in("class_id",classIds):{data:[]};

    if(section==="attendance") return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Teacher" title="Attendance" subtitle="Record daily attendance for your assigned classes" nav={nav}><TeacherAttendanceWorkspace assignments={assignments||[]} terms={terms||[]} students={students||[]}/></DashboardShell>;

    if(section==="student-feedback") {
      const {data:remarks}=await s.from("teacher_remarks").select("id,remark_type,remark,visibility,created_at,students(first_name,last_name)").eq("school_id",ctx.schoolId).eq("teacher_id",t.id).order("created_at",{ascending:false}).limit(50);
      return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Teacher" title="Student Feedback" subtitle="Record student development observations and constructive feedback" nav={nav}><TeacherRemarksWorkspace assignments={assignments||[]} terms={terms||[]} students={students||[]} remarks={remarks||[]}/></DashboardShell>;
    }

    if(section==="analytics") {
      const subjectIds=[...new Set((assignments||[]).map((a:any)=>a.subject_id).filter(Boolean))];
      const [assessmentRes,attendanceRes,remarkRes,settingRes]=await Promise.all([
        s.from("assessments").select("id,title,academic_year_id,term_id,class_id,subject_id,status,classes(name),subjects(name)").eq("school_id",ctx.schoolId).eq("teacher_id",t.id),
        classIds.length?s.from("attendance_records").select("student_id,status,attendance_sessions!inner(class_id,academic_year_id,term_id,recorded_by)").eq("school_id",ctx.schoolId).in("attendance_sessions.class_id",classIds):Promise.resolve({data:[]}),
        s.from("teacher_remarks").select("id").eq("school_id",ctx.schoolId).eq("teacher_id",t.id),
        s.from("platform_settings").select("setting_key,value").in("setting_key",["pass_mark","attendance_risk_threshold"])
      ]);
      const assessmentIds=(assessmentRes.data||[]).map((a:any)=>a.id);
      const {data:scores}=assessmentIds.length?await s.from("student_scores").select("assessment_id,student_id,percentage_score").eq("school_id",ctx.schoolId).in("assessment_id",assessmentIds):{data:[]};
      const settingMap=Object.fromEntries((settingRes.data||[]).map((x:any)=>[x.setting_key,x.value]));
      const attendance=(attendanceRes.data||[]).map((x:any)=>({student_id:x.student_id,status:x.status,class_id:x.attendance_sessions?.class_id,academic_year_id:x.attendance_sessions?.academic_year_id,term_id:x.attendance_sessions?.term_id}));
      return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Teacher" title="Analytics" subtitle="Performance intelligence for your assigned classes and subjects" nav={nav}><TeacherAnalytics assignments={assignments||[]} assessments={assessmentRes.data||[]} scores={scores||[]} attendance={attendance} students={students||[]} remarks={remarkRes.data||[]} terms={terms||[]} passMark={Number(settingMap.pass_mark??50)} attendanceThreshold={Number(settingMap.attendance_risk_threshold??75)}/></DashboardShell>;
    }

    const {data:categories}=yearIds.length?await s.from("assessment_categories").select("id,name,default_weight,academic_year_id,term_id").eq("school_id",ctx.schoolId).in("academic_year_id",yearIds).eq("status","active"):{data:[]};
    const {data:assessments}=await s.from("assessments").select("id,title,academic_year_id,class_id,subject_id,maximum_score,weight_percentage,status,classes(name),subjects(name)").eq("school_id",ctx.schoolId).eq("teacher_id",t.id).order("created_at",{ascending:false});
    const ids=(assessments||[]).map((a:any)=>a.id);
    const {data:scores}=ids.length?await s.from("student_scores").select("assessment_id,student_id,raw_score,teacher_remark").in("assessment_id",ids):{data:[]};
    return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Teacher" title="Assessment & Score Workspace" subtitle="Create assessments, record marks and submit results for approval" nav={nav}><TeacherAcademicWorkspace assignments={assignments||[]} categories={categories||[]} terms={terms||[]} assessments={assessments||[]} students={students||[]} scores={scores||[]}/></DashboardShell>;
  }

  return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Teacher" title={title} subtitle="Teacher academic workspace" nav={nav}><section className="panel"><h2>{title}</h2><div className="empty">This teacher module is connected and will be implemented in the next workflow.</div></section></DashboardShell>;
}
