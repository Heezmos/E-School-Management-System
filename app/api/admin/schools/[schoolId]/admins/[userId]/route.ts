import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: role } = await supabase.from("user_school_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").eq("is_active", true).maybeSingle();
  if (!role) return { error: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) };
  return { user };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ schoolId: string; userId: string }> }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  const { schoolId, userId } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data: assignment } = await admin.from("user_school_roles").select("user_id,is_active").eq("school_id", schoolId).eq("user_id", userId).eq("role", "school_admin").maybeSingle();
  if (!assignment) return NextResponse.json({ error: "School administrator assignment not found." }, { status: 404 });

  const firstName = body.first_name === undefined ? undefined : String(body.first_name).trim();
  const lastName = body.last_name === undefined ? undefined : String(body.last_name).trim();
  const email = body.email === undefined ? undefined : String(body.email).trim().toLowerCase();
  const password = body.temporary_password === undefined ? undefined : String(body.temporary_password);

  if (email !== undefined && (!email || !email.includes("@"))) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password !== undefined && password.length < 8) return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });

  const { data: existingUser } = await admin.auth.admin.getUserById(userId);
  const currentMeta = existingUser.user?.user_metadata || {};
  const updates: any = {};
  if (email !== undefined) updates.email = email;
  if (firstName !== undefined || lastName !== undefined || password !== undefined) {
    updates.user_metadata = {
      ...currentMeta,
      ...(firstName !== undefined ? { first_name: firstName } : {}),
      ...(lastName !== undefined ? { last_name: lastName } : {}),
      ...(password !== undefined ? { must_change_password: true } : {})
    };
  }
  if (password !== undefined) updates.password = password;

  if (Object.keys(updates).length) {
    const { error: userError } = await admin.auth.admin.updateUserById(userId, updates);
    if (userError) return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  if (typeof body.is_active === "boolean") {
    const { error: roleError } = await admin.from("user_school_roles").update({ is_active: body.is_active }).eq("school_id", schoolId).eq("user_id", userId).eq("role", "school_admin");
    if (roleError) return NextResponse.json({ error: roleError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ schoolId: string; userId: string }> }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  const { schoolId, userId } = await params;
  const admin = createAdminClient();

  const { data: assignment } = await admin.from("user_school_roles").select("user_id").eq("school_id", schoolId).eq("user_id", userId).eq("role", "school_admin").maybeSingle();
  if (!assignment) return NextResponse.json({ error: "School administrator assignment not found." }, { status: 404 });

  const { error: removeError } = await admin.from("user_school_roles").delete().eq("school_id", schoolId).eq("user_id", userId).eq("role", "school_admin");
  if (removeError) return NextResponse.json({ error: removeError.message }, { status: 400 });

  const { count } = await admin.from("user_school_roles").select("*", { count: "exact", head: true }).eq("user_id", userId);
  if ((count ?? 0) === 0) {
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) return NextResponse.json({ error: `Role removed, but auth account could not be deleted: ${deleteUserError.message}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
