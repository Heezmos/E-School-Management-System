import { redirect } from "next/navigation";
import Link from "next/link";
import PremiumShell from "@/components/PremiumShell";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { label:"Dashboard", href:"/school-admin", icon:"⌂", group:"OVERVIEW" },
  { label:"School Setup", href:"/school-admin/setup", icon:"⚙", group:"OVERVIEW" },
  { label:"User Management", href:"/school-admin/users", icon:"♙", group:"PEOPLE" },
  { label:"Teachers", href:"/school-admin/teachers", icon:"♟", group:"PEOPLE" },
  { label:"Students", href:"/school-admin/students", icon:"♚", group:"PEOPLE" },
  { label:"Parents & Guardians", href:"/school-admin/parents", icon:"♧", group:"PEOPLE" },
  { label:"Classes", href:"/school-admin/classes", icon:"▦", group:"ACADEMICS" },
  { label:"Subjects", href:"/school-admin/subjects", icon:"▤", group:"ACADEMICS" },
  { label:"Assessments", href:"/school-admin/assessments", icon:"✓", group:"ACADEMICS" },
  { label:"Attendance", href:"/school-admin/attendance", icon:"◷", group:"ACADEMICS" },
  { label:"Results & Reports", href:"/school-admin/results", icon:"▥", group:"ACADEMICS" },
  { label:"Analytics", href:"/school-admin/analytics", icon:"⌁", group:"ACADEMICS" }
];

export default async function SchoolAdminPage() {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "school_admin") redirect("/");
  const supabase = await createClient();
  const schoolId = ctx.schoolId!;

  const [students, teachers, classes, guardians, currentYear, recentStudents, pendingAssessments, reportCards] = await Promise.all([
    supabase.from("students").select("*", { count:"exact", head:true }).eq("school_id",schoolId).eq("status","active"),
    supabase.from("teachers").select("*", { count:"exact", head:true }).eq("school_id",schoolId).eq("employment_status","active"),
    supabase.from("classes").select("*", { count:"exact", head:true }).eq("school_id",schoolId).eq("status","active"),
    supabase.from("guardians").select("*", { count:"exact", head:true }).eq("school_id",schoolId),
    supabase.from("academic_years").select("name").eq("school_id",schoolId).eq("is_current",true).maybeSingle(),
    supabase.from("students").select("id,student_number,first_name,last_name,status").eq("school_id",schoolId).order("created_at",{ascending:false}).limit(5),
    supabase.from("assessments").select("*", { count:"exact", head:true }).eq("school_id",schoolId).eq("status","submitted"),
    supabase.from("report_cards").select("*", { count:"exact", head:true }).eq("school_id",schoolId).eq("status","approved")
  ]);

  return (
    <PremiumShell schoolName={ctx.schoolName || "School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}>
      <section className="hero">
        <div><h1>Good day, Administrator 👋</h1><p>Live data from your E-School backend.</p></div>
        <div className="term">{currentYear.data?.name || "Academic year not configured"}</div>
      </section>
      <section className="stats">
        <article className="stat"><div><small>Total Students</small><div className="value">{students.count ?? 0}</div><small>Active enrollment records</small></div><div className="symbol s1">♚</div></article>
        <article className="stat"><div><small>Teaching Staff</small><div className="value">{teachers.count ?? 0}</div><small>Active teacher accounts</small></div><div className="symbol s2">♟</div></article>
        <article className="stat"><div><small>Active Classes</small><div className="value">{classes.count ?? 0}</div><small>Current academic structure</small></div><div className="symbol s3">▦</div></article>
        <article className="stat"><div><small>Guardians</small><div className="value">{guardians.count ?? 0}</div><small>Parent/guardian accounts</small></div><div className="symbol s4">♧</div></article>
      </section>
      <section className="quickgrid">
        <Link className="quick" href="/school-admin/students"><div>＋</div><b>Add Student</b><small>Create admission profile</small></Link>
        <Link className="quick" href="/school-admin/teachers"><div>♟</div><b>Add Teacher</b><small>Create staff record</small></Link>
        <Link className="quick" href="/school-admin/classes"><div>▦</div><b>Create Class</b><small>Configure academic structure</small></Link>
        <Link className="quick" href="/school-admin/results"><div>✓</div><b>Review Results</b><small>Approve academic records</small></Link>
      </section>
      <section className="premium-grid">
        <article className="premium-panel">
          <div className="panelhead"><h2>Action Center</h2></div>
          <div className="action"><div className="aico">✓</div><div><strong>Assessments awaiting review</strong><small>Submitted by teachers</small></div><div className="count">{pendingAssessments.count ?? 0}</div></div>
          <div className="action"><div className="aico">▥</div><div><strong>Report cards ready for publication</strong><small>Approved academic reports</small></div><div className="count">{reportCards.count ?? 0}</div></div>
        </article>
        <article className="premium-panel">
          <div className="panelhead"><h2>Backend Status</h2></div>
          <div className="action"><div className="aico">✓</div><div><strong>Supabase Auth</strong><small>Connected</small></div></div>
          <div className="action"><div className="aico">✓</div><div><strong>Role routing</strong><small>Backend controlled</small></div></div>
          <div className="action"><div className="aico">✓</div><div><strong>RLS tenant security</strong><small>Enabled</small></div></div>
        </article>
      </section>
      <section className="premium-panel" style={{marginTop:18}}>
        <div className="panelhead"><h2>Recent Students</h2><Link href="/school-admin/students" className="linkbtn">Manage students</Link></div>
        <div className="tablewrap"><table className="premium-table"><thead><tr><th>STUDENT</th><th>ID</th><th>STATUS</th></tr></thead><tbody>
          {recentStudents.data?.length ? recentStudents.data.map((s:any)=>(<tr key={s.id}><td><b>{s.first_name} {s.last_name}</b></td><td>{s.student_number}</td><td><span className="pill greenpill">{s.status}</span></td></tr>)) : <tr><td colSpan={3}>No students yet.</td></tr>}
        </tbody></table></div>
      </section>
    </PremiumShell>
  );
}
