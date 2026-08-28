import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request:Request){
 const ctx=await getPrimaryRole();if(ctx.role!=="teacher"||!ctx.schoolId)return NextResponse.json({error:"Teacher access required."},{status:403});
 const b=await request.json();const admin=createAdminClient();
 const {data:t}=await admin.from("teachers").select("id,status").eq("school_id",ctx.schoolId).eq("profile_id",ctx.user.id).maybeSingle();if(!t||t.status!=="active")return NextResponse.json({error:"Active teacher profile not found."},{status:404});
 const {data:a}=await admin.from("assessments").select("id,status,class_id,academic_year_id,term_id").eq("id",b.assessment_id).eq("school_id",ctx.schoolId).eq("teacher_id",t.id).maybeSingle();
 if(!a||!["draft","completed","returned"].includes(a.status))return NextResponse.json({error:"Assessment cannot be submitted in its current state."},{status:400});
 const [{count:enrolledCount},{count:scoreCount}]=await Promise.all([
  admin.from("student_enrollments").select("id",{count:"exact",head:true}).eq("school_id",ctx.schoolId).eq("academic_year_id",a.academic_year_id).eq("class_id",a.class_id).eq("enrollment_status","active"),
  admin.from("student_scores").select("id",{count:"exact",head:true}).eq("school_id",ctx.schoolId).eq("assessment_id",a.id)
 ]);
 if(!enrolledCount)return NextResponse.json({error:"This class has no active students to assess."},{status:400});
 if((scoreCount||0)!==enrolledCount)return NextResponse.json({error:`Complete all student scores before submitting (${scoreCount||0}/${enrolledCount} entered).`},{status:400});
 const now=new Date().toISOString();const {error}=await admin.from("assessments").update({status:"submitted",submitted_at:now,approved_at:null,approved_by:null,published_at:null}).eq("id",a.id).eq("school_id",ctx.schoolId);if(error)return NextResponse.json({error:error.message},{status:400});
 await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"teacher_submit_assessment",entity_type:"assessment",entity_id:a.id,old_values:{status:a.status},new_values:{status:"submitted",submitted_at:now},metadata:{students:enrolledCount}});
 return NextResponse.json({ok:true});
}
