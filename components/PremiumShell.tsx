"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";

type NavItem = { label: string; href: string; icon: string; group?: string };

export default function PremiumShell({schoolName,schoolLocation="Freetown, Sierra Leone",userLabel,roleLabel,nav,children}:{schoolName:string;schoolLocation?:string;userLabel:string;roleLabel:string;nav:NavItem[];children:React.ReactNode}) {
  const [open,setOpen]=useState(false);
  let effectiveNav=[...nav];
  if(roleLabel.toLowerCase().includes("school admin")){
    if(!effectiveNav.some(item=>item.href==="/school-admin/calendar-timetable")) effectiveNav.push({label:"Calendar & Timetable",href:"/school-admin/calendar-timetable",icon:"◫",group:"ACADEMICS"});
    if(!effectiveNav.some(item=>item.href==="/school-admin/announcements")) effectiveNav.push({label:"Announcements",href:"/school-admin/announcements",icon:"✉",group:"COMMUNICATION"});
    if(!effectiveNav.some(item=>item.href==="/school-admin/support")) effectiveNav.push({label:"Help & Support",href:"/school-admin/support",icon:"?",group:"SUPPORT"});
  }
  async function logout(){const supabase=createClient();try{await fetch("/api/security-events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})})}catch{}await supabase.auth.signOut();location.href="/login"}
  let lastGroup="";
  return <><div className={`overlay ${open?"show":""}`} onClick={()=>setOpen(false)}/><div className={`app ${open?"open":""}`}><aside><div className="logo"><div className="mark">E</div><div><b>E-School</b><small>School Management</small></div></div><nav className="nav">{effectiveNav.map(item=>{const group=item.group||"";const groupNode=group&&group!==lastGroup?<div className="navlabel" key={`${group}-label`}>{group}</div>:null;lastGroup=group;return <div key={item.href}>{groupNode}<Link href={item.href} className="navlink" onClick={()=>setOpen(false)}><span className="ico">{item.icon}</span>{item.label}</Link></div>})}</nav><div className="logout"><button onClick={logout}>↪ Sign out</button></div></aside><section className="content"><header className="topbar"><div className="school"><button className="mobile" onClick={()=>setOpen(true)}>☰</button><div className="crest">🏫</div><div><b>{schoolName}</b><small>{schoolLocation}</small></div></div><div className="tools"><button className="iconbtn">⌕</button><NotificationBell roleLabel={roleLabel}/><div className="profile"><div className="avatar">{roleLabel.slice(0,2).toUpperCase()}</div><div><b>{userLabel}</b><small>{roleLabel}</small></div></div></div></header><main className="main">{children}</main></section></div></>;
}
