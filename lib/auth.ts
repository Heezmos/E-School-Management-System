import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "parent"
  | "student";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getPrimaryRole() {
  const { supabase, user } = await requireUser();

  const { data: roles } = await supabase
    .from("user_school_roles")
    .select("role, school_id, schools(name)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  return {
    user,
    role: roles?.[0]?.role as AppRole | undefined,
    schoolId: roles?.[0]?.school_id as string | null | undefined,
    schoolName: (roles?.[0] as any)?.schools?.name as string | undefined
  };
}

export function roleHome(role?: AppRole) {
  switch (role) {
    case "super_admin": return "/super-admin";
    case "school_admin": return "/school-admin";
    case "teacher": return "/teacher";
    case "parent": return "/parent";
    case "student": return "/student";
    default: return "/no-role";
  }
}
