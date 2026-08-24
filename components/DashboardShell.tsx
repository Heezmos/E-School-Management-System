"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  async function logout() {
    const supabase = createClient();
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
            {nav.map((item, index) => (
              <a className={index === 0 ? "active" : ""} href="#" key={item}>
                {item}
              </a>
            ))}
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
