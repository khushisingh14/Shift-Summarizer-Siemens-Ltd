require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const { summarizeNotes } = require("./summarizer");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Generate a unique integer ID for tables that do not use AUTO_INCREMENT.
async function generateId(table, idColumn) {
  const [rows] = await db.query(`SELECT MAX(${idColumn}) as maxId FROM ${table}`);
  return (rows[0].maxId || 0) + 1;
}

app.post("/api/handover", async (req, res) => {
  const { operator_name, shift_type, section, raw_notes } = req.body;

  if (![operator_name, shift_type, section, raw_notes].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const noteId = await generateId("shift_notes", "note_id");
    await db.execute(
      "INSERT INTO shift_notes (note_id, operator_name, shift_type, section, raw_notes) VALUES (?, ?, ?, ?, ?)",
      [noteId, operator_name.trim(), shift_type.trim(), section.trim(), raw_notes.trim()]
    );

    const summary = await summarizeNotes(raw_notes.trim());
    const summaryId = await generateId("summaries", "summary_id");

    await db.execute(
      `INSERT INTO summaries
        (summary_id, note_id, pending_tasks, equipment_issues, safety_observations, material_shortages, priorities, loco_units_affected)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        summaryId,
        noteId,
        JSON.stringify(summary.pending_tasks),
        JSON.stringify(summary.equipment_issues),
        JSON.stringify(summary.safety_observations),
        JSON.stringify(summary.material_shortages),
        JSON.stringify(summary.priorities),
        JSON.stringify(summary.loco_units_affected),
      ]
    );

    return res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process handover" });
  }
});

app.get("/api/handovers", async (_req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT sn.*, s.pending_tasks, s.equipment_issues, s.safety_observations,
             s.material_shortages, s.priorities, s.loco_units_affected
      FROM shift_notes sn
      JOIN summaries s ON sn.note_id = s.note_id
      ORDER BY sn.submitted_at DESC
      LIMIT 20
    `);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch handovers" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port 3001");
});
