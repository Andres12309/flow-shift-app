import type { SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_SQL } from './schema';

/**
 * Versión actual del esquema. Incrementar al añadir una migración nueva.
 * Compatible con OTA: las migraciones se ejecutan al abrir la app, no en el bundle remoto solo.
 */
export const LATEST_DB_VERSION = 1;

type MigrationFn = (db: SQLiteDatabase) => Promise<void>;

const MIGRATIONS: Record<number, MigrationFn> = {
  /** v1: esquema inicial (app_configs, time_blocks, habit_toggles). */
  1: async (db) => {
    await db.execAsync(SCHEMA_SQL);
  },
};

const SCHEMA_MIGRATIONS_DDL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ max_version: number | null }>(
    'SELECT MAX(version) AS max_version FROM schema_migrations',
  );
  return row?.max_version ?? 0;
}

/**
 * Ejecuta migraciones pendientes de forma idempotente (seguro tras OTA).
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA_MIGRATIONS_DDL);

  const current = await getCurrentVersion(db);

  for (let version = current + 1; version <= LATEST_DB_VERSION; version += 1) {
    const migration = MIGRATIONS[version];
    if (!migration) {
      throw new Error(`Migración ${version} no definida en MIGRATIONS`);
    }
    await migration(db);
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', version);
  }
}
