import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerRole } = await supabase.from("user_school_roles").select("role").eq("user_id", user.id).eq("is_active", true).eq("role", "super_admin").maybeSingle();
  if (!callerRole) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const body = await request.json();
  const name = String(body.name || "").trim();
  const schoolCode = String(body.school_code || "").trim().toUpperCase();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  const city = String(body.city || "").trim();
  const country = String(body.country || "Sierra Leone").trim();

  if (!name || !schoolCode) return NextResponse.json({ error: "School name and school code are required." }, { status: 400 });

  const admin = createAdminClient();
  const slug = `${slugify(name)}-${schoolCode.toLowerCase()}`;
  const { data: school, error } = await admin.from("schools").insert({
    name, slug, school_code: schoolCode, email: email || null, phone: phone || null,
    address: address || null, city: city || null, country: country || "Sierra Leone", status: "active"
  }).select("id,name,school_code,status").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, school });
}
