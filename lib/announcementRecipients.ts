import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveAnnouncementRecipients(schoolId:string,scope:string,roles:string[],classId?:string|null){
 const admin=createAdminClient(); const users=new Set<string>();
 if(scope==="school"||scope==="roles"){
  let q=admin.from("user_school_roles").select("user_id,role").eq("school_id",schoolId).eq("is_active",true);
  const {data}=await q; (data||[]).forEach((x:any)=>{if(scope==="school"||!roles.length||roles.includes(x.role))users.add(x.user_id)});
 }
 if(scope==="class"&&classId){
  const {data:enrollments}=await admin.from("student_enrollments").select("student_id").eq("school_id",schoolId).eq("class_id",classId).eq("enrollment_status","active");
  const studentIds=(enrollments||[]).map((x:any)=>x.student_id);
  if(studentIds.length){
   const {data:students}=await admin.from("students").select("id,profile_id").eq("school_id",schoolId).in("id",studentIds); (students||[]).forEach((x:any)=>x.profile_id&&users.add(x.profile_id));
   const {data:links}=await admin.from("student_guardians").select("guardian_id").eq("school_id",schoolId).in("student_id",studentIds); const guardianIds=[...new Set((links||[]).map((x:any)=>x.guardian_id))];
   if(guardianIds.length){const {data:guardians}=await admin.from("guardians").select("profile_id").eq("school_id",schoolId).in("id",guardianIds);(guardians||[]).forEach((x:any)=>x.profile_id&&users.add(x.profile_id))}
  }
  const {data:assignments}=await admin.from("teacher_assignments").select("teacher_id").eq("school_id",schoolId).eq("class_id",classId).eq("status","active"); const teacherIds=[...new Set((assignments||[]).map((x:any)=>x.teacher_id))];
  if(teacherIds.length){const {data:teachers}=await admin.from("teachers").select("profile_id").eq("school_id",schoolId).in("id",teacherIds);(teachers||[]).forEach((x:any)=>x.profile_id&&users.add(x.profile_id))}
  const {data:admins}=await admin.from("user_school_roles").select("user_id").eq("school_id",schoolId).eq("role","school_admin").eq("is_active",true);(admins||[]).forEach((x:any)=>users.add(x.user_id));
 }
 return [...users];
}
