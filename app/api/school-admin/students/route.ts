import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { data: role } = await supabase
    .from("user_school_roles")
    .select("role,school_id")
    .eq("user_id",user.id)
    .eq("is_active",true)
    .eq("role","school_admin")
    .maybeSingle();

  if (!role?.school_id) return NextResponse.json({ error:"School Admin access required." }, { status:403 });

  const body = await request.json();
  const firstName = String(body.first_name || "").trim();
  const lastName = String(body.last_name || "").trim();
  const studentNumber = String(body.student_number || "").trim();

  if (!firstName || !lastName || !studentNumber) {
    return NextResponse.json({ error:"First name, last name and student number are required." }, { status:400 });
  }

  const { data, error } = await supabase.from("students").insert({
    school_id: role.school_id,
    student_number: studentNumber,
    admission_number: String(body.admission_number || "").trim() || null,
    first_name: firstName,
    last_name: lastName,
    date_of_birth: body.date_of_birth || null,
    admission_date: body.admission_date || null,
    status: "active"
  }).select("id,student_number").single();

  if (error) return NextResponse.json({ error:error.message }, { status:400 });
  return NextResponse.json({ ok:true, student:data }, { status:201 });
}
