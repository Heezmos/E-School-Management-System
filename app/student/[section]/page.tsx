import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getPrimaryRole } from "@/lib/auth";

const nav = ["Dashboard","My Subjects","Assessments","Results","Attendance","Feedback","Report Cards","Announcements","Profile"];

export default async function StudentSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "student") redirect("/");
  const { section } = await params;
  const title = section.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  return (
    <DashboardShell schoolName={ctx.schoolName || "School Workspace"} roleLabel="Student" title={title} subtitle="Student academic workspace" nav={nav}>
      <section className="panel"><h2>{title}</h2><div className="empty">This student module is connected to the sidebar and ready for published academic information.</div></section>
    </DashboardShell>
  );
}
