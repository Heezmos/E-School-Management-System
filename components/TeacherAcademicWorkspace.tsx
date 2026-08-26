"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  assignments: any[];
  categories: any[];
  terms: any[];
  assessments: any[];
  students: any[];
  scores: any[];
};

export default function TeacherAcademicWorkspace({
  assignments,
  categories,
  terms,
  assessments,
  students,
  scores,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(assessments[0]?.id || "");
  const [busy, setBusy] = useState(false);

  const active = assessments.find((a) => a.id === selected);
  const classStudents = active
    ? students.filter(
        (s) =>
          s.class_id === active.class_id &&
          s.academic_year_id === active.academic_year_id,
      )
    : [];
  const scoreMap = new Map(
    scores
      .filter((x) => x.assessment_id === selected)
      .map((x) => [x.student_id, x]),
  );

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/teacher/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      alert(result.error || "Unable to create assessment");
      return;
    }
    router.refresh();
  }

  async function saveScores(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = classStudents.map((student) => ({
      student_id: student.student_id,
      raw_score: form.get(`score_${student.student_id}`),
      teacher_remark: form.get(`remark_${student.student_id}`),
    }));
    const response = await fetch("/api/teacher/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment_id: active.id, scores: payload }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      alert(result.error || "Unable to save scores");
      return;
    }
    alert("Scores saved.");
    router.refresh();
  }

  async function submitAssessment() {
    if (!active) return;
    setBusy(true);
    const response = await fetch("/api/teacher/assessments/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment_id: active.id }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      alert(result.error || "Unable to submit");
      return;
    }
    router.refresh();
  }

  return (
    <div className="premium-grid">
      <section className="premium-panel">
        <div className="panelhead">
          <div>
            <h2>Create Assessment</h2>
            <p className="note">
              Assessments are restricted to your active teaching assignments.
            </p>
          </div>
        </div>

        <form className="form-grid" onSubmit={createAssessment}>
          <label className="field">
            <span>Teaching Assignment</span>
            <select name="assignment_id" required>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.classes?.name} · {assignment.subjects?.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Term</span>
            <select name="term_id" required>
              <option value="">Select term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Assessment Category</span>
            <select name="assessment_category_id" required>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.default_weight}%)
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Title</span>
            <input name="title" required placeholder="Mid-Term Test" />
          </label>

          <label className="field">
            <span>Maximum Score</span>
            <input name="maximum_score" type="number" min="1" step="0.01" required />
          </label>

          <label className="field">
            <span>Weight %</span>
            <input
              name="weight_percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input name="assessment_date" type="date" required />
          </label>

          <label className="field">
            <span>Description</span>
            <input name="description" placeholder="Optional description" />
          </label>

          <button className="premium-button" disabled={busy}>
            Create Assessment
          </button>
        </form>
      </section>

      <section className="premium-panel">
        <div className="panelhead">
          <div>
            <h2>Score Entry</h2>
            <p className="note">
              Save marks and individual teacher remarks, then submit for School Admin approval.
            </p>
          </div>
        </div>

        <label className="field">
          <span>Assessment</span>
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Select assessment</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title} · {assessment.classes?.name} · {assessment.status}
              </option>
            ))}
          </select>
        </label>

        {active ? (
          <form onSubmit={saveScores}>
            <div className="tablewrap" style={{ marginTop: 14 }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>SCORE / {active.maximum_score}</th>
                    <th>REMARK</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((student) => {
                    const previous: any = scoreMap.get(student.student_id);
                    const locked = ["approved", "published"].includes(active.status);
                    return (
                      <tr key={student.student_id}>
                        <td>
                          <b>
                            {student.students?.first_name} {student.students?.last_name}
                          </b>
                          <br />
                          <small>{student.students?.student_number}</small>
                        </td>
                        <td>
                          <input
                            name={`score_${student.student_id}`}
                            type="number"
                            min="0"
                            max={active.maximum_score}
                            step="0.01"
                            defaultValue={previous?.raw_score ?? ""}
                            required
                            disabled={locked}
                          />
                        </td>
                        <td>
                          <input
                            name={`remark_${student.student_id}`}
                            defaultValue={previous?.teacher_remark ?? ""}
                            placeholder="Performance remark"
                            disabled={locked}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!['approved', 'published', 'submitted'].includes(active.status) && (
              <div className="row-actions" style={{ marginTop: 14 }}>
                <button className="premium-button" disabled={busy}>
                  Save Scores
                </button>
                <button
                  type="button"
                  className="mini-btn success-btn"
                  disabled={busy}
                  onClick={submitAssessment}
                >
                  Submit for Approval
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="empty" style={{ marginTop: 14 }}>
            Create or select an assessment to enter scores.
          </div>
        )}
      </section>
    </div>
  );
}
