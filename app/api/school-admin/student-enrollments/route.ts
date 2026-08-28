import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getContext(){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) return null;
  const {data:role}=await supabase.from("user_school_roles").select("school_id").eq("user_id",user.id).eq("role","school_admin").eq("is_active",true).maybeSingle();
  return role?.school_id?{user,schoolId:role.school_id}:null;
}

export async function POST(request:Request){
  const ctx=await getContext(); if(!ctx) return NextResponse.json({error:"School Admin access required."},{status:403});
  const body=await request.json(); const studentId=String(body.student_id||""); const yearId=String(body.academic_year_id||""); const classId=String(body.class_id||"");
  if(!studentId||!yearId||!classId) return NextResponse.json({error:"Student, academic year and class are required."},{status:400});
  const admin=createAdminClient();
  const [student,year,klass]=await Promise.all([
    admin.from("students").select("id,status").eq("id",studentId).eq("school_id",ctx.schoolId).maybeSingle(),
    admin.from("academic_years").select("id,status").eq("id",yearId).eq("school_id",ctx.schoolId).maybeSingle(),
    admin.from("classes").select("id,academic_year_id,status,capacity").eq("id",classId).eq("school_id",ctx.schoolId).maybeSingle()
  ]);
  if(!student.data||!year.data||!klass.data) return NextResponse.json({error:"Selected student, year or class does not belong to this school."},{status:400});
  if(klass.data.academic_year_id!==yearId) return NextResponse.json({error:"Selected class does not belong to the selected academic year."},{status:400});
  if(student.data.status!=="active"||klass.data.status!=="active")return NextResponse.json({error:"Student and class must be active before enrollment."},{status:400});
  const {data:existing}=await admin.from("student_enrollments").select("id,class_id").eq("school_id",ctx.schoolId).eq("student_id",studentId).eq("academic_year_id",yearId).eq("enrollment_status","active").limit(1).maybeSingle();
  if(existing?.class_id===classId)return NextResponse.json({error:"Student is already actively enrolled in this class for the selected academic year."},{status:409});
  if(klass.data.capacity){const {count}=await admin.from("student_enrollments").select("id",{count:"exact",head:true}).eq("school_id",ctx.schoolId).eq("class_id",classId).eq("academic_year_id",yearId).eq("enrollment_status","active");if((count||0)>=Number(klass.data.capacity))return NextResponse.json({error:"This class has reached its configured capacity."},{status:409});}
  if(existing)await admin.from("student_enrollments").update({enrollment_status:"completed",completed_at:new Date().toISOString().slice(0,10)}).eq("id",existing.id).eq("school_id",ctx.schoolId);
  const {data,error}=await admin.from("student_enrollments").insert({school_id:ctx.schoolId,student_id:studentId,academic_year_id:yearId,class_id:classId,enrollment_status:"active"}).select("id").single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"student_enrolled",entity_type:"student_enrollment",entity_id:data.id,new_values:{student_id:studentId,academic_year_id:yearId,class_id:classId,enrollment_status:"active"}});
  return NextResponse.json({ok:true,id:data.id});
}

export async function PATCH(request:Request){
  const ctx=await getContext(); if(!ctx) return NextResponse.json({error:"School Admin access required."},{status:403});
  const body=await request.json(); const id=String(body.id||""); const status=String(body.enrollment_status||""); const promotion=body.promotion_status?String(body.promotion_status):null;
  if(!id||!["active","completed","withdrawn"].includes(status)) return NextResponse.json({error:"Valid enrollment and status are required."},{status:400});
  const admin=createAdminClient(); const {data:old}=await admin.from("student_enrollments").select("id,enrollment_status,promotion_status,completed_at").eq("id",id).eq("school_id",ctx.schoolId).maybeSingle();if(!old)return NextResponse.json({error:"Enrollment not found."},{status:404});const update:any={enrollment_status:status,promotion_status:promotion}; if(status!=="active") update.completed_at=new Date().toISOString().slice(0,10); else update.completed_at=null;
  const {error}=await admin.from("student_enrollments").update(update).eq("id",id).eq("school_id",ctx.schoolId); if(error) return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"student_enrollment_updated",entity_type:"student_enrollment",entity_id:id,old_values:old,new_values:update});
  return NextResponse.json({ok:true});
}
