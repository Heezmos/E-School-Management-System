import {NextResponse} from "next/server";
import{getPrimaryRole}from"@/lib/auth";
import{createAdminClient}from"@/lib/supabase/admin";

export async function PATCH(request:Request){
 const ctx=await getPrimaryRole();if(ctx.role!=="school_admin"||!ctx.schoolId)return NextResponse.json({error:"School Admin access required."},{status:403});
 const b=await request.json();const action=String(b.action||"");const admin=createAdminClient();const {data:card}=await admin.from("report_cards").select("id,status,student_id,academic_year_id,term_id,class_id,overall_percentage,overall_grade").eq("id",b.report_card_id).eq("school_id",ctx.schoolId).maybeSingle();if(!card)return NextResponse.json({error:"Report card not found."},{status:404});
 const {count:subjects}=await admin.from("report_card_subjects").select("id",{count:"exact",head:true}).eq("report_card_id",card.id);if(!subjects)return NextResponse.json({error:"Report card has no subject results."},{status:400});
 let patch:any={};const now=new Date().toISOString();
 if(action==="approve"&&card.status==="generated")patch={status:"approved",approved_at:now,approved_by:ctx.user.id};
 else if(action==="publish"&&card.status==="approved")patch={status:"published",published_at:now};
 else return NextResponse.json({error:"Invalid report card action for its current status."},{status:400});
 const {error}=await admin.from("report_cards").update(patch).eq("id",card.id).eq("school_id",ctx.schoolId);if(error)return NextResponse.json({error:error.message},{status:400});
 await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:`${action}_report_card`,entity_type:"report_card",entity_id:card.id,old_values:{status:card.status},new_values:patch,metadata:{student_id:card.student_id,academic_year_id:card.academic_year_id,term_id:card.term_id,class_id:card.class_id,overall_percentage:card.overall_percentage,overall_grade:card.overall_grade,subjects}});
 return NextResponse.json({ok:true});
}
