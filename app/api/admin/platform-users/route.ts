import {NextResponse} from "next/server";
import {getPrimaryRole} from "@/lib/auth";
import {createAdminClient} from "@/lib/supabase/admin";

export async function PATCH(request:Request){
 const ctx=await getPrimaryRole(); if(ctx.role!=="super_admin")return NextResponse.json({error:"Super Admin access required."},{status:403});
 const body=await request.json(); const userId=String(body.user_id||""); const action=String(body.action||""); if(!userId)return NextResponse.json({error:"User is required."},{status:400});
 const admin=createAdminClient(); const {data:targetRoles}=await admin.from("user_school_roles").select("role,school_id").eq("user_id",userId); if((targetRoles||[]).some((x:any)=>x.role==="super_admin")&&action!=="reset_password")return NextResponse.json({error:"Super Admin accounts cannot be disabled from this directory."},{status:400});
 if(action==="disable"||action==="enable"){
  const enabled=action==="enable"; const {error:p}=await admin.from("profiles").update({is_active:enabled,updated_at:new Date().toISOString()}).eq("id",userId); if(p)return NextResponse.json({error:p.message},{status:400});
  const {error:r}=await admin.from("user_school_roles").update({is_active:enabled}).eq("user_id",userId); if(r)return NextResponse.json({error:r.message},{status:400});
  await admin.from("audit_logs").insert({user_id:ctx.user.id,school_id:(targetRoles||[])[0]?.school_id||null,action:`platform_user_${action}`,entity_type:"platform_user",entity_id:userId});
  return NextResponse.json({ok:true});
 }
 if(action==="reset_password"){
  const password=String(body.password||""); if(password.length<8)return NextResponse.json({error:"Temporary password must be at least 8 characters."},{status:400});
  const {error}=await admin.auth.admin.updateUserById(userId,{password,user_metadata:{must_change_password:true}}); if(error)return NextResponse.json({error:error.message},{status:400});
  await admin.from("audit_logs").insert({user_id:ctx.user.id,school_id:(targetRoles||[])[0]?.school_id||null,action:"platform_user_password_reset",entity_type:"platform_user",entity_id:userId});
  return NextResponse.json({ok:true});
 }
 return NextResponse.json({error:"Unsupported action."},{status:400});
}
