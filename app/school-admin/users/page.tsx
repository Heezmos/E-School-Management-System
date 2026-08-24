"use client";
import { FormEvent, useState } from "react";
import PremiumShell from "@/components/PremiumShell";

const nav = [
  { label:"Dashboard", href:"/school-admin", icon:"⌂", group:"OVERVIEW" },
  { label:"School Setup", href:"/school-admin/setup", icon:"⚙", group:"OVERVIEW" },
  { label:"User Management", href:"/school-admin/users", icon:"♙", group:"PEOPLE" },
  { label:"Teachers", href:"/school-admin/teachers", icon:"♟", group:"PEOPLE" },
  { label:"Students", href:"/school-admin/students", icon:"♚", group:"PEOPLE" },
  { label:"Parents & Guardians", href:"/school-admin/parents", icon:"♧", group:"PEOPLE" },
  { label:"Classes", href:"/school-admin/classes", icon:"▦", group:"ACADEMICS" },
  { label:"Subjects", href:"/school-admin/subjects", icon:"▤", group:"ACADEMICS" },
  { label:"Assessments", href:"/school-admin/assessments", icon:"✓", group:"ACADEMICS" },
  { label:"Attendance", href:"/school-admin/attendance", icon:"◷", group:"ACADEMICS" },
  { label:"Results & Reports", href:"/school-admin/results", icon:"▥", group:"ACADEMICS" },
  { label:"Analytics", href:"/school-admin/analytics", icon:"⌁", group:"ACADEMICS" }
];

export default function SchoolUserManagement(){
 const [message,setMessage]=useState(""); const [working,setWorking]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setWorking(true);setMessage("");
  const form=new FormData(event.currentTarget);
  const response=await fetch("/api/admin/users/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({first_name:form.get("first_name"),last_name:form.get("last_name"),email:form.get("email"),role:form.get("role")})});
  const result=await response.json();setWorking(false);
  if(!response.ok){setMessage(result.error||"Unable to create account.");return;}
  setMessage(`Account created successfully as ${result.role}.`);event.currentTarget.reset();
 }
 return <PremiumShell schoolName="School Workspace" userLabel="Administrator" roleLabel="School Admin" nav={nav}>
  <section className="hero"><div><h1>User Management</h1><p>Create authorized accounts and assign backend-controlled roles.</p></div></section>
  <section className="premium-grid">
   <article className="premium-panel"><div className="panelhead"><h2>Create User</h2></div><form onSubmit={submit} className="form-grid">
     <div className="field"><label>First name</label><input name="first_name" required/></div><div className="field"><label>Last name</label><input name="last_name" required/></div><div className="field"><label>Email</label><input name="email" type="email" required/></div>
     <div className="field"><label>Role</label><select name="role" required style={{width:"100%",padding:"12px 14px",border:"1px solid var(--line)",borderRadius:10}}><option value="">Select authorized role</option><option value="teacher">Teacher</option><option value="parent">Parent / Guardian</option><option value="student">Student</option></select></div>
     <div style={{gridColumn:"1/-1"}}><button className="premium-button" disabled={working}>{working?"Creating...":"Create Account"}</button></div>
    </form>{message&&<p className="note">{message}</p>}</article>
   <article className="premium-panel"><div className="panelhead"><h2>Security Rules</h2></div><div className="action"><div className="aico">✓</div><div><strong>Roles are backend assigned</strong><small>Users never select roles</small></div></div><div className="action"><div className="aico">✓</div><div><strong>School-scoped access</strong><small>RLS tenant isolation</small></div></div></article>
  </section>
 </PremiumShell>
}
