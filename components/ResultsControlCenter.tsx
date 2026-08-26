"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  years: any[];
  terms: any[];
  classes: any[];
  cards: any[];
};

export default function ResultsControlCenter({ years, terms, classes, cards }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("generate");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/school-admin/results/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await response.json();
    setBusy("");
    if (!response.ok) {
      alert(data.error || "Unable to generate results");
      return;
    }
    alert(`Generated results for ${data.students} students.`);
    router.refresh();
  }

  async function act(id: string, action: string) {
    setBusy(id + action);
    const response = await fetch("/api/school-admin/results/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_card_id: id, action }),
    });
    const data = await response.json();
    setBusy("");
    if (!response.ok) {
      alert(data.error || "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <section className="premium-panel">
        <div className="panelhead">
          <div>
            <h2>Generate Term Results</h2>
            <p className="note">Compile published assessments into subject results and report cards.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={generate}>
          <label className="field">
            <span>Academic Year</span>
            <select name="academic_year_id" required>
              <option value="">Select year</option>
              {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Term</span>
            <select name="term_id" required>
              <option value="">Select term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Class</span>
            <select name="class_id" required>
              <option value="">Select class</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="field" style={{ alignSelf: "end" }}>
            <button className="premium-button" disabled={!!busy}>
              {busy === "generate" ? "Generating..." : "Generate Results"}
            </button>
          </div>
        </form>
      </section>

      <section className="premium-panel" style={{ marginTop: 18 }}>
        <div className="panelhead">
          <div>
            <h2>Report Cards</h2>
            <p className="note">Approve generated reports and publish them to students and parents.</p>
          </div>
        </div>
        <div className="tablewrap">
          <table className="premium-table">
            <thead><tr><th>STUDENT</th><th>CLASS</th><th>TERM</th><th>AVERAGE</th><th>GRADE</th><th>STATUS</th><th>ACTION</th></tr></thead>
            <tbody>
              {cards.length ? cards.map((card: any) => (
                <tr key={card.id}>
                  <td><b>{card.students?.first_name} {card.students?.last_name}</b><br/><small>{card.students?.student_number}</small></td>
                  <td>{card.classes?.name || "—"}</td>
                  <td>{card.terms?.name || "—"}</td>
                  <td>{card.overall_percentage == null ? "—" : `${Number(card.overall_percentage).toFixed(1)}%`}</td>
                  <td>{card.overall_grade || "—"}</td>
                  <td><span className={`pill ${card.status === "published" || card.status === "approved" ? "greenpill" : "amberpill"}`}>{card.status}</span></td>
                  <td>
                    {card.status === "generated" ? (
                      <button className="mini-btn success-btn" disabled={!!busy} onClick={() => act(card.id, "approve")}>Approve</button>
                    ) : card.status === "approved" ? (
                      <button className="mini-btn success-btn" disabled={!!busy} onClick={() => act(card.id, "publish")}>Publish</button>
                    ) : <span>—</span>}
                  </td>
                </tr>
              )) : <tr><td colSpan={7}>No report cards generated yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
