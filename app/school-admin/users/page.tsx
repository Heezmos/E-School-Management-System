import {redirect} from "next/navigation";
import PremiumShell from "@/components/PremiumShell";
import SchoolUserManager from "@/components/SchoolUserManager";
import {getPrimaryRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";

const nav=[{label:"Dashboard",href:"/school-admin",icon:"⌂",group:"OVERVIEW"},{label:"School Setup",href:"/school-admin/setup",icon:"⚙",group:"OVERVIEW"},{label:"User Management",href:"/school-admin/users",icon:"♙",group:"PEOPLE"},{label:"Teachers",href:"/school-admin/teachers",icon:"♟",group:"PEOPLE"},{label:"Students",href:"/school-admin/students",icon:"♚",group:"PEOPLE"},{label:"Parents & Guardians",href:"/school-admin/parents",icon:"♧",group:"PEOPLE"},{label:"Classes",href:"/school-admin/classes",icon:"▦",group:"ACADEMICS"},{label:"Subjects",href:"/school-admin/subjects",icon:"▤",group:"ACADEMICS"},{label:"Assessments",href:"/school-admin/assessments",icon:"✓",group:"ACADEMICS"},{label:"Attendance",href:"/school-admin/attendance",icon:"◷",group:"ACADEMICS"},{label:"Results & Reports",href:"/school-admin/results",icon:"▥",group:"ACADEMICS"},{label:"Analytics",href:"/school-admin/analytics",icon:"⌁",group:"ACADEMICS"}];

export default async function SchoolUserManagement(){
 const ctx=await getPrimaryRole();if(ctx.role!=="school_admin")redirect("/");const supabase=await createClient();
 const {data:roles}=await supabase.from("user_school_roles").select("user_id,role,is_active").eq("school_id",ctx.schoolId).in("role",["teacher","parent","student"]).order("created_at",{ascending:false});
 const ids=(roles||[]).map(r=>r.user_id);let profiles:any[]=[];if(ids.length){const p=await supabase.from("profiles").select("id,first_name,last_name,email,phone").in("id",ids);profiles=p.data||[];}
 const profileMap=new Map(profiles.map(p=>[p.id,p]));const users=(roles||[]).map(r=>{const p=profileMap.get(r.user_id)||{};return{...r,first_name:p.first_name||"",last_name:p.last_name||"",email:p.email||"",phone:p.phone||null};});
 return <PremiumShell schoolName={ctx.schoolName||"School Workspace"} userLabel="Administrator" roleLabel="School Admin" nav={nav}><section className="hero"><div><h1>User Management</h1><p>Create teachers, parents and student accounts with secure school-scoped access.</p></div><div className="term">{users.length} school users</div></section><SchoolUserManager users={users}/></PremiumShell>;
}
