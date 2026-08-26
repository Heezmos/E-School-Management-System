"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      if (data.user.user_metadata?.must_change_password !== true) {
        router.replace("/");
        return;
      }
      setChecking(false);
    });
  }, [router, supabase]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirm_password") || "");

    if (password.length < 8) {
      setError("Your new password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      setLoading(false);
      return;
    }

    const { data: current } = await supabase.auth.getUser();
    const existingMetadata = current.user?.user_metadata || {};
    const { error } = await supabase.auth.updateUser({
      password,
      data: { ...existingMetadata, must_change_password: false, password_changed_at: new Date().toISOString() }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (checking) {
    return <main className="auth"><section className="auth-form-wrap" style={{gridColumn:"1 / -1"}}><div className="auth-card">Preparing secure account setup...</div></section></main>;
  }

  return (
    <main className="auth">
      <section className="auth-brand">
        <div style={{maxWidth:580}}>
          <div style={{fontSize:13,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase",color:"#b9c8dc",marginBottom:16}}>First login security</div>
          <h1>E-School</h1>
          <p>Your temporary password has worked. Before entering your school workspace, create a private password known only to you.</p>
          <div style={{marginTop:26,padding:18,border:"1px solid rgba(255,255,255,.16)",borderRadius:16,background:"rgba(255,255,255,.06)",lineHeight:1.6,color:"#d7e3f0"}}>
            <b style={{color:"white"}}>Why this is required</b><br/>
            The Super Admin can create the initial login credential, but E-School forces you to replace it immediately so your permanent password remains private.
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={updatePassword}>
          <div style={{width:48,height:48,borderRadius:14,display:"grid",placeItems:"center",background:"#eef4fb",fontSize:22,marginBottom:18}}>🔐</div>
          <h2>Create your new password</h2>
          <p>This password will replace the temporary credential you received.</p>

          <div className="field">
            <label>New Password</label>
            <input name="password" type="password" minLength={8} required placeholder="Minimum 8 characters" autoComplete="new-password" />
          </div>

          <div className="field">
            <label>Confirm New Password</label>
            <input name="confirm_password" type="password" minLength={8} required placeholder="Re-enter your new password" autoComplete="new-password" />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="primary full" disabled={loading}>
            {loading ? "Securing account..." : "Save password & enter E-School"}
          </button>

          <div className="note">After this step, E-School will automatically open the dashboard associated with your backend role and school assignment.</div>
        </form>
      </section>
    </main>
  );
}
