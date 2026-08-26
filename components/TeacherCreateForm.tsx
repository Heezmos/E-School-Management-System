"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm_password") || "");
    if (password !== confirm) {
      setBusy(false);
      setMessage("Temporary passwords do not match.");
      return;
    }
    const payload: any = Object.fromEntries(form.entries());
    delete payload.confirm_password;
    payload.role = "teacher";

    const response = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error || "Unable to create teacher.");
      return;
    }
    setMessage("Teacher account created successfully. The teacher must change the temporary password at first login.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <section className="premium-panel" style={{ marginTop: 18 }}>
      <div className="panelhead">
        <div>
          <h2>Add Teacher</h2>
          <p className="note">Create a teacher account directly from the Teachers module.</p>
        </div>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <label className="field"><span>First Name</span><input name="first_name" required /></label>
        <label className="field"><span>Last Name</span><input name="last_name" required /></label>
        <label className="field"><span>Email</span><input name="email" type="email" required /></label>
        <label className="field"><span>Phone</span><input name="phone" /></label>
        <label className="field"><span>Teacher Number</span><input name="teacher_number" required placeholder="TCH-001" /></label>
        <label className="field"><span>Specialization</span><input name="specialization" placeholder="Mathematics" /></label>
        <label className="field"><span>Hire Date</span><input name="hire_date" type="date" /></label>
        <label className="field"><span>Temporary Password</span><input name="password" type="password" minLength={8} required /></label>
        <label className="field"><span>Confirm Temporary Password</span><input name="confirm_password" type="password" minLength={8} required /></label>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
          <button className="premium-button" disabled={busy}>{busy ? "Creating Teacher..." : "Create Teacher"}</button>
        </div>
      </form>
      {message && <div className="system-message" style={{ marginTop: 14 }}>{message}</div>}
    </section>
  );
}
