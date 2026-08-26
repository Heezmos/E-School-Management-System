"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentCreateForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirm_password") || "");
    if (password !== confirmPassword) {
      setWorking(false);
      setMessage("Temporary passwords do not match.");
      return;
    }

    const payload: any = Object.fromEntries(form.entries());
    payload.role = "student";
    delete payload.confirm_password;

    const response = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setWorking(false);

    if (!response.ok) {
      setMessage(data.error || "Unable to create student account.");
      return;
    }

    setMessage("Student account created successfully. The student must change the temporary password at first login.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <article className="premium-panel">
      <div className="panelhead">
        <div>
          <h2>Add Student</h2>
          <p className="note">Create the student record and login account together.</p>
        </div>
      </div>
      <form onSubmit={submit} className="form-grid">
        <label className="field"><span>First name</span><input name="first_name" required /></label>
        <label className="field"><span>Last name</span><input name="last_name" required /></label>
        <label className="field"><span>Middle name</span><input name="middle_name" /></label>
        <label className="field"><span>Email / Login email</span><input name="email" type="email" required /></label>
        <label className="field"><span>Student number</span><input name="student_number" required placeholder="STD-0001" /></label>
        <label className="field"><span>Admission number</span><input name="admission_number" /></label>
        <label className="field"><span>Date of birth</span><input name="date_of_birth" type="date" /></label>
        <label className="field"><span>Gender</span><select name="gender"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
        <label className="field"><span>Admission date</span><input name="admission_date" type="date" /></label>
        <label className="field"><span>Temporary password</span><input name="password" type="password" minLength={8} required /></label>
        <label className="field"><span>Confirm temporary password</span><input name="confirm_password" type="password" minLength={8} required /></label>
        <div style={{ gridColumn: "1/-1" }}><button className="premium-button" disabled={working}>{working ? "Creating account..." : "Create Student Account"}</button></div>
      </form>
      {message && <div className="system-message" style={{ marginTop: 14 }}>{message}</div>}
    </article>
  );
}
