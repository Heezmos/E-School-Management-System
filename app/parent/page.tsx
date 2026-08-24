import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import StatsCards from "@/components/StatsCards";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ParentPage() {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "parent") redirect("/");
  const supabase = await createClient();

  const { data: guardian } = await supabase.from("guardians").select("id").eq("profile_id", ctx.user.id).maybeSingle();
  const { count: children } = guardian
    ? await supabase.from("student_guardians").select("*", { count: "exact", head: true }).eq("guardian_id", guardian.id)
    : { count: 0 };

  return (
    <DashboardShell
      schoolName={ctx.schoolName || "School Workspace"}
      roleLabel="Parent / Guardian"
      title="Parent Dashboard"
      subtitle="Monitor your children's academic development"
      nav={["Home","My Children","Reports","Notifications","Announcements","Profile"]}
    >
      <StatsCards stats={[
        ["Linked Children", children ?? 0],
        ["New Results", 0],
        ["Unread Feedback", 0],
        ["Notifications", 0]
      ]} />
      <section className="panel"><h2>My Children</h2><div className="empty">Linked children will appear here once the school connects your guardian account.</div></section>
    </DashboardShell>
  );
}
