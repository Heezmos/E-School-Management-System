import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import SuperAdminSchools from "@/components/SuperAdminSchools";
import SuperAdminApplications from "@/components/SuperAdminApplications";
import SuperAdminSubscriptions from "@/components/SuperAdminSubscriptions";
import SuperAdminPlatformUsers from "@/components/SuperAdminPlatformUsers";
import SuperAdminAuditLogs from "@/components/SuperAdminAuditLogs";
import SuperAdminAnalytics from "@/components/SuperAdminAnalytics";
import SuperAdminSupport from "@/components/SuperAdminSupport";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=["Dashboard","Schools","Applications","Subscriptions","Platform Users","Analytics","Support","Audit Logs","Settings"];
const sectionTitles:Record<string,string>={schools:"Schools",applications:"School Applications",subscriptions:"Subscriptions","platform-users":"Platform Users",analytics:"Platform Analytics",support:"Support Center","audit-logs":"Audit Logs",settings:"Platform Settings"};
export default async function SuperAdminSectionPage({params}:{params:Promise<{section:string}>}){
 const ctx=await getPrimaryRole();if(ctx.role!=="super_admin")redirect("/");const{section}=await params;const title=sectionTitles[section]||"Super Admin";const supabase=await createClient();
 let schools:any[]=[],applications:any[]=[],plans:any[]=[],subscriptions:any[]=[],payments:any[]=[],platformUsers:any[]=[],auditLogs:any[]=[],students:any[]=[],teachers:any[]=[],classes:any[]=[],assessments:any[]=[],attendance:any[]=[],analyticsUsers:any[]=[],supportTickets:any[]=[];
 if(section==="schools"){const{data}=await supabase.from("schools").select("id,name,school_code,email,phone,city,country,status,created_at").order("created_at",{ascending:false});schools=data||[]}
 if(section==="applications"){const{data}=await supabase.from("school_applications").select("id,school_name,school_code,contact_name,contact_email,contact_phone,address,city,country,notes,status,reviewed_at,created_at").order("created_at",{ascending:false});applications=data||[]}
 if(section==="subscriptions"){const[schoolRes,planRes,subscriptionRes,paymentRes]=await Promise.all([supabase.from("schools").select("id,name,school_code,status").order("name"),supabase.from("subscription_plans").select("id,name,code,description,billing_cycle,price,setup_fee,trial_days,grace_period_days,features,currency,max_students,max_teachers,is_active,created_at").order("created_at",{ascending:false}),supabase.from("school_subscriptions").select("id,school_id,plan_id,status,starts_at,ends_at,amount,currency,notes,created_at,schools(name,school_code),subscription_plans(name,billing_cycle)").order("created_at",{ascending:false}),supabase.from("subscription_payments").select("id,school_subscription_id,school_id,amount,currency,payment_date,payment_method,reference,period_start,period_end,status,notes,created_at,schools(name,school_code)").order("payment_date",{ascending:false}).order("created_at",{ascending:false})]);schools=schoolRes.data||[];plans=planRes.data||[];subscriptions=subscriptionRes.data||[];payments=paymentRes.data||[]}
 if(section==="platform-users"){const{data}=await supabase.from("user_school_roles").select("id,user_id,school_id,role,is_active,created_at,profiles:user_id(first_name,last_name,email,phone,is_active),schools(name,school_code)").order("created_at",{ascending:false});platformUsers=(data||[]).map((x:any)=>({role_id:x.id,user_id:x.user_id,school_id:x.school_id,role:x.role,role_active:x.is_active,created_at:x.created_at,first_name:x.profiles?.first_name,last_name:x.profiles?.last_name,email:x.profiles?.email,phone:x.profiles?.phone,profile_active:x.profiles?.is_active??true,school_name:x.schools?.name,school_code:x.schools?.school_code}))}
 if(section==="audit-logs"){const{data}=await supabase.from("audit_logs").select("id,school_id,user_id,action,entity_type,entity_id,old_values,new_values,reason,created_at,profiles:user_id(first_name,last_name,email),schools(name,school_code)").order("created_at",{ascending:false}).limit(1000);auditLogs=(data||[]).map((x:any)=>({id:x.id,school_id:x.school_id,user_id:x.user_id,action:x.action,entity_type:x.entity_type,entity_id:x.entity_id,old_values:x.old_values,new_values:x.new_values,reason:x.reason,created_at:x.created_at,actor_name:x.profiles?`${x.profiles.first_name||""} ${x.profiles.last_name||""}`.trim():null,actor_email:x.profiles?.email,school_name:x.schools?.name,school_code:x.schools?.school_code}))}
 if(section==="analytics"){
  const [schoolRes,userRes,studentRes,teacherRes,classRes,assessmentRes,attendanceRes,subscriptionRes,paymentRes]=await Promise.all([
   supabase.from("schools").select("id,name,school_code,status,created_at").order("name"),
   supabase.from("user_school_roles").select("user_id,school_id,role,is_active"),
   supabase.from("students").select("id,school_id,status,created_at"),
   supabase.from("teachers").select("id,school_id,status,created_at"),
   supabase.from("classes").select("id,school_id,status,created_at"),
   supabase.from("assessments").select("id,school_id,status,created_at"),
   supabase.from("attendance_records").select("status,attendance_sessions!inner(school_id)"),
   supabase.from("school_subscriptions").select("id,school_id,status,starts_at,ends_at"),
   supabase.from("subscription_payments").select("id,school_id,amount,currency,status,payment_date")
  ]);
  schools=schoolRes.data||[];analyticsUsers=userRes.data||[];students=studentRes.data||[];teachers=teacherRes.data||[];classes=classRes.data||[];assessments=assessmentRes.data||[];subscriptions=subscriptionRes.data||[];payments=paymentRes.data||[];attendance=(attendanceRes.data||[]).map((x:any)=>({status:x.status,school_id:x.attendance_sessions?.school_id}));
 }
 if(section==="support"){
  const {data}=await supabase.from("support_tickets").select("id,ticket_number,school_id,created_by,subject,category,priority,status,description,resolution_summary,last_response_at,resolved_at,closed_at,created_at,updated_at,schools(name,school_code),profiles:created_by(first_name,last_name,email),support_ticket_messages(id,sender_id,message,is_internal,created_at,profiles:sender_id(first_name,last_name,email))").order("updated_at",{ascending:false});
  supportTickets=(data||[]).map((t:any)=>({id:t.id,ticket_number:t.ticket_number,school_id:t.school_id,subject:t.subject,category:t.category,priority:t.priority,status:t.status,description:t.description,resolution_summary:t.resolution_summary,last_response_at:t.last_response_at,resolved_at:t.resolved_at,closed_at:t.closed_at,created_at:t.created_at,updated_at:t.updated_at,school_name:t.schools?.name,school_code:t.schools?.school_code,creator_name:t.profiles?`${t.profiles.first_name||""} ${t.profiles.last_name||""}`.trim():null,creator_email:t.profiles?.email,messages:(t.support_ticket_messages||[]).filter((m:any)=>!m.is_internal).sort((a:any,b:any)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime()).map((m:any)=>({id:m.id,message:m.message,created_at:m.created_at,sender_name:m.profiles?`${m.profiles.first_name||""} ${m.profiles.last_name||""}`.trim():null,sender_email:m.profiles?.email}))}));
 }
 return <DashboardShell schoolName="Platform Control Center" roleLabel="Super Admin" title={title} subtitle="Platform-wide administration" nav={nav}>{section==="schools"?<SuperAdminSchools schools={schools}/>:section==="applications"?<SuperAdminApplications applications={applications}/>:section==="subscriptions"?<SuperAdminSubscriptions plans={plans} schools={schools} subscriptions={subscriptions} payments={payments}/>:section==="platform-users"?<SuperAdminPlatformUsers users={platformUsers}/>:section==="analytics"?<SuperAdminAnalytics schools={schools} users={analyticsUsers} students={students} teachers={teachers} classes={classes} assessments={assessments} attendance={attendance} subscriptions={subscriptions} payments={payments}/>:section==="support"?<SuperAdminSupport tickets={supportTickets}/>:section==="audit-logs"?<SuperAdminAuditLogs logs={auditLogs}/>:<section className="panel"><h2>{title}</h2><div className="empty">This module is connected and will be implemented in the next workflow phase.</div></section>}</DashboardShell>
}
