import type { SQLiteDatabase } from 'expo-sqlite';

import type { HabitToggle, HabitToggleUpdate } from '@/src/domain/types/habit-toggle';
import { mapHabitToggleRow } from '@/src/infrastructure/database/mappers';

export async function getAllHabitToggles(db: SQLiteDatabase): Promise<HabitToggle[]> {
  const rows = await db.getAllAsync<Parameters<typeof mapHabitToggleRow>[0]>(
    'SELECT * FROM habit_toggles ORDER BY category ASC, id ASC',
  );
  return rows.map(mapHabitToggleRow);
}

export async function getHabitToggleById(
  db: SQLiteDatabase,
  id: string,
): Promise<HabitToggle | null> {
  const row = await db.getFirstAsync<Parameters<typeof mapHabitToggleRow>[0]>(
    'SELECT * FROM habit_toggles WHERE id = ?',
    id,
  );
  return row ? mapHabitToggleRow(row) : null;
}

export async function updateHabitToggle(
  db: SQLiteDatabase,
  id: string,
  update: HabitToggleUpdate,
): Promise<void> {
  const current = await getHabitToggleById(db, id);
  if (!current) {
    throw new Error(`Toggle no encontrado: ${id}`);
  }

  const enabled = update.enabled ?? current.enabled;
  const numericValue =
    update.numericValue !== undefined ? update.numericValue : current.numericValue;

  await db.runAsync(
    'UPDATE habit_toggles SET enabled = ?, numeric_value = ? WHERE id = ?',
    enabled ? 1 : 0,
    numericValue,
    id,
  );
}

export async function getToggleNumericValue(
  db: SQLiteDatabase,
  id: string,
  fallback: number,
): Promise<number> {
  const toggle = await getHabitToggleById(db, id);
  if (!toggle || toggle.numericValue === null) {
    return fallback;
  }
  return toggle.numericValue;
}

export async function isToggleEnabled(
  db: SQLiteDatabase,
  id: string,
): Promise<boolean> {
  const toggle = await getHabitToggleById(db, id);
  return toggle?.enabled ?? false;
}
