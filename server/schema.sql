CREATE DATABASE IF NOT EXISTS shift_handover;
USE shift_handover;

CREATE TABLE shift_notes (
  note_id INT PRIMARY KEY,
  operator_name VARCHAR(100) NOT NULL,
  shift_type ENUM('morning', 'afternoon', 'night') NOT NULL,
  section VARCHAR(100) NOT NULL,
  raw_notes TEXT NOT NULL,
  submitted_at DATETIME DEFAULT NOW()
);

CREATE TABLE summaries (
  summary_id INT PRIMARY KEY,
  note_id INT NOT NULL,
  pending_tasks JSON,
  equipment_issues JSON,
  safety_observations JSON,
  material_shortages JSON,
  priorities JSON,
  loco_units_affected JSON,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (note_id) REFERENCES shift_notes(note_id)
);
