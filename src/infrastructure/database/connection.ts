import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';
import { DATABASE_NAME } from './schema';
import { seedDatabaseIfEmpty } from './seed';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Singleton de conexión: una sola instancia evita condiciones de carrera
 * al reprogramar notificaciones desde distintas pantallas.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await runMigrations(db);
  await seedDatabaseIfEmpty(db);
  databaseInstance = db;
  return db;
}

/** Cierra la conexión (útil en tests o reset profundo). */
export async function closeDatabase(): Promise<void> {
  if (databaseInstance) {
    await databaseInstance.closeAsync();
    databaseInstance = null;
  }
}

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  return getDatabase();
}
