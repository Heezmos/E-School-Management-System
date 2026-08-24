"use client";
import { FormEvent, useState } from "react";

export default function StudentCreateForm() {
  const [message,setMessage] = useState("");
  const [working,setWorking] = useState(false);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setWorking(true); setMessage("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/school-admin/students",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(fd.entries()))});
    const json = await res.json(); setWorking(false);
    if(!res.ok){setMessage(json.error || "Unable to create student."); return;}
    setMessage("Student created successfully.");
    setTimeout(()=>location.reload(),500);
  }
  return (
    <article className="premium-panel">
      <div className="panelhead"><h2>Add Student</h2></div>
      <form onSubmit={submit} className="form-grid">
        <div className="field"><label>First name</label><input name="first_name" required /></div>
        <div className="field"><label>Last name</label><input name="last_name" required /></div>
        <div className="field"><label>Student number</label><input name="student_number" required /></div>
        <div className="field"><label>Admission number</label><input name="admission_number" /></div>
        <div className="field"><label>Date of birth</label><input name="date_of_birth" type="date" /></div>
        <div className="field"><label>Admission date</label><input name="admission_date" type="date" /></div>
        <div style={{gridColumn:"1/-1"}}><button className="premium-button" disabled={working}>{working?"Saving...":"Create Student"}</button></div>
      </form>
      {message && <p className="note">{message}</p>}
    </article>
  );
}
