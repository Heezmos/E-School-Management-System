import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import SuperAdminSchools from "@/components/SuperAdminSchools";
import SuperAdminApplications from "@/components/SuperAdminApplications";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav = ["Dashboard","Schools","Applications","Subscriptions","Platform Users","Analytics","Support","Audit Logs","Settings"];
const sectionTitles: Record<string,string>={schools:"Schools",applications:"School Applications",subscriptions:"Subscriptions","platform-users":"Platform Users",analytics:"Platform Analytics",support:"Support Center","audit-logs":"Audit Logs",settings:"Platform Settings"};

export default async function SuperAdminSectionPage({params}:{params:Promise<{section:string}>}){
 const ctx=await getPrimaryRole(); if(ctx.role!=="super_admin") redirect("/");
 const {section}=await params; const title=sectionTitles[section]||"Super Admin";
 const supabase=await createClient();
 let schools:any[]=[]; let applications:any[]=[];
 if(section==="schools"){
   const {data}=await supabase.from("schools").select("id,name,school_code,email,phone,city,country,status,created_at").order("created_at",{ascending:false});
   schools=data||[];
 }
 if(section==="applications"){
   const {data}=await supabase.from("school_applications").select("id,school_name,school_code,contact_name,contact_email,contact_phone,address,city,country,notes,status,reviewed_at,created_at").order("created_at",{ascending:false});
   applications=data||[];
 }
 return <DashboardShell schoolName="Platform Control Center" roleLabel="Super Admin" title={title} subtitle="Platform-wide administration" nav={nav}>
   {section==="schools"?<SuperAdminSchools schools={schools}/>:section==="applications"?<SuperAdminApplications applications={applications}/>:<section className="panel"><h2>{title}</h2><div className="empty">This module is connected and will be implemented in the next workflow phase.</div></section>}
 </DashboardShell>;
}
