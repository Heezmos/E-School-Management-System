import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ctx=await getPrimaryRole();
  if(ctx.role!=="teacher"||!ctx.schoolId) return NextResponse.json({error:"Teacher access required."},{status:403});
  const b=await request.json(); const admin=createAdminClient();
  const {data:teacher}=await admin.from("teachers").select("id").eq("school_id",ctx.schoolId).eq("profile_id",ctx.user.id).maybeSingle();
  if(!teacher) return NextResponse.json({error:"Teacher profile not found."},{status:404});
  const {data:assignment}=await admin.from("teacher_assignments").select("id,academic_year_id,term_id,class_id,subject_id").eq("school_id",ctx.schoolId).eq("teacher_id",teacher.id).eq("id",b.assignment_id).eq("status","active").maybeSingle();
  if(!assignment) return NextResponse.json({error:"You are not assigned to this class and subject."},{status:403});
  const termId=b.term_id||assignment.term_id;
  if(!termId) return NextResponse.json({error:"Select a term for this assessment."},{status:400});
  const {data:category}=await admin.from("assessment_categories").select("id,academic_year_id,term_id,default_weight").eq("id",b.assessment_category_id).eq("school_id",ctx.schoolId).maybeSingle();
  if(!category||category.academic_year_id!==assignment.academic_year_id||(category.term_id&&category.term_id!==termId)) return NextResponse.json({error:"Assessment category does not match the assignment period."},{status:400});
  const maximum=Number(b.maximum_score), weight=Number(b.weight_percentage);
  if(!b.title||!b.assessment_date||!Number.isFinite(maximum)||maximum<=0||!Number.isFinite(weight)||weight<0||weight>100) return NextResponse.json({error:"Enter valid assessment details."},{status:400});
  const {data,error}=await admin.from("assessments").insert({school_id:ctx.schoolId,academic_year_id:assignment.academic_year_id,term_id:termId,class_id:assignment.class_id,subject_id:assignment.subject_id,teacher_id:teacher.id,assessment_category_id:category.id,title:String(b.title).trim(),description:String(b.description||"").trim()||null,maximum_score:maximum,weight_percentage:weight,assessment_date:b.assessment_date,status:"draft"}).select("id").single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"teacher_create_assessment",entity_type:"assessment",entity_id:data.id,metadata:{title:b.title}});
  return NextResponse.json({ok:true,id:data.id});
}
