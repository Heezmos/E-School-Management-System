import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import StatsCards from "@/components/StatsCards";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function StudentPage() {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "student") redirect("/");
  const supabase = await createClient();

  const { data: student } = await supabase.from("students").select("id,school_id").eq("profile_id", ctx.user.id).maybeSingle();
  const { count: results } = student
    ? await supabase.from("student_subject_results").select("*", { count: "exact", head: true }).eq("student_id", student.id).eq("status", "published")
    : { count: 0 };

  return (
    <DashboardShell
      schoolName={ctx.schoolName || "School Workspace"}
      roleLabel="Student"
      title="My Dashboard"
      subtitle="Your academic progress in one place"
      nav={["Dashboard","My Subjects","Assessments","Results","Attendance","Feedback","Report Cards","Announcements","Profile"]}
    >
      <StatsCards stats={[
        ["Published Results", results ?? 0],
        ["Attendance", "—"],
        ["Current Average", "—"],
        ["Notifications", 0]
      ]} />
      <section className="panel"><h2>Academic Overview</h2><div className="empty">Your published results, attendance and feedback will appear here.</div></section>
    </DashboardShell>
  );
}
