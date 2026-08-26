import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request:Request){
 const ctx=await getPrimaryRole(); if(ctx.role!=="teacher"||!ctx.schoolId)return NextResponse.json({error:"Teacher access required."},{status:403});
 const b=await request.json(); const admin=createAdminClient();
 const {data:teacher}=await admin.from("teachers").select("id").eq("school_id",ctx.schoolId).eq("profile_id",ctx.user.id).maybeSingle();
 if(!teacher)return NextResponse.json({error:"Teacher profile not found."},{status:404});
 const {data:a}=await admin.from("assessments").select("id,class_id,academic_year_id,maximum_score,weight_percentage,status").eq("id",b.assessment_id).eq("school_id",ctx.schoolId).eq("teacher_id",teacher.id).maybeSingle();
 if(!a)return NextResponse.json({error:"Assessment not found or not owned by you."},{status:403});
 if(["approved","published"].includes(a.status))return NextResponse.json({error:"Approved or published assessments cannot be edited."},{status:400});
 const scores=Array.isArray(b.scores)?b.scores:[]; if(!scores.length)return NextResponse.json({error:"No scores supplied."},{status:400});
 const studentIds=scores.map((s:any)=>s.student_id);
 const {data:enrolled}=await admin.from("student_enrollments").select("student_id").eq("school_id",ctx.schoolId).eq("class_id",a.class_id).eq("academic_year_id",a.academic_year_id).eq("enrollment_status","active").in("student_id",studentIds);
 const allowed=new Set((enrolled||[]).map((x:any)=>x.student_id));
 for(const s of scores){const raw=Number(s.raw_score);if(!allowed.has(s.student_id)||!Number.isFinite(raw)||raw<0||raw>Number(a.maximum_score))return NextResponse.json({error:"One or more student scores are invalid."},{status:400});}
 const rows=scores.map((s:any)=>{const raw=Number(s.raw_score);const pct=raw/Number(a.maximum_score)*100;return{school_id:ctx.schoolId,assessment_id:a.id,student_id:s.student_id,raw_score:raw,percentage_score:pct,weighted_score:pct*Number(a.weight_percentage)/100,teacher_remark:String(s.teacher_remark||"").trim()||null,entered_by:ctx.user.id,updated_at:new Date().toISOString()}});
 const {error}=await admin.from("student_scores").upsert(rows,{onConflict:"assessment_id,student_id"}); if(error)return NextResponse.json({error:error.message},{status:400});
 await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"teacher_save_scores",entity_type:"assessment",entity_id:a.id,metadata:{students:rows.length}});
 return NextResponse.json({ok:true});
}
