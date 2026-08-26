"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherAttendanceWorkspace({ assignments, terms, students }: { assignments: any[]; terms: any[]; students: any[] }) {
  const router = useRouter();
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const assignment = assignments.find((a) => a.id === assignmentId);
  const roster = useMemo(() => assignment ? students.filter((s) => s.class_id === assignment.class_id && s.academic_year_id === assignment.academic_year_id) : [], [assignment, students]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    const records = roster.map((s) => ({ student_id: s.student_id, status: form.get(`status_${s.student_id}`), remark: form.get(`remark_${s.student_id}`) }));
    const response = await fetch("/api/teacher/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignment_id: assignmentId, term_id: form.get("term_id"), attendance_date: form.get("attendance_date"), records }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return alert(data.error || "Unable to save attendance.");
    alert("Attendance submitted successfully."); router.refresh();
  }

  return <section className="premium-panel"><div className="panelhead"><div><h2>Record Class Attendance</h2><p className="note">Attendance can only be recorded for students in your assigned classes.</p></div></div><form onSubmit={submit}><div className="form-grid"><label className="field"><span>Class Assignment</span><select value={assignmentId} onChange={(e)=>setAssignmentId(e.target.value)} required>{assignments.map((a)=><option key={a.id} value={a.id}>{a.classes?.name} · {a.subjects?.name || "Class"}</option>)}</select></label><label className="field"><span>Term</span><select name="term_id" required><option value="">Select term</option>{terms.filter((t)=>!assignment||t.academic_year_id===assignment.academic_year_id).map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label className="field"><span>Date</span><input name="attendance_date" type="date" required /></label></div><div className="tablewrap" style={{marginTop:18}}><table className="premium-table"><thead><tr><th>STUDENT</th><th>STATUS</th><th>REMARK</th></tr></thead><tbody>{roster.length?roster.map((s)=><tr key={s.student_id}><td><b>{s.students?.first_name} {s.students?.last_name}</b><br/><small>{s.students?.student_number}</small></td><td><select name={`status_${s.student_id}`} defaultValue="present"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option></select></td><td><input name={`remark_${s.student_id}`} placeholder="Optional attendance note" /></td></tr>):<tr><td colSpan={3}>No active students in this class.</td></tr>}</tbody></table></div><div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}><button className="premium-button" disabled={busy||!roster.length}>{busy?"Submitting...":"Submit Attendance"}</button></div></form></section>;
}
