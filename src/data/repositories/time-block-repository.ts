import type { SQLiteDatabase } from 'expo-sqlite';

import type { TimeBlock, TimeBlockInput } from '@/src/domain/types/time-block';
import { mapTimeBlockRow } from '@/src/infrastructure/database/mappers';

export async function getAllTimeBlocks(db: SQLiteDatabase): Promise<TimeBlock[]> {
  const rows = await db.getAllAsync<Parameters<typeof mapTimeBlockRow>[0]>(
    'SELECT * FROM time_blocks ORDER BY sort_order ASC, start_offset_minutes ASC',
  );
  return rows.map(mapTimeBlockRow);
}

export async function getTimeBlockById(
  db: SQLiteDatabase,
  id: number,
): Promise<TimeBlock | null> {
  const row = await db.getFirstAsync<Parameters<typeof mapTimeBlockRow>[0]>(
    'SELECT * FROM time_blocks WHERE id = ?',
    id,
  );
  return row ? mapTimeBlockRow(row) : null;
}

export async function updateTimeBlock(
  db: SQLiteDatabase,
  id: number,
  input: TimeBlockInput,
): Promise<void> {
  await db.runAsync(
    `UPDATE time_blocks SET
      name = ?,
      mental_state_type = ?,
      start_offset_minutes = ?,
      duration_minutes = ?,
      is_active = ?,
      sort_order = ?
     WHERE id = ?`,
    input.name,
    input.mentalStateType,
    input.startOffsetMinutes,
    input.durationMinutes,
    input.isActive ? 1 : 0,
    input.sortOrder,
    id,
  );
}

export async function setTimeBlockActive(
  db: SQLiteDatabase,
  id: number,
  isActive: boolean,
): Promise<void> {
  await db.runAsync('UPDATE time_blocks SET is_active = ? WHERE id = ?', isActive ? 1 : 0, id);
}

export async function getNextSortOrder(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) AS max_order FROM time_blocks',
  );
  return (row?.max_order ?? 0) + 1;
}

export async function createTimeBlock(
  db: SQLiteDatabase,
  input: TimeBlockInput,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO time_blocks
      (name, mental_state_type, start_offset_minutes, duration_minutes, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.name,
    input.mentalStateType,
    input.startOffsetMinutes,
    input.durationMinutes,
    input.isActive ? 1 : 0,
    input.sortOrder,
  );
  return result.lastInsertRowId;
}

export async function deleteTimeBlock(db: SQLiteDatabase, id: number): Promise<void> {
  const result = await db.runAsync('DELETE FROM time_blocks WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error(`Bloque no encontrado: ${id}`);
  }
}
