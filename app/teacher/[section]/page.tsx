import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getPrimaryRole } from "@/lib/auth";

const nav = ["Dashboard","My Classes","Assessments","Scores","Attendance","Student Feedback","Analytics","Announcements"];

export default async function TeacherSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "teacher") redirect("/");
  const { section } = await params;
  const title = section.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  return (
    <DashboardShell schoolName={ctx.schoolName || "School Workspace"} roleLabel="Teacher" title={title} subtitle="Teacher academic workspace" nav={nav}>
      <section className="panel"><h2>{title}</h2><div className="empty">This teacher module is connected to the sidebar and ready for its academic workflow.</div></section>
    </DashboardShell>
  );
}
