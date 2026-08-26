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
  const body=await request.json(); const studentId=String(body.student_id||""); const guardianId=String(body.guardian_id||""); const relationship=String(body.relationship||"").trim(); const isPrimary=Boolean(body.is_primary); const canReceive=body.can_receive_notifications!==false;
  if(!studentId||!guardianId||!relationship) return NextResponse.json({error:"Student, guardian and relationship are required."},{status:400});
  const admin=createAdminClient();
  const [student,guardian]=await Promise.all([
    admin.from("students").select("id").eq("id",studentId).eq("school_id",ctx.schoolId).maybeSingle(),
    admin.from("guardians").select("id").eq("id",guardianId).eq("school_id",ctx.schoolId).maybeSingle()
  ]);
  if(!student.data||!guardian.data) return NextResponse.json({error:"Student or guardian does not belong to this school."},{status:400});
  if(isPrimary) await admin.from("student_guardians").update({is_primary:false}).eq("school_id",ctx.schoolId).eq("student_id",studentId);
  const {data,error}=await admin.from("student_guardians").insert({school_id:ctx.schoolId,student_id:studentId,guardian_id:guardianId,relationship,is_primary:isPrimary,can_receive_notifications:canReceive}).select("id").single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"guardian_linked_to_student",entity_type:"student_guardian",entity_id:data.id,new_values:body});
  return NextResponse.json({ok:true,id:data.id});
}

export async function PATCH(request:Request){
  const ctx=await getContext(); if(!ctx) return NextResponse.json({error:"School Admin access required."},{status:403});
  const body=await request.json(); const id=String(body.id||""); if(!id) return NextResponse.json({error:"Link id is required."},{status:400});
  const admin=createAdminClient(); const update:any={}; if(body.relationship!==undefined) update.relationship=String(body.relationship); if(body.is_primary!==undefined) update.is_primary=Boolean(body.is_primary); if(body.can_receive_notifications!==undefined) update.can_receive_notifications=Boolean(body.can_receive_notifications);
  const {data:existing}=await admin.from("student_guardians").select("student_id").eq("id",id).eq("school_id",ctx.schoolId).maybeSingle(); if(!existing) return NextResponse.json({error:"Relationship not found."},{status:404});
  if(update.is_primary) await admin.from("student_guardians").update({is_primary:false}).eq("school_id",ctx.schoolId).eq("student_id",existing.student_id);
  const {error}=await admin.from("student_guardians").update(update).eq("id",id).eq("school_id",ctx.schoolId); if(error) return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true});
}

export async function DELETE(request:Request){
  const ctx=await getContext(); if(!ctx) return NextResponse.json({error:"School Admin access required."},{status:403});
  const id=new URL(request.url).searchParams.get("id")||""; if(!id) return NextResponse.json({error:"Link id is required."},{status:400});
  const admin=createAdminClient(); const {error}=await admin.from("student_guardians").delete().eq("id",id).eq("school_id",ctx.schoolId); if(error) return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"guardian_unlinked_from_student",entity_type:"student_guardian",entity_id:id});
  return NextResponse.json({ok:true});
}
