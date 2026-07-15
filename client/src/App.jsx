import React from 'react'

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3001/api";
const sections = [
  "Assembly Line A",
  "Assembly Line B",
  "Maintenance Bay",
  "Wheel Shop",
  "Electrical Section",
  "Paint & Finishing",
  "Loco Testing Track",
  "Stores & Material",
  "Quality Control",
];

const cards = [
  ["🔴", "Priorities", "priorities", "priority"],
  ["⏳", "Pending Tasks", "pending_tasks", "pending"],
  ["🔧", "Equipment Issues", "equipment_issues", "equipment"],
  ["⚠️", "Safety Observations", "safety_observations", "safety"],
  ["📦", "Material Shortages", "material_shortages", "materials"],
  ["🚂", "Locos Affected", "loco_units_affected", "locos"],
];

function SummaryCard({ summary }) {
  return (
    <div className="summary-grid">
      {cards.map(([emoji, label, key, className]) => {
        const items = Array.isArray(summary?.[key]) ? summary[key] : [];
        const nonEmptyItems = items.filter((item) => item.trim() !== "");
        return (
          <section className={`summary-card ${className}`} key={key}>
            <h3>{emoji} {label}</h3>
            {nonEmptyItems.length ? (
              <ul>{nonEmptyItems.map((item, index) => <li key={`${key}-${index}`}>{item}</li>)}</ul>
            ) : (
              <p className="none">None reported</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function parseSummaryField(value) {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
}

function historySummary(handover) {
  return {
    pending_tasks: parseSummaryField(handover.pending_tasks),
    equipment_issues: parseSummaryField(handover.equipment_issues),
    safety_observations: parseSummaryField(handover.safety_observations),
    material_shortages: parseSummaryField(handover.material_shortages),
    priorities: parseSummaryField(handover.priorities),
    loco_units_affected: parseSummaryField(handover.loco_units_affected),
  };
}

export default function App() {
  const [tab, setTab] = useState("submit");
  const [form, setForm] = useState({
    operator_name: "",
    shift_type: "morning",
    section: "Assembly Line A",
    raw_notes: "",
  });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tab !== "history") return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_URL}/handovers`);
        setHistory(response.data);
      } catch {
        setError("Failed to load handover history. Check that the server is running.");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [tab]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.operator_name.trim() || !form.raw_notes.trim()) {
      setError("Operator name and shift notes are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary(null);
    try {
      const response = await axios.post(`${API_URL}/handover`, form);
      setSummary(response.data.summary);
    } catch {
      setError("Failed to generate summary. Check your API key and server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <style>{styles}</style>
      <header>
        <p className="eyebrow">SIEMENS DAHOD LTD.</p>
        <h1>Shift Handover Summarizer</h1>
        <p className="subtitle">Siemens Dahod Ltd. — Locomotive Division</p>
        <nav aria-label="Main navigation">
          <button className={tab === "submit" ? "active" : ""} onClick={() => setTab("submit")}>Submit Handover</button>
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>View History</button>
        </nav>
      </header>

      {tab === "submit" ? (
        <section className="panel" aria-labelledby="submit-title">
          <h2 id="submit-title">End-of-shift handover</h2>
          <p className="intro">Capture what the incoming team needs to know. The summary is generated from only the details you provide.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Operator Name
                <input name="operator_name" value={form.operator_name} onChange={updateForm} placeholder="Your name" />
              </label>
              <label>Shift
                <select name="shift_type" value={form.shift_type} onChange={updateForm}>
                  <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="night">Night</option>
                </select>
              </label>
              <label>Section
                <select name="section" value={form.section} onChange={updateForm}>
                  {sections.map((section) => <option key={section}>{section}</option>)}
                </select>
              </label>
            </div>
            <label className="notes-label">Shift Notes
              <textarea name="raw_notes" rows="8" value={form.raw_notes} onChange={updateForm} placeholder="Write your shift handover notes here..." />
            </label>
            <button className="submit-button" type="submit" disabled={loading}>{loading ? "Generating summary..." : "Submit & Summarize"}</button>
            {error && <p className="error" role="alert">{error}</p>}
          </form>
          {summary && <div className="result"><h2>AI handover summary</h2><SummaryCard summary={summary} /></div>}
        </section>
      ) : (
        <section className="history-section" aria-labelledby="history-title">
          <div className="history-heading"><div><h2 id="history-title">Recent handovers</h2><p>Last 20 processed handovers, newest first.</p></div></div>
          {error && <p className="error" role="alert">{error}</p>}
          {historyLoading ? <p className="muted">Loading handovers...</p> : history.length === 0 ? <p className="muted">No handovers submitted yet.</p> : (
            <div className="history-list">
              {history.map((handover) => (
                <article className="history-card" key={handover.id}>
                  <div className="history-meta">
                    <strong>{handover.operator_name} <span>·</span> {handover.section}</strong>
                    <span>{handover.shift_type} shift · {new Date(handover.submitted_at).toLocaleString()}</span>
                  </div>
                  <SummaryCard summary={historySummary(handover)} />
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; min-width: 320px; background: #f4f7fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  button, input, select, textarea { font: inherit; }
  .app-shell { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 52px 0 64px; }
  header { text-align: center; margin-bottom: 32px; }
  .eyebrow { color: #0b5ed7; font-size: .76rem; letter-spacing: .16em; font-weight: 800; margin: 0 0 9px; }
  h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.2rem); letter-spacing: -.045em; }
  .subtitle { color: #64748b; margin: 9px 0 22px; }
  nav { display: inline-flex; background: #e8edf4; border-radius: 10px; padding: 4px; gap: 3px; }
  nav button { border: 0; background: transparent; padding: 10px 16px; border-radius: 7px; color: #334155; font-weight: 700; cursor: pointer; }
  nav button.active { background: #0b5ed7; color: white; box-shadow: 0 2px 5px #0b5ed740; }
  .panel, .history-card { background: #fff; border: 1px solid #e5eaf2; border-radius: 16px; box-shadow: 0 10px 30px #21345b0a; }
  .panel { padding: clamp(22px, 4vw, 38px); }
  h2 { margin: 0; font-size: 1.3rem; letter-spacing: -.02em; }
  .intro, .history-heading p { color: #64748b; margin: 8px 0 26px; }
  .form-row { display: grid; grid-template-columns: 1fr .8fr 1.25fr; gap: 16px; }
  label { color: #334155; display: grid; gap: 7px; font-size: .88rem; font-weight: 750; }
  input, select, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background: white; color: #172033; padding: 11px 12px; outline: none; }
  textarea { resize: vertical; line-height: 1.55; }
  input:focus, select:focus, textarea:focus { border-color: #0b5ed7; box-shadow: 0 0 0 3px #0b5ed71c; }
  .notes-label { margin-top: 19px; }
  .submit-button { margin-top: 18px; border: 0; border-radius: 8px; padding: 12px 18px; background: #0b5ed7; color: #fff; font-weight: 800; cursor: pointer; }
  .submit-button:disabled { background: #94a3b8; cursor: wait; }
  .error { color: #c1262d; margin: 14px 0 0; font-weight: 600; }
  .result { margin-top: 34px; padding-top: 28px; border-top: 1px solid #e5eaf2; }
  .result h2 { margin-bottom: 16px; }
  .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
  .summary-card { border: 1px solid; border-radius: 10px; padding: 15px 16px; min-height: 115px; }
  .summary-card h3 { font-size: .94rem; margin: 0 0 10px; }
  .summary-card ul { margin: 0; padding-left: 19px; color: #344054; font-size: .9rem; line-height: 1.5; }
  .summary-card li + li { margin-top: 5px; }
  .none { color: #7b8494; font-size: .9rem; font-style: italic; margin: 0; }
  .priority { background: #fff3f3; border-color: #ff4d4d; }.pending { background: #fffbf0; border-color: #ffa500; }.equipment { background: #f0f4ff; border-color: #4d79ff; }.safety { background: #fff8f0; border-color: #ff8c00; }.materials { background: #f5f0ff; border-color: #8b5cf6; }.locos { background: #f0fff4; border-color: #22c55e; }
  .history-section { display: grid; gap: 18px; }.history-heading { padding: 0 3px; }.history-heading p { margin-bottom: 0; }.history-list { display: grid; gap: 17px; }.history-card { padding: 22px; }.history-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; border-bottom: 1px solid #e5eaf2; padding-bottom: 15px; margin-bottom: 15px; }.history-meta strong { font-size: 1rem; }.history-meta strong span, .history-meta > span { color: #64748b; font-size: .87rem; font-weight: 500; text-transform: capitalize; }.muted { color: #7b8494; }
  @media (max-width: 700px) { .app-shell { width: min(100% - 24px, 1120px); padding-top: 30px; }.form-row, .summary-grid { grid-template-columns: 1fr; }.history-meta { display: grid; }.history-card { padding: 17px; } }
`;
