import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SCHOOL_ADMIN_ASSIGNABLE = new Set(["teacher", "parent", "student"]);
const SUPER_ADMIN_ASSIGNABLE = new Set(["school_admin", "teacher", "parent", "student"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerRole } = await supabase.from("user_school_roles").select("role, school_id").eq("user_id", user.id).eq("is_active", true).limit(1).maybeSingle();
  if (!callerRole || !["super_admin", "school_admin"].includes(callerRole.role)) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const firstName = String(body.first_name || "").trim();
  const lastName = String(body.last_name || "").trim();
  const role = String(body.role || "");
  const temporaryPassword = String(body.password || "");
  const schoolId = callerRole.role === "school_admin" ? callerRole.school_id : String(body.school_id || "");

  if (!email || !email.includes("@") || !schoolId || !firstName || !lastName) return NextResponse.json({ error: "Name, valid email and school are required." }, { status: 400 });
  if (temporaryPassword.length < 8) return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
  const allowed = callerRole.role === "super_admin" ? SUPER_ADMIN_ASSIGNABLE.has(role) : SCHOOL_ADMIN_ASSIGNABLE.has(role);
  if (!allowed) return NextResponse.json({ error: "You cannot assign that role." }, { status: 403 });

  if (role === "teacher" && !String(body.teacher_number || "").trim()) return NextResponse.json({ error: "Teacher number is required." }, { status: 400 });
  if (role === "student" && !String(body.student_number || "").trim()) return NextResponse.json({ error: "Student number is required." }, { status: 400 });

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password: temporaryPassword, email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, must_change_password: true }
  });
  if (createError || !created.user) return NextResponse.json({ error: createError?.message || "Unable to create user." }, { status: 400 });

  try {
    const uid = created.user.id;
    const { error: roleError } = await admin.from("user_school_roles").insert({ user_id: uid, school_id: schoolId, role, is_active: true });
    if (roleError) throw roleError;

    await admin.from("profiles").upsert({ id: uid, first_name: firstName, last_name: lastName, email, phone: String(body.phone || "").trim() || null, is_active: true });

    if (role === "teacher") {
      const { error } = await admin.from("teachers").insert({ school_id: schoolId, profile_id: uid, teacher_number: String(body.teacher_number).trim(), employment_status: "active", hire_date: body.hire_date || null, specialization: String(body.specialization || "").trim() || null });
      if (error) throw error;
    }
    if (role === "parent") {
      const { error } = await admin.from("guardians").insert({ school_id: schoolId, profile_id: uid, occupation: String(body.occupation || "").trim() || null, address: String(body.address || "").trim() || null });
      if (error) throw error;
    }
    if (role === "student") {
      const { error } = await admin.from("students").insert({ school_id: schoolId, profile_id: uid, student_number: String(body.student_number).trim(), admission_number: String(body.admission_number || "").trim() || null, first_name: firstName, middle_name: String(body.middle_name || "").trim() || null, last_name: lastName, date_of_birth: body.date_of_birth || null, gender: body.gender || null, admission_date: body.admission_date || null, status: "active" });
      if (error) throw error;
    }

    await admin.from("audit_logs").insert({ school_id: schoolId, user_id: user.id, action: "create", entity_type: "platform_user", entity_id: uid, new_values: { email, role, first_name: firstName, last_name: lastName } });
    return NextResponse.json({ ok: true, user_id: uid, role, school_id: schoolId, password_change_required: true });
  } catch (e:any) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: e?.message || "Unable to complete user onboarding." }, { status: 400 });
  }
}
