"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function roleBase(roleLabel: string) {
  const normalized = roleLabel.toLowerCase();
  if (normalized.includes("super admin")) return "/super-admin";
  if (normalized.includes("teacher")) return "/teacher";
  if (normalized.includes("parent")) return "/parent";
  if (normalized.includes("student")) return "/student";
  return "/";
}

function navHref(roleLabel: string, label: string, index: number) {
  const base = roleBase(roleLabel);
  if (index === 0 || ["dashboard", "home"].includes(label.toLowerCase())) return base;
  return `${base}/${slugify(label)}`;
}

export default function DashboardShell({
  schoolName,
  roleLabel,
  title,
  subtitle,
  nav,
  children
}: {
  schoolName: string;
  roleLabel: string;
  title: string;
  subtitle: string;
  nav: string[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  async function logout() {
    const supabase = createClient();
    try {
      await fetch("/api/security-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    } catch {}
    await supabase.auth.signOut();
    location.href = "/login";
  }

  return (
    <>
      <div className={`overlay ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <div className="shell">
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <div className="brand">
            E-School
            <small>{schoolName}</small>
          </div>

          <nav className="nav">
            {nav.map((item, index) => {
              const href = navHref(roleLabel, item, index);
              const active = pathname === href;
              return (
                <Link
                  className={active ? "active" : ""}
                  href={href}
                  key={item}
                  onClick={() => setOpen(false)}
                >
                  {item}
                </Link>
              );
            })}
          </nav>

          <button className="logout" onClick={logout}>Sign out</button>
        </aside>

        <section className="content">
          <header className="mobilebar">
            <button className="menu" onClick={() => setOpen(true)}>☰ Menu</button>
            <strong>E-School</strong>
            <span>🔔</span>
          </header>

          <main className="main">
            <header className="top">
              <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
              <span className="badge">{roleLabel}</span>
            </header>
            {children}
          </main>
        </section>
      </div>
    </>
  );
}
