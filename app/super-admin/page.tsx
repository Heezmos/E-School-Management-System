import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import StatsCards from "@/components/StatsCards";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SuperAdminPage() {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "super_admin") redirect("/");
  const supabase = await createClient();

  const [schools, students, teachers] = await Promise.all([
    supabase.from("schools").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("teachers").select("*", { count: "exact", head: true })
  ]);

  return (
    <DashboardShell
      schoolName="Platform Control Center"
      roleLabel="Super Admin"
      title="E-School Control Center"
      subtitle="Platform-wide administration"
      nav={["Dashboard","Schools","Applications","Subscriptions","Platform Users","Analytics","Support","Audit Logs","Settings"]}
    >
      <StatsCards stats={[
        ["Schools", schools.count ?? 0],
        ["Students", students.count ?? 0],
        ["Teachers", teachers.count ?? 0],
        ["Pending Applications", 0]
      ]} />
      <section className="panel"><h2>Platform Overview</h2><div className="empty">Your first schools will appear here after onboarding begins.</div></section>
    </DashboardShell>
  );
}
