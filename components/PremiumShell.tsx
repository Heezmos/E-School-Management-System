"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";

type NavItem = { label: string; href: string; icon: string; group?: string };

export default function PremiumShell({schoolName,schoolLocation="Freetown, Sierra Leone",userLabel,roleLabel,nav,children}:{schoolName:string;schoolLocation?:string;userLabel:string;roleLabel:string;nav:NavItem[];children:React.ReactNode}) {
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  let effectiveNav=[...nav];
  if(roleLabel.toLowerCase().includes("school admin")){
    if(!effectiveNav.some(item=>item.href==="/school-admin/calendar-timetable")) effectiveNav.push({label:"Calendar & Timetable",href:"/school-admin/calendar-timetable",icon:"◫",group:"ACADEMICS"});
    if(!effectiveNav.some(item=>item.href==="/school-admin/announcements")) effectiveNav.push({label:"Announcements",href:"/school-admin/announcements",icon:"✉",group:"COMMUNICATION"});
    if(!effectiveNav.some(item=>item.href==="/school-admin/support")) effectiveNav.push({label:"Help & Support",href:"/school-admin/support",icon:"?",group:"SUPPORT"});
  }
  async function logout(){const supabase=createClient();try{await fetch("/api/security-events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})})}catch{}await supabase.auth.signOut();location.href="/login"}
  let lastGroup="";
  return <><div className={`overlay ${open?"show":""}`} onClick={()=>setOpen(false)}/><div className="shell premium-shell"><aside className={`premium-sidebar ${open?"open":""}`}><Link href="/school-admin" className="shell-brand"><span>E</span><div><b>E-School</b><small>Digital Campus</small></div></Link><div className="school-chip"><i>{schoolName.slice(0,1).toUpperCase()}</i><div><small>SCHOOL WORKSPACE</small><b>{schoolName}</b><small>{schoolLocation}</small></div></div><div className="nav-caption">NAVIGATION</div><nav className="premium-nav">{effectiveNav.map(item=>{const group=item.group||"";const groupNode=group&&group!==lastGroup?<div className="nav-caption" key={`${group}-label`}>{group}</div>:null;lastGroup=group;const active=pathname===item.href;return <div key={item.href}>{groupNode}<Link href={item.href} className={active?"active":""} onClick={()=>setOpen(false)}><span>{item.icon}</span>{item.label}</Link></div>})}</nav><div className="sidebar-foot"><Link href="/account"><span className="mini-avatar">{roleLabel.slice(0,1).toUpperCase()}</span><div><b>{userLabel}</b><small>{roleLabel}</small></div></Link><button onClick={logout}>Sign out ↗</button></div></aside><section className="content shell-content"><header className="mobilebar"><button className="menu" onClick={()=>setOpen(true)}>☰</button><strong>E-School</strong><NotificationBell roleLabel={roleLabel}/></header><header className="shell-topbar"><div className="breadcrumb"><span>E-School</span><i>/</i><b>{schoolName}</b></div><div className="shell-tools"><div className="status-chip"><i></i> School workspace</div><NotificationBell roleLabel={roleLabel}/><Link href="/account" className="top-avatar">{roleLabel.slice(0,1).toUpperCase()}</Link></div></header><main className="main compact-main">{children}</main></section></div></>;
}
