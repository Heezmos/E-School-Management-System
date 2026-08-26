import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}

export async function POST(request:Request){
  const ctx=await getPrimaryRole();
  if(ctx.role!=="super_admin") return NextResponse.json({error:"Super Admin access required."},{status:403});
  const b=await request.json();
  const school_name=String(b.school_name||"").trim();
  const contact_name=String(b.contact_name||"").trim();
  const contact_email=String(b.contact_email||"").trim().toLowerCase();
  if(!school_name||!contact_name||!contact_email) return NextResponse.json({error:"School name, contact name and contact email are required."},{status:400});
  const admin=createAdminClient();
  const {data,error}=await admin.from("school_applications").insert({school_name,school_code:String(b.school_code||"").trim().toUpperCase()||null,contact_name,contact_email,contact_phone:String(b.contact_phone||"").trim()||null,address:String(b.address||"").trim()||null,city:String(b.city||"").trim()||null,country:String(b.country||"Sierra Leone").trim(),notes:String(b.notes||"").trim()||null,status:"pending"}).select("id").single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true,id:data.id});
}

export async function PATCH(request:Request){
  const ctx=await getPrimaryRole();
  if(ctx.role!=="super_admin") return NextResponse.json({error:"Super Admin access required."},{status:403});
  const b=await request.json(); const action=String(b.action||""); const admin=createAdminClient();
  const {data:app}=await admin.from("school_applications").select("*").eq("id",b.application_id).maybeSingle();
  if(!app)return NextResponse.json({error:"Application not found."},{status:404});
  if(app.status!=="pending")return NextResponse.json({error:"This application has already been reviewed."},{status:400});
  if(action==="reject"){
    const {error}=await admin.from("school_applications").update({status:"rejected",reviewed_by:ctx.user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",app.id);
    if(error)return NextResponse.json({error:error.message},{status:400});
    await admin.from("audit_logs").insert({user_id:ctx.user.id,action:"reject_school_application",entity_type:"school_application",entity_id:app.id,metadata:{school_name:app.school_name}});
    return NextResponse.json({ok:true});
  }
  if(action==="approve"){
    const code=String(app.school_code||`SCH${Date.now().toString().slice(-6)}`).toUpperCase();
    const slug=`${slugify(app.school_name)}-${code.toLowerCase()}`;
    const {data:school,error:schoolError}=await admin.from("schools").insert({name:app.school_name,slug,school_code:code,email:app.contact_email,phone:app.contact_phone,address:app.address,city:app.city,country:app.country||"Sierra Leone",status:"active"}).select("id,name,school_code").single();
    if(schoolError)return NextResponse.json({error:schoolError.message},{status:400});
    const {error:updateError}=await admin.from("school_applications").update({status:"approved",reviewed_by:ctx.user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",app.id);
    if(updateError)return NextResponse.json({error:updateError.message},{status:400});
    await admin.from("audit_logs").insert({school_id:school.id,user_id:ctx.user.id,action:"approve_school_application",entity_type:"school_application",entity_id:app.id,metadata:{school_name:app.school_name,school_id:school.id}});
    return NextResponse.json({ok:true,school});
  }
  return NextResponse.json({error:"Unsupported action."},{status:400});
}
