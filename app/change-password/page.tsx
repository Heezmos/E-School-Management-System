"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const isRecovery = new URLSearchParams(window.location.search).get("recovery") === "1";
    setRecovery(isRecovery);

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      if (!isRecovery && data.user.user_metadata?.must_change_password !== true) {
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
      data: {
        ...existingMetadata,
        must_change_password: false,
        password_changed_at: new Date().toISOString()
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    try {
      await fetch("/api/security-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: recovery ? "password_recovered" : "password_changed" })
      });
    } catch {}

    router.replace("/");
    router.refresh();
  }

  if (checking) {
    return (
      <main className="auth">
        <section className="auth-form-wrap" style={{ gridColumn: "1 / -1" }}>
          <div className="auth-card">Preparing secure account setup...</div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth">
      <section className="auth-brand">
        <div style={{ maxWidth: 580 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "#b9c8dc",
              marginBottom: 16
            }}
          >
            {recovery ? "Account recovery" : "First login security"}
          </div>
          <h1>E-School</h1>
          <p>
            {recovery
              ? "Create a new password for your E-School account."
              : "Your temporary password has worked. Before entering your school workspace, create a private password known only to you."}
          </p>
        </div>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={updatePassword}>
          <h2>{recovery ? "Set a new password" : "Create your new password"}</h2>
          <p>
            {recovery
              ? "Choose a new password you will use for future E-School sign-ins."
              : "This password will replace the temporary credential you received."}
          </p>
          <div className="field">
            <label>New Password</label>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label>Confirm New Password</label>
            <input
              name="confirm_password"
              type="password"
              minLength={8}
              required
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="primary full" disabled={loading}>
            {loading ? "Securing account..." : "Save password & enter E-School"}
          </button>
        </form>
      </section>
    </main>
  );
}
