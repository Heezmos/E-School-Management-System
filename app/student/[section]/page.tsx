import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=["Dashboard","My Subjects","Assessments","Results","Attendance","Feedback","Report Cards","Announcements","Profile"];

export default async function StudentSectionPage({params}:{params:Promise<{section:string}>}){
  const ctx=await getPrimaryRole();
  if(ctx.role!=="student") redirect("/");
  const {section}=await params;
  const title=section.split("-").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
  const s=await createClient();
  const {data:student}=await s.from("students").select("id,first_name,last_name,student_number").eq("school_id",ctx.schoolId).eq("profile_id",ctx.user.id).maybeSingle();
  if(!student) return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Student" title={title} subtitle="Student academic workspace" nav={nav}><div className="empty">Student profile not found.</div></DashboardShell>;

  if(section==="results"||section==="report-cards"){
    const {data:cards}=await s.from("report_cards").select("id,overall_percentage,overall_grade,class_position,attendance_percentage,promotion_status,general_remark,status,academic_years(name),terms(name),classes(name),report_card_subjects(percentage,grade,position,teacher_remark,subjects(name,code))").eq("school_id",ctx.schoolId).eq("student_id",student.id).eq("status","published").order("published_at",{ascending:false});
    return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Student" title="Published Results" subtitle={`${student.first_name} ${student.last_name} · ${student.student_number}`} nav={nav}>{cards?.length?cards.map((c:any)=><section className="panel" key={c.id} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2>{c.terms?.name} · {c.academic_years?.name}</h2><p>{c.classes?.name}</p></div><div className="badge">Average {Number(c.overall_percentage||0).toFixed(1)}% · Grade {c.overall_grade||"—"}</div></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>SUBJECT</th><th>PERCENTAGE</th><th>GRADE</th><th>POSITION</th><th>TEACHER REMARK</th></tr></thead><tbody>{(c.report_card_subjects||[]).map((x:any,i:number)=><tr key={i}><td><b>{x.subjects?.name||"Subject"}</b><br/><small>{x.subjects?.code||""}</small></td><td>{Number(x.percentage).toFixed(1)}%</td><td>{x.grade||"—"}</td><td>{x.position||"—"}</td><td>{x.teacher_remark||"—"}</td></tr>)}</tbody></table></div>{c.general_remark&&<div className="note"><b>General remark:</b> {c.general_remark}</div>}</section>):<section className="panel"><div className="empty">No published results are available yet.</div></section>}</DashboardShell>;
  }

  if(section==="attendance"){
    const {data:records}=await s.from("attendance_records").select("id,status,remark,attendance_sessions(attendance_date,classes(name),terms(name))").eq("school_id",ctx.schoolId).eq("student_id",student.id).order("created_at",{ascending:false}).limit(100);
    const rows=records||[]; const total=rows.length; const present=rows.filter((x:any)=>x.status==="present").length; const absent=rows.filter((x:any)=>x.status==="absent").length; const late=rows.filter((x:any)=>x.status==="late").length;
    return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Student" title="My Attendance" subtitle={`${student.first_name} ${student.last_name} · attendance history`} nav={nav}><section className="cards"><div className="card"><div className="label">Attendance Records</div><div className="value">{total}</div></div><div className="card"><div className="label">Present</div><div className="value">{present}</div></div><div className="card"><div className="label">Absent</div><div className="value">{absent}</div></div><div className="card"><div className="label">Late</div><div className="value">{late}</div></div></section><section className="panel" style={{marginTop:18}}><h2>Attendance History</h2><div className="tablewrap"><table className="premium-table"><thead><tr><th>DATE</th><th>CLASS</th><th>TERM</th><th>STATUS</th><th>REMARK</th></tr></thead><tbody>{rows.length?rows.map((x:any)=><tr key={x.id}><td>{x.attendance_sessions?.attendance_date||"—"}</td><td>{x.attendance_sessions?.classes?.name||"—"}</td><td>{x.attendance_sessions?.terms?.name||"—"}</td><td><span className={`pill ${x.status==="present"?"greenpill":"amberpill"}`}>{x.status}</span></td><td>{x.remark||"—"}</td></tr>):<tr><td colSpan={5}>No attendance records yet.</td></tr>}</tbody></table></div></section></DashboardShell>;
  }

  if(section==="feedback"){
    const {data:remarks}=await s.from("teacher_remarks").select("id,remark_type,remark,created_at,subjects(name),teachers(profiles(first_name,last_name)),terms(name)").eq("school_id",ctx.schoolId).eq("student_id",student.id).eq("visibility","parent_student").order("created_at",{ascending:false});
    return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Student" title="Teacher Feedback" subtitle="Constructive observations shared by your teachers" nav={nav}><section className="panel"><h2>Development & Academic Feedback</h2>{remarks?.length?<div className="list">{remarks.map((x:any)=><div className="row" key={x.id}><div><b>{x.remark_type}</b><small style={{display:"block"}}>{x.subjects?.name||"General"} · {x.terms?.name||""} · {x.teachers?.profiles?`${x.teachers.profiles.first_name} ${x.teachers.profiles.last_name}`:"Teacher"}</small><p style={{marginBottom:0}}>{x.remark}</p></div></div>)}</div>:<div className="empty">No teacher feedback has been shared yet.</div>}</section></DashboardShell>;
  }

  return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Student" title={title} subtitle="Student academic workspace" nav={nav}><section className="panel"><h2>{title}</h2><div className="empty">This module is connected and will display your school-approved information.</div></section></DashboardShell>;
}
