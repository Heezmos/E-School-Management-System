import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "teacher" || !ctx.schoolId) return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  const body = await request.json();
  const admin = createAdminClient();
  const { data: teacher } = await admin.from("teachers").select("id").eq("school_id", ctx.schoolId).eq("profile_id", ctx.user.id).maybeSingle();
  if (!teacher) return NextResponse.json({ error: "Teacher profile not found." }, { status: 404 });
  const { data: assignment } = await admin.from("teacher_assignments").select("academic_year_id,term_id,class_id,subject_id").eq("id", body.assignment_id).eq("school_id", ctx.schoolId).eq("teacher_id", teacher.id).eq("status", "active").maybeSingle();
  if (!assignment) return NextResponse.json({ error: "Teaching assignment not found." }, { status: 403 });
  const termId = body.term_id || assignment.term_id;
  if (!termId || !body.student_id || !String(body.remark || "").trim()) return NextResponse.json({ error: "Student, term and remark are required." }, { status: 400 });
  const { data: enrollment } = await admin.from("student_enrollments").select("student_id").eq("school_id", ctx.schoolId).eq("student_id", body.student_id).eq("class_id", assignment.class_id).eq("academic_year_id", assignment.academic_year_id).eq("enrollment_status", "active").maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "Student is not enrolled in this assigned class." }, { status: 403 });
  const { data, error } = await admin.from("teacher_remarks").insert({ school_id: ctx.schoolId, student_id: body.student_id, teacher_id: teacher.id, academic_year_id: assignment.academic_year_id, term_id: termId, class_id: assignment.class_id, subject_id: assignment.subject_id || null, remark_type: String(body.remark_type || "development"), remark: String(body.remark).trim(), visibility: body.visibility === "school_only" ? "school_only" : "parent_student" }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ school_id: ctx.schoolId, user_id: ctx.user.id, action: "teacher_add_student_remark", entity_type: "teacher_remark", entity_id: data.id, metadata: { student_id: body.student_id } });
  return NextResponse.json({ ok: true });
}
