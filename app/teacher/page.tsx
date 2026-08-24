import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import StatsCards from "@/components/StatsCards";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherPage() {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "teacher") redirect("/");
  const supabase = await createClient();

  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", ctx.user.id).maybeSingle();
  const { count: assignments } = teacher
    ? await supabase.from("teacher_assignments").select("*", { count: "exact", head: true }).eq("teacher_id", teacher.id).eq("status", "active")
    : { count: 0 };

  return (
    <DashboardShell
      schoolName={ctx.schoolName || "School Workspace"}
      roleLabel="Teacher"
      title="Teacher Dashboard"
      subtitle="Your assigned academic workspace"
      nav={["Dashboard","My Classes","Assessments","Scores","Attendance","Student Feedback","Analytics","Announcements"]}
    >
      <StatsCards stats={[
        ["Assignments", assignments ?? 0],
        ["Pending Scores", 0],
        ["Assessments", 0],
        ["Attendance Due", 0]
      ]} />
      <section className="panel"><h2>Today's Work</h2><div className="empty">Assigned classes and pending academic work will appear here.</div></section>
    </DashboardShell>
  );
}
