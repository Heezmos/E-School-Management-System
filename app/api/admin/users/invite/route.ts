import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SCHOOL_ADMIN_ASSIGNABLE = new Set(["teacher", "parent", "student"]);
const SUPER_ADMIN_ASSIGNABLE = new Set(["school_admin", "teacher", "parent", "student"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerRole } = await supabase
    .from("user_school_roles")
    .select("role, school_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!callerRole || !["super_admin", "school_admin"].includes(callerRole.role)) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const firstName = String(body.first_name || "").trim();
  const lastName = String(body.last_name || "").trim();
  const role = String(body.role || "");
  const schoolId =
    callerRole.role === "school_admin"
      ? callerRole.school_id
      : String(body.school_id || "");

  if (!email || !email.includes("@") || !schoolId) {
    return NextResponse.json({ error: "Valid email and school are required." }, { status: 400 });
  }

  const allowed =
    callerRole.role === "super_admin"
      ? SUPER_ADMIN_ASSIGNABLE.has(role)
      : SCHOOL_ADMIN_ASSIGNABLE.has(role);

  if (!allowed) {
    return NextResponse.json({ error: "You cannot assign that role." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName
    }
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || "Unable to create user." },
      { status: 400 }
    );
  }

  const { error: roleError } = await admin
    .from("user_school_roles")
    .insert({
      user_id: created.user.id,
      school_id: schoolId,
      role,
      is_active: true
    });

  if (roleError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: roleError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    user_id: created.user.id,
    role,
    school_id: schoolId
  });
}
