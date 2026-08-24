"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="auth">
      <section className="auth-brand">
        <h1>E-School</h1>
        <p>
          One secure education platform connecting school administrators,
          teachers, students and parents around continuous student development.
        </p>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={signIn}>
          <h2>Welcome back</h2>
          <p>Sign in to continue to your E-School workspace.</p>

          <div className="field">
            <label>Email</label>
            <input name="email" type="email" required placeholder="you@school.edu" />
          </div>

          <div className="field">
            <label>Password</label>
            <input name="password" type="password" required placeholder="••••••••" />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="primary full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="note">
            Your role and school access are determined securely by E-School after sign-in.
          </div>
        </form>
      </section>
    </main>
  );
}
