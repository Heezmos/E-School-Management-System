import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: role } = await supabase.from("user_school_roles").select("school_id,role").eq("user_id",user.id).eq("role","school_admin").eq("is_active",true).maybeSingle();
  if (!role?.school_id) return null;
  return { user, schoolId: role.school_id };
}

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({error:"School Admin access required."},{status:403});
  const body = await request.json();
  const teacherId=String(body.teacher_id||""); const yearId=String(body.academic_year_id||""); const termId=String(body.term_id||"")||null; const classId=String(body.class_id||""); const subjectId=String(body.subject_id||""); const type=String(body.assignment_type||"subject_teacher");
  if(!teacherId||!yearId||!classId||!subjectId) return NextResponse.json({error:"Teacher, academic year, class and subject are required."},{status:400});
  const admin=createAdminClient();
  const [teacher,year,klass,subject,term]=await Promise.all([
    admin.from("teachers").select("id").eq("id",teacherId).eq("school_id",ctx.schoolId).maybeSingle(),
    admin.from("academic_years").select("id").eq("id",yearId).eq("school_id",ctx.schoolId).maybeSingle(),
    admin.from("classes").select("id").eq("id",classId).eq("school_id",ctx.schoolId).maybeSingle(),
    admin.from("subjects").select("id").eq("id",subjectId).eq("school_id",ctx.schoolId).maybeSingle(),
    termId?admin.from("terms").select("id").eq("id",termId).eq("school_id",ctx.schoolId).maybeSingle():Promise.resolve({data:{id:null}} as any)
  ]);
  if(!teacher.data||!year.data||!klass.data||!subject.data||(termId&&!term.data)) return NextResponse.json({error:"One or more selected records do not belong to this school."},{status:400});
  const {data,error}=await admin.from("teacher_assignments").insert({school_id:ctx.schoolId,teacher_id:teacherId,academic_year_id:yearId,term_id:termId,class_id:classId,subject_id:subjectId,assignment_type:type,status:"active"}).select("id").single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"teacher_assignment_created",entity_type:"teacher_assignment",entity_id:data.id,new_values:body});
  return NextResponse.json({ok:true,id:data.id});
}

export async function PATCH(request: Request) {
  const ctx=await getContext(); if(!ctx) return NextResponse.json({error:"School Admin access required."},{status:403});
  const body=await request.json(); const id=String(body.id||""); const status=String(body.status||"");
  if(!id||!["active","inactive"].includes(status)) return NextResponse.json({error:"Valid assignment and status are required."},{status:400});
  const admin=createAdminClient(); const {error}=await admin.from("teacher_assignments").update({status}).eq("id",id).eq("school_id",ctx.schoolId);
  if(error) return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"teacher_assignment_status_changed",entity_type:"teacher_assignment",entity_id:id,new_values:{status}});
  return NextResponse.json({ok:true});
}

export async function DELETE(request: Request) {
  const ctx=await getContext(); if(!ctx) return NextResponse.json({error:"School Admin access required."},{status:403});
  const id=new URL(request.url).searchParams.get("id")||""; if(!id) return NextResponse.json({error:"Assignment id is required."},{status:400});
  const admin=createAdminClient(); const {error}=await admin.from("teacher_assignments").delete().eq("id",id).eq("school_id",ctx.schoolId);
  if(error) return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"teacher_assignment_removed",entity_type:"teacher_assignment",entity_id:id});
  return NextResponse.json({ok:true});
}
