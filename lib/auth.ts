import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "parent"
  | "student";

const rolePriority: Record<AppRole, number> = {
  super_admin: 0,
  school_admin: 1,
  teacher: 2,
  parent: 3,
  student: 4
};

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getPrimaryRole() {
  const { supabase, user } = await requireUser();

  if (user.user_metadata?.must_change_password === true) redirect("/change-password");

  const { data: roles, error } = await supabase
    .from("user_school_roles")
    .select("role, school_id, created_at, schools(name)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) throw new Error("Unable to resolve account permissions.");
  if (!roles?.length) return { user, role: undefined, schoolId: undefined, schoolName: undefined };

  const valid = roles.filter((x: any) => Object.prototype.hasOwnProperty.call(rolePriority, x.role));
  if (!valid.length) return { user, role: undefined, schoolId: undefined, schoolName: undefined };

  const schoolIds = new Set(valid.map((x: any) => x.school_id).filter(Boolean));
  if (schoolIds.size > 1) {
    throw new Error("This account has active access to multiple schools. A school-selection workflow is required before access can continue.");
  }

  valid.sort((a: any, b: any) => {
    const p = rolePriority[a.role as AppRole] - rolePriority[b.role as AppRole];
    return p || String(a.created_at || "").localeCompare(String(b.created_at || ""));
  });
  const primary: any = valid[0];

  return {
    user,
    role: primary.role as AppRole,
    schoolId: primary.school_id as string | null | undefined,
    schoolName: primary.schools?.name as string | undefined
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
