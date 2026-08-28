import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ctx = await getPrimaryRole();
  if (ctx.role !== "teacher" || !ctx.schoolId) return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  const body = await request.json(); const admin = createAdminClient();
  const { data: teacher } = await admin.from("teachers").select("id,status").eq("school_id", ctx.schoolId).eq("profile_id", ctx.user.id).maybeSingle();
  if (!teacher || teacher.status!=="active") return NextResponse.json({ error: "Active teacher profile not found." }, { status: 404 });
  const { data: assignment } = await admin.from("teacher_assignments").select("id,academic_year_id,term_id,class_id").eq("id", body.assignment_id).eq("school_id", ctx.schoolId).eq("teacher_id", teacher.id).eq("status", "active").maybeSingle();
  if (!assignment) return NextResponse.json({ error: "You are not assigned to this class." }, { status: 403 });
  const termId = body.term_id || assignment.term_id; const attendanceDate=String(body.attendance_date||"");
  if (!termId || !attendanceDate) return NextResponse.json({ error: "Term and attendance date are required." }, { status: 400 });
  const {data:term}=await admin.from("terms").select("id,academic_year_id,start_date,end_date").eq("id",termId).eq("school_id",ctx.schoolId).maybeSingle();
  if(!term||term.academic_year_id!==assignment.academic_year_id)return NextResponse.json({error:"Selected term does not belong to this assignment's academic year."},{status:400});
  if(attendanceDate<String(term.start_date)||attendanceDate>String(term.end_date))return NextResponse.json({error:"Attendance date must fall within the selected term."},{status:400});
  const {data:existing}=await admin.from("attendance_sessions").select("id").eq("school_id",ctx.schoolId).eq("academic_year_id",assignment.academic_year_id).eq("term_id",termId).eq("class_id",assignment.class_id).eq("attendance_date",attendanceDate).limit(1).maybeSingle();
  if(existing)return NextResponse.json({error:"Attendance has already been submitted for this class on this date."},{status:409});
  const records = Array.isArray(body.records) ? body.records : []; if (!records.length) return NextResponse.json({ error: "No attendance records supplied." }, { status: 400 });
  const ids=records.map((r:any)=>String(r.student_id||""));if(new Set(ids).size!==ids.length)return NextResponse.json({error:"Duplicate students were included in the attendance list."},{status:400});
  const { data: enrolled } = await admin.from("student_enrollments").select("student_id").eq("school_id", ctx.schoolId).eq("class_id", assignment.class_id).eq("academic_year_id", assignment.academic_year_id).eq("enrollment_status", "active");
  const allowed = new Set((enrolled || []).map((x: any) => x.student_id));
  if(records.length!==allowed.size||records.some((r:any)=>!allowed.has(r.student_id)||!["present","absent","late","excused"].includes(r.status)))return NextResponse.json({error:`Attendance must contain one valid entry for every active student (${records.length}/${allowed.size}).`},{status:400});
  const { data: session, error: sessionError } = await admin.from("attendance_sessions").insert({ school_id: ctx.schoolId, academic_year_id: assignment.academic_year_id, term_id: termId, class_id: assignment.class_id, attendance_date: attendanceDate, recorded_by: ctx.user.id, status: "submitted" }).select("id").single();
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 400 });
  const rows = records.map((r: any) => ({ school_id: ctx.schoolId, attendance_session_id: session.id, student_id: r.student_id, status: r.status, remark: String(r.remark || "").trim() || null }));
  const { error } = await admin.from("attendance_records").insert(rows); if (error) { await admin.from("attendance_sessions").delete().eq("id", session.id); return NextResponse.json({ error: error.message }, { status: 400 }); }
  await admin.from("audit_logs").insert({ school_id: ctx.schoolId, user_id: ctx.user.id, action: "teacher_record_attendance", entity_type: "attendance_session", entity_id: session.id, new_values:{academic_year_id:assignment.academic_year_id,term_id:termId,class_id:assignment.class_id,attendance_date:attendanceDate,status:"submitted"},metadata: { students: rows.length } });
  return NextResponse.json({ ok: true, session_id: session.id });
}
