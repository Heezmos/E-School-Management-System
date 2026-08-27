import {NextResponse} from "next/server";
import {getPrimaryRole} from "@/lib/auth";
import {createAdminClient} from "@/lib/supabase/admin";

export async function PATCH(request:Request){
 const ctx=await getPrimaryRole(); if(ctx.role!=="super_admin")return NextResponse.json({error:"Super Admin access required."},{status:403});
 const body=await request.json(); const ticketId=String(body.ticket_id||""); const action=String(body.action||""); if(!ticketId)return NextResponse.json({error:"Ticket is required."},{status:400});
 const admin=createAdminClient(); const {data:ticket}=await admin.from("support_tickets").select("id,school_id,status,priority").eq("id",ticketId).maybeSingle(); if(!ticket)return NextResponse.json({error:"Support ticket not found."},{status:404});
 if(action==="status"){
  const status=String(body.status||""); if(!["open","in_progress","waiting_on_school","resolved","closed"].includes(status))return NextResponse.json({error:"Invalid status."},{status:400});
  const patch:any={status,updated_at:new Date().toISOString()}; if(status==="resolved")patch.resolved_at=new Date().toISOString(); if(status==="closed")patch.closed_at=new Date().toISOString();
  const{error}=await admin.from("support_tickets").update(patch).eq("id",ticketId); if(error)return NextResponse.json({error:error.message},{status:400}); return NextResponse.json({ok:true});
 }
 if(action==="priority"){
  const priority=String(body.priority||""); if(!["low","medium","high","urgent"].includes(priority))return NextResponse.json({error:"Invalid priority."},{status:400});
  const{error}=await admin.from("support_tickets").update({priority,updated_at:new Date().toISOString()}).eq("id",ticketId); if(error)return NextResponse.json({error:error.message},{status:400}); return NextResponse.json({ok:true});
 }
 if(action==="reply"){
  const message=String(body.message||"").trim(); if(!message)return NextResponse.json({error:"Reply message is required."},{status:400});
  const{error}=await admin.from("support_ticket_messages").insert({ticket_id:ticketId,sender_id:ctx.user.id,message,is_internal:false}); if(error)return NextResponse.json({error:error.message},{status:400});
  await admin.from("support_tickets").update({status:"in_progress",last_response_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",ticketId); return NextResponse.json({ok:true});
 }
 return NextResponse.json({error:"Unsupported action."},{status:400});
}
