import type { SQLiteDatabase } from 'expo-sqlite';

import type { AppConfig } from '@/src/domain/types/app-config';
import { mapAppConfigRow } from '@/src/infrastructure/database/mappers';

export async function getAppConfig(db: SQLiteDatabase): Promise<AppConfig> {
  const row = await db.getFirstAsync<{
    day_start_iso: string | null;
    is_day_active: number;
  }>('SELECT day_start_iso, is_day_active FROM app_configs WHERE id = 1');

  if (!row) {
    return { dayStartIso: null, isDayActive: false };
  }
  return mapAppConfigRow(row);
}

export async function setDayStart(
  db: SQLiteDatabase,
  dayStartIso: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE app_configs SET day_start_iso = ?, is_day_active = 1 WHERE id = 1',
    dayStartIso,
  );
}

export async function clearActiveDay(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    'UPDATE app_configs SET day_start_iso = NULL, is_day_active = 0 WHERE id = 1',
  );
}
