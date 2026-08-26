import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=["Home","My Children","Reports","Attendance","Feedback","Notifications","Announcements","Profile"];

export default async function ParentSectionPage({params}:{params:Promise<{section:string}>}){
  const ctx=await getPrimaryRole();
  if(ctx.role!=="parent") redirect("/");
  const {section}=await params;
  const title=section.split("-").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
  const s=await createClient();
  const {data:guardian}=await s.from("guardians").select("id").eq("school_id",ctx.schoolId).eq("profile_id",ctx.user.id).maybeSingle();
  if(!guardian) return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Parent / Guardian" title={title} subtitle="Parent monitoring workspace" nav={nav}><div className="empty">Guardian profile not found.</div></DashboardShell>;

  const {data:links}=await s.from("student_guardians").select("relationship,is_primary,students(id,first_name,last_name,student_number)").eq("school_id",ctx.schoolId).eq("guardian_id",guardian.id);
  const children=(links||[]).map((l:any)=>l.students).filter(Boolean);
  const ids=children.map((c:any)=>c.id);

  if(section==="reports"||section==="my-children"){
    const {data:cards}=ids.length?await s.from("report_cards").select("id,student_id,overall_percentage,overall_grade,class_position,attendance_percentage,promotion_status,general_remark,status,academic_years(name),terms(name),classes(name),report_card_subjects(percentage,grade,position,teacher_remark,subjects(name,code))").eq("school_id",ctx.schoolId).in("student_id",ids).eq("status","published").order("published_at",{ascending:false}):{data:[]};
    return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Parent / Guardian" title={section==="my-children"?"My Children":"Published Reports"} subtitle="Monitor school-approved academic performance" nav={nav}>{children.length?children.map((child:any)=><section className="panel" key={child.id} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2>{child.first_name} {child.last_name}</h2><p>{child.student_number}</p></div><span className="badge">{(links||[]).find((l:any)=>l.students?.id===child.id)?.relationship||"Guardian"}</span></div>{(cards||[]).filter((c:any)=>c.student_id===child.id).length?(cards||[]).filter((c:any)=>c.student_id===child.id).map((c:any)=><div key={c.id} style={{marginTop:18}}><div className="row"><div><b>{c.terms?.name} · {c.academic_years?.name}</b><small style={{display:"block"}}>{c.classes?.name}</small></div><div><b>{Number(c.overall_percentage||0).toFixed(1)}%</b><small style={{display:"block"}}>Grade {c.overall_grade||"—"}</small></div></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>SUBJECT</th><th>%</th><th>GRADE</th><th>REMARK</th></tr></thead><tbody>{(c.report_card_subjects||[]).map((x:any,i:number)=><tr key={i}><td>{x.subjects?.name||"Subject"}</td><td>{Number(x.percentage).toFixed(1)}%</td><td>{x.grade||"—"}</td><td>{x.teacher_remark||"—"}</td></tr>)}</tbody></table></div>{c.general_remark&&<p className="note"><b>General remark:</b> {c.general_remark}</p>}</div>):<div className="empty" style={{marginTop:14}}>No published report card yet.</div>}</section>):<section className="panel"><div className="empty">No children are linked to this guardian account yet.</div></section>}</DashboardShell>;
  }

  if(section==="attendance"){
    const {data:records}=ids.length?await s.from("attendance_records").select("id,student_id,status,remark,attendance_sessions(attendance_date,classes(name),terms(name))").eq("school_id",ctx.schoolId).in("student_id",ids).order("created_at",{ascending:false}).limit(200):{data:[]};
    return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Parent / Guardian" title="Child Attendance" subtitle="Monitor attendance records for your linked children" nav={nav}>{children.length?children.map((child:any)=>{const rows=(records||[]).filter((x:any)=>x.student_id===child.id);const total=rows.length;const present=rows.filter((x:any)=>x.status==="present").length;return <section className="panel" key={child.id} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2>{child.first_name} {child.last_name}</h2><p>{child.student_number}</p></div><span className="badge">{total?`${(present/total*100).toFixed(1)}% present`:"No attendance yet"}</span></div><div className="tablewrap"><table className="premium-table"><thead><tr><th>DATE</th><th>CLASS</th><th>TERM</th><th>STATUS</th><th>REMARK</th></tr></thead><tbody>{rows.length?rows.map((x:any)=><tr key={x.id}><td>{x.attendance_sessions?.attendance_date||"—"}</td><td>{x.attendance_sessions?.classes?.name||"—"}</td><td>{x.attendance_sessions?.terms?.name||"—"}</td><td><span className={`pill ${x.status==="present"?"greenpill":"amberpill"}`}>{x.status}</span></td><td>{x.remark||"—"}</td></tr>):<tr><td colSpan={5}>No attendance records yet.</td></tr>}</tbody></table></div></section>}):<section className="panel"><div className="empty">No children are linked to this guardian account yet.</div></section>}</DashboardShell>;
  }

  if(section==="feedback"){
    const {data:remarks}=ids.length?await s.from("teacher_remarks").select("id,student_id,remark_type,remark,created_at,subjects(name),teachers(profiles(first_name,last_name)),terms(name)").eq("school_id",ctx.schoolId).in("student_id",ids).eq("visibility","parent_student").order("created_at",{ascending:false}):{data:[]};
    return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Parent / Guardian" title="Teacher Feedback" subtitle="Development and academic observations shared for your children" nav={nav}>{children.length?children.map((child:any)=><section className="panel" key={child.id} style={{marginBottom:18}}><h2>{child.first_name} {child.last_name}</h2>{(remarks||[]).filter((x:any)=>x.student_id===child.id).length?<div className="list">{(remarks||[]).filter((x:any)=>x.student_id===child.id).map((x:any)=><div className="row" key={x.id}><div><b>{x.remark_type}</b><small style={{display:"block"}}>{x.subjects?.name||"General"} · {x.terms?.name||""} · {x.teachers?.profiles?`${x.teachers.profiles.first_name} ${x.teachers.profiles.last_name}`:"Teacher"}</small><p style={{marginBottom:0}}>{x.remark}</p></div></div>)}</div>:<div className="empty">No teacher feedback has been shared yet.</div>}</section>):<section className="panel"><div className="empty">No children are linked to this guardian account yet.</div></section>}</DashboardShell>;
  }

  return <DashboardShell schoolName={ctx.schoolName||"School Workspace"} roleLabel="Parent / Guardian" title={title} subtitle="Parent monitoring workspace" nav={nav}><section className="panel"><h2>{title}</h2><div className="empty">This module is connected and will display child-specific school information.</div></section></DashboardShell>;
}
