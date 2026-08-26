import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getPrimaryRole } from "@/lib/auth";

const nav = ["Home","My Children","Reports","Notifications","Announcements","Profile"];

export default async function ParentSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "parent") redirect("/");
  const { section } = await params;
  const title = section.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  return (
    <DashboardShell schoolName={ctx.schoolName || "School Workspace"} roleLabel="Parent / Guardian" title={title} subtitle="Parent monitoring workspace" nav={nav}>
      <section className="panel"><h2>{title}</h2><div className="empty">This parent module is connected to the sidebar and ready for child-specific data.</div></section>
    </DashboardShell>
  );
}
