import{getPrimaryRole}from"@/lib/auth";import{requireSchoolOperational}from"@/lib/school-access";import{redirect}from"next/navigation";
export default async function StudentLayout({children}:{children:React.ReactNode}){const ctx=await getPrimaryRole();if(ctx.role!=="student")redirect("/");await requireSchoolOperational(ctx.schoolId);return children}
