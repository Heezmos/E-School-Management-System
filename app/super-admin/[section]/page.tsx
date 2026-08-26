import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getPrimaryRole } from "@/lib/auth";

const nav = ["Dashboard","Schools","Applications","Subscriptions","Platform Users","Analytics","Support","Audit Logs","Settings"];

const sectionTitles: Record<string, string> = {
  schools: "Schools",
  applications: "School Applications",
  subscriptions: "Subscriptions",
  "platform-users": "Platform Users",
  analytics: "Platform Analytics",
  support: "Support Center",
  "audit-logs": "Audit Logs",
  settings: "Platform Settings"
};

export default async function SuperAdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "super_admin") redirect("/");
  const { section } = await params;
  const title = sectionTitles[section] || "Super Admin";

  return (
    <DashboardShell
      schoolName="Platform Control Center"
      roleLabel="Super Admin"
      title={title}
      subtitle="Platform-wide administration"
      nav={nav}
    >
      <section className="panel">
        <h2>{title}</h2>
        <div className="empty">This module is now connected to navigation and ready for its full workflow and backend data.</div>
      </section>
    </DashboardShell>
  );
}
