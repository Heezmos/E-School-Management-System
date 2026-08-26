import { redirect } from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import SchoolSetupManager from "@/components/SchoolSetupManager";
import { getPrimaryRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nav=[{label:"Dashboard",href:"/school-admin",icon:"⌂",group:"OVERVIEW"},{label:"School Setup",href:"/school-admin/setup",icon:"⚙",group:"OVERVIEW"},{label:"User Management",href:"/school-admin/users",icon:"♙",group:"PEOPLE"},{label:"Teachers",href:"/school-admin/teachers",icon:"♟",group:"PEOPLE"},{label:"Students",href:"/school-admin/students",icon:"♚",group:"PEOPLE"},{label:"Parents & Guardians",href:"/school-admin/parents",icon:"♧",group:"PEOPLE"},{label:"Classes",href:"/school-admin/classes",icon:"▦",group:"ACADEMICS"},{label:"Subjects",href:"/school-admin/subjects",icon:"▤",group:"ACADEMICS"},{label:"Assessments",href:"/school-admin/assessments",icon:"✓",group:"ACADEMICS"},{label:"Attendance",href:"/school-admin/attendance",icon:"◷",group:"ACADEMICS"},{label:"Results & Reports",href:"/school-admin/results",icon:"▥",group:"ACADEMICS"},{label:"Analytics",href:"/school-admin/analytics",icon:"⌁",group:"ACADEMICS"}];

export default async function Page(){
 const ctx=await getPrimaryRole();if(ctx.role!=="school_admin")redirect("/");
 const supabase=await createClient(); const schoolId=ctx.schoolId!;
 const [school,years,terms,levels]=await Promise.all([
  supabase.from("schools").select("id,name,school_code,email,phone,address,city,country,status").eq("id",schoolId).single(),
  supabase.from("academic_years").select("id,name,start_date,end_date,status,is_current").eq("school_id",schoolId).order("start_date",{ascending:false}),
  supabase.from("terms").select("id,name,sequence_number,start_date,end_date,status,academic_years(name)").eq("school_id",schoolId).order("start_date",{ascending:false}),
  supabase.from("class_levels").select("id,name,code,sequence_number").eq("school_id",schoolId).order("sequence_number",{ascending:true})
 ]);
 return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}><section className="hero"><div><h1>School Setup</h1><p>Configure the academic foundation that powers classes, teaching, assessment, attendance and reporting.</p></div><div className="term">{school.data?.status||"active"}</div></section><SchoolSetupManager school={school.data} years={years.data||[]} terms={terms.data||[]} levels={levels.data||[]}/></PremiumShell>;
}
