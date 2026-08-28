import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request:Request){
 const ctx=await getPrimaryRole();if(ctx.role!=="school_admin"||!ctx.schoolId)return NextResponse.json({error:"School Admin access required."},{status:403});
 const b=await request.json();const action=String(b.action||"");const admin=createAdminClient();
 const {data:a}=await admin.from("assessments").select("id,status,class_id,academic_year_id,term_id,subject_id").eq("id",b.assessment_id).eq("school_id",ctx.schoolId).maybeSingle();if(!a)return NextResponse.json({error:"Assessment not found."},{status:404});
 let patch:any={};const now=new Date().toISOString();
 if(action==="approve"&&a.status==="submitted"){
  const [{count:enrolled},{count:scores}]=await Promise.all([admin.from("student_enrollments").select("id",{count:"exact",head:true}).eq("school_id",ctx.schoolId).eq("academic_year_id",a.academic_year_id).eq("class_id",a.class_id).eq("enrollment_status","active"),admin.from("student_scores").select("id",{count:"exact",head:true}).eq("school_id",ctx.schoolId).eq("assessment_id",a.id)]);
  if(!enrolled||(scores||0)!==enrolled)return NextResponse.json({error:`Assessment cannot be approved until every active student has a score (${scores||0}/${enrolled||0}).`},{status:400});
  patch={status:"approved",approved_at:now,approved_by:ctx.user.id};
 } else if(action==="return"&&a.status==="submitted")patch={status:"returned",approved_at:null,approved_by:null,published_at:null};
 else if(action==="publish"&&a.status==="approved")patch={status:"published",published_at:now};
 else return NextResponse.json({error:"This action is not valid for the current assessment status."},{status:400});
 const {error}=await admin.from("assessments").update(patch).eq("id",a.id).eq("school_id",ctx.schoolId);if(error)return NextResponse.json({error:error.message},{status:400});
 await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:`school_admin_${action}_assessment`,entity_type:"assessment",entity_id:a.id,old_values:{status:a.status},new_values:patch,metadata:{class_id:a.class_id,subject_id:a.subject_id,term_id:a.term_id}});
 return NextResponse.json({ok:true});
}
