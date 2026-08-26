import { notFound, redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import SchoolAdminCreator from "@/components/SchoolAdminCreator";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=["Dashboard","Schools","Applications","Subscriptions","Platform Users","Analytics","Support","Audit Logs","Settings"];

export default async function SchoolPage({params}:{params:Promise<{id:string}>}){
 const ctx=await getPrimaryRole(); if(ctx.role!=="super_admin") redirect("/");
 const {id}=await params; const supabase=await createClient();
 const {data:school}=await supabase.from("schools").select("id,name,school_code,email,phone,address,city,country,status,created_at").eq("id",id).maybeSingle();
 if(!school) notFound();
 const {data:admins}=await supabase.from("user_school_roles").select("user_id,role,is_active,created_at").eq("school_id",id).eq("role","school_admin");
 return <DashboardShell schoolName="Platform Control Center" roleLabel="Super Admin" title={school.name} subtitle={`School code: ${school.school_code}`} nav={nav}>
  <section className="panel"><h2>School Profile</h2><div className="stats" style={{marginTop:16}}><article className="stat"><div><small>Status</small><div className="value" style={{fontSize:24}}>{school.status}</div></div></article><article className="stat"><div><small>Location</small><div className="value" style={{fontSize:20}}>{school.city||"—"}</div><small>{school.country}</small></div></article><article className="stat"><div><small>Contact</small><div style={{marginTop:10}}>{school.email||"—"}</div><small>{school.phone||""}</small></div></article><article className="stat"><div><small>School Admins</small><div className="value">{admins?.length||0}</div></div></article></div></section>
  <SchoolAdminCreator schoolId={school.id} schoolName={school.name} />
  <section className="panel" style={{marginTop:18}}><h2>Assigned School Administrators</h2><div className="tablewrap"><table className="premium-table"><thead><tr><th>USER ID</th><th>ROLE</th><th>STATUS</th></tr></thead><tbody>{admins?.length?admins.map((a:any)=><tr key={a.user_id}><td>{a.user_id}</td><td>School Admin</td><td><span className="pill greenpill">{a.is_active?"Active":"Inactive"}</span></td></tr>):<tr><td colSpan={3}>No School Admin assigned yet.</td></tr>}</tbody></table></div></section>
 </DashboardShell>;
}
