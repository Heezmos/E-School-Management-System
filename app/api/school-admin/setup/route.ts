import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getContext(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) return null;
 const {data:role}=await supabase.from("user_school_roles").select("role,school_id").eq("user_id",user.id).eq("is_active",true).eq("role","school_admin").maybeSingle();
 if(!role?.school_id) return null;
 return {user,schoolId:role.school_id as string};
}
const validDateRange=(start:any,end:any)=>Boolean(start&&end&&String(start)<=String(end));

export async function POST(request:Request){
 const ctx=await getContext(); if(!ctx) return NextResponse.json({error:"School Admin access required."},{status:403});
 const body=await request.json(); const action=String(body.action||""); const admin=createAdminClient();
 try{
  if(action==="update_school"){
   const patch={email:String(body.email||"").trim()||null,phone:String(body.phone||"").trim()||null,address:String(body.address||"").trim()||null,city:String(body.city||"").trim()||null,country:String(body.country||"Sierra Leone").trim()};
   const {data:old}=await admin.from("schools").select("email,phone,address,city,country").eq("id",ctx.schoolId).maybeSingle();
   const {error}=await admin.from("schools").update(patch).eq("id",ctx.schoolId); if(error) throw error;
   await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"update",entity_type:"school",entity_id:ctx.schoolId,old_values:old||null,new_values:patch});
   return NextResponse.json({ok:true});
  }
  if(action==="create_year"){
   const row={school_id:ctx.schoolId,name:String(body.name||"").trim(),start_date:body.start_date,end_date:body.end_date,status:String(body.status||"upcoming"),is_current:Boolean(body.is_current)};
   if(!row.name||!validDateRange(row.start_date,row.end_date)) return NextResponse.json({error:"Academic year requires a name and a valid start/end date range."},{status:400});
   if(!["upcoming","active","completed"].includes(row.status)) return NextResponse.json({error:"Invalid academic year status."},{status:400});
   if(row.is_current){row.status="active";await admin.from("academic_years").update({is_current:false}).eq("school_id",ctx.schoolId).eq("is_current",true);}
   const {data,error}=await admin.from("academic_years").insert(row).select("id").single(); if(error) throw error;
   await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"create",entity_type:"academic_year",entity_id:data.id,new_values:row});
   return NextResponse.json({ok:true});
  }
  if(action==="create_term"){
   const yearId=String(body.academic_year_id||"");const row={school_id:ctx.schoolId,academic_year_id:yearId,name:String(body.name||"").trim(),sequence_number:Number(body.sequence_number||1),start_date:body.start_date,end_date:body.end_date,status:String(body.status||"upcoming")};
   if(!yearId||!row.name||!validDateRange(row.start_date,row.end_date)||!Number.isInteger(row.sequence_number)||row.sequence_number<1) return NextResponse.json({error:"Term details are incomplete or invalid."},{status:400});
   const {data:year}=await admin.from("academic_years").select("id,start_date,end_date").eq("id",yearId).eq("school_id",ctx.schoolId).maybeSingle();
   if(!year)return NextResponse.json({error:"Selected academic year does not belong to this school."},{status:400});
   if(String(row.start_date)<String(year.start_date)||String(row.end_date)>String(year.end_date))return NextResponse.json({error:"Term dates must fall within the selected academic year."},{status:400});
   const {data,error}=await admin.from("terms").insert(row).select("id").single(); if(error) throw error;
   await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"create",entity_type:"term",entity_id:data.id,new_values:row});
   return NextResponse.json({ok:true});
  }
  if(action==="create_level"){
   const row={school_id:ctx.schoolId,name:String(body.name||"").trim(),code:String(body.code||"").trim()||null,sequence_number:Number(body.sequence_number||1)};
   if(!row.name||!Number.isInteger(row.sequence_number)||row.sequence_number<1) return NextResponse.json({error:"Class level name and a valid sequence are required."},{status:400});
   const {data,error}=await admin.from("class_levels").insert(row).select("id").single(); if(error) throw error;
   await admin.from("audit_logs").insert({school_id:ctx.schoolId,user_id:ctx.user.id,action:"create",entity_type:"class_level",entity_id:data.id,new_values:row});
   return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"Unsupported setup action."},{status:400});
 }catch(e:any){return NextResponse.json({error:e?.message||"Setup action failed."},{status:400});}
}
