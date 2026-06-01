/**
 * DDL centralizado. Separar esquema del seed permite migraciones futuras
 * sin mezclar definición estructural con datos de fábrica.
 */
export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_configs (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_start_iso TEXT,
  is_day_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS time_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mental_state_type TEXT NOT NULL CHECK (
    mental_state_type IN ('reactive', 'deep_work', 'learning')
  ),
  start_offset_minutes INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS habit_toggles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('kill_switch', 'alert_config')),
  enabled INTEGER NOT NULL DEFAULT 1,
  numeric_value INTEGER,
  description TEXT
);
`;

export const DATABASE_NAME = 'flowshift.db';
