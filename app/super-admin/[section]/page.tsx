import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import SuperAdminSchools from "@/components/SuperAdminSchools";
import SuperAdminApplications from "@/components/SuperAdminApplications";
import SuperAdminSubscriptions from "@/components/SuperAdminSubscriptions";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav = ["Dashboard","Schools","Applications","Subscriptions","Platform Users","Analytics","Support","Audit Logs","Settings"];
const sectionTitles: Record<string,string>={schools:"Schools",applications:"School Applications",subscriptions:"Subscriptions", "platform-users":"Platform Users",analytics:"Platform Analytics",support:"Support Center","audit-logs":"Audit Logs",settings:"Platform Settings"};

export default async function SuperAdminSectionPage({params}:{params:Promise<{section:string}>}){
 const ctx=await getPrimaryRole(); if(ctx.role!=="super_admin") redirect("/");
 const {section}=await params; const title=sectionTitles[section]||"Super Admin";
 const supabase=await createClient();
 let schools:any[]=[]; let applications:any[]=[]; let plans:any[]=[]; let subscriptions:any[]=[]; let payments:any[]=[];
 if(section==="schools"){
   const {data}=await supabase.from("schools").select("id,name,school_code,email,phone,city,country,status,created_at").order("created_at",{ascending:false});
   schools=data||[];
 }
 if(section==="applications"){
   const {data}=await supabase.from("school_applications").select("id,school_name,school_code,contact_name,contact_email,contact_phone,address,city,country,notes,status,reviewed_at,created_at").order("created_at",{ascending:false});
   applications=data||[];
 }
 if(section==="subscriptions"){
   const [schoolRes,planRes,subscriptionRes,paymentRes]=await Promise.all([
     supabase.from("schools").select("id,name,school_code,status").order("name"),
     supabase.from("subscription_plans").select("id,name,code,description,billing_cycle,price,setup_fee,trial_days,grace_period_days,features,currency,max_students,max_teachers,is_active,created_at").order("created_at",{ascending:false}),
     supabase.from("school_subscriptions").select("id,school_id,plan_id,status,starts_at,ends_at,amount,currency,notes,created_at,schools(name,school_code),subscription_plans(name,billing_cycle)").order("created_at",{ascending:false}),
     supabase.from("subscription_payments").select("id,school_subscription_id,school_id,amount,currency,payment_date,payment_method,reference,period_start,period_end,status,notes,created_at,schools(name,school_code)").order("payment_date",{ascending:false}).order("created_at",{ascending:false})
   ]);
   schools=schoolRes.data||[]; plans=planRes.data||[]; subscriptions=subscriptionRes.data||[]; payments=paymentRes.data||[];
 }
 return <DashboardShell schoolName="Platform Control Center" roleLabel="Super Admin" title={title} subtitle="Platform-wide administration" nav={nav}>
   {section==="schools"?<SuperAdminSchools schools={schools}/>:section==="applications"?<SuperAdminApplications applications={applications}/>:section==="subscriptions"?<SuperAdminSubscriptions plans={plans} schools={schools} subscriptions={subscriptions} payments={payments}/>:<section className="panel"><h2>{title}</h2><div className="empty">This module is connected and will be implemented in the next workflow phase.</div></section>}
 </DashboardShell>;
}
