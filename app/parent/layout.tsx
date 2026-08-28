import{getPrimaryRole}from"@/lib/auth";import{requireSchoolOperational}from"@/lib/school-access";import{redirect}from"next/navigation";
export default async function ParentLayout({children}:{children:React.ReactNode}){const ctx=await getPrimaryRole();if(ctx.role!=="parent")redirect("/");await requireSchoolOperational(ctx.schoolId);return children}
