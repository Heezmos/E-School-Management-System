"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ParentCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirm_password") || "");
    if (password !== confirmPassword) {
      setBusy(false);
      setMessage("Temporary passwords do not match.");
      return;
    }
    const payload: any = Object.fromEntries(form.entries());
    payload.role = "parent";
    delete payload.confirm_password;
    const response = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error || "Unable to create parent account.");
      return;
    }
    setMessage("Parent / Guardian account created successfully. Link the account to a child below.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <section className="premium-panel" style={{ marginTop: 18 }}>
      <div className="panelhead">
        <div>
          <h2>Add Parent / Guardian</h2>
          <p className="note">Create the guardian login account directly under this school.</p>
        </div>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <label className="field"><span>First name</span><input name="first_name" required /></label>
        <label className="field"><span>Last name</span><input name="last_name" required /></label>
        <label className="field"><span>Email / Login email</span><input name="email" type="email" required /></label>
        <label className="field"><span>Phone</span><input name="phone" /></label>
        <label className="field"><span>Occupation</span><input name="occupation" /></label>
        <label className="field"><span>Address</span><input name="address" /></label>
        <label className="field"><span>Temporary password</span><input name="password" type="password" minLength={8} required /></label>
        <label className="field"><span>Confirm temporary password</span><input name="confirm_password" type="password" minLength={8} required /></label>
        <div style={{ gridColumn: "1/-1" }}><button className="premium-button" disabled={busy}>{busy ? "Creating account..." : "Create Parent Account"}</button></div>
      </form>
      {message && <div className="system-message" style={{ marginTop: 14 }}>{message}</div>}
    </section>
  );
}
