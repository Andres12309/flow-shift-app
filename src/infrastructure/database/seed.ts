import type { SQLiteDatabase } from 'expo-sqlite';

import { TOGGLE_KEYS } from '@/src/domain/constants/toggle-keys';

/**
 * Datos de fábrica: única fuente de valores iniciales antes de que el usuario edite desde la UI.
 * Tras el primer arranque, la app lee exclusivamente desde SQLite.
 */
export async function seedDatabaseIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM time_blocks',
  );
  if (row && row.count > 0) {
    return;
  }

  await db.execAsync('DELETE FROM app_configs; DELETE FROM time_blocks; DELETE FROM habit_toggles;');

  await db.runAsync(
    'INSERT INTO app_configs (id, day_start_iso, is_day_active) VALUES (1, NULL, 0)',
  );

  const blocks: [string, string, number, number, number, number][] = [
    ['Clientes fijos (reactivo)', 'reactive', 0, 180, 1, 1],
    ['Deep Work — tareas complejas', 'deep_work', 180, 150, 1, 2],
    ['Aprendizaje Full-Stack', 'learning', 330, 120, 1, 3],
    ['Proyectos propios', 'learning', 450, 90, 1, 4],
  ];

  for (const [name, type, offset, duration, active, order] of blocks) {
    await db.runAsync(
      `INSERT INTO time_blocks
        (name, mental_state_type, start_offset_minutes, duration_minutes, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      name,
      type,
      offset,
      duration,
      active,
      order,
    );
  }

  const toggles: [string, string, string, number, number | null, string | null][] = [
    [TOGGLE_KEYS.BLOCK_NOTIFICATIONS, 'Notificaciones de inicio/fin de bloque', 'kill_switch', 1, null, 'Alertas al entrar o salir de cada bloque'],
    [TOGGLE_KEYS.ACTIVE_BREAKS, 'Pausas activas', 'kill_switch', 1, null, 'Durante bloques reactivos y de trabajo'],
    [TOGGLE_KEYS.LUNCH_ALERT, 'Hora de comida', 'kill_switch', 1, null, 'Offset relativo al inicio de jornada'],
    [TOGGLE_KEYS.ENGLISH_BLOCK, 'Bloque de inglés', 'kill_switch', 1, null, 'Salida fija y ventana de retorno'],
    [TOGGLE_KEYS.REST_LIMIT, 'Límite de descanso (11 PM)', 'kill_switch', 1, null, 'Alerta estricta para apagar'],
    [TOGGLE_KEYS.DEEP_WORK_BLOCK_ALERTS, 'Alertas en Deep Work', 'kill_switch', 0, null, 'Por defecto bloqueadas salvo comida/emergencia'],
    [TOGGLE_KEYS.ACTIVE_BREAK_INTERVAL_MINUTES, 'Intervalo pausas activas (min)', 'alert_config', 1, 45, null],
    [TOGGLE_KEYS.LUNCH_OFFSET_MINUTES, 'Offset almuerzo (min desde inicio)', 'alert_config', 1, 300, null],
    [TOGGLE_KEYS.ENGLISH_EXIT_MINUTES_FROM_MIDNIGHT, 'Salida inglés (min desde medianoche)', 'alert_config', 1, 18 * 60 + 15, null],
    [TOGGLE_KEYS.ENGLISH_RETURN_WINDOW_START_MINUTES, 'Retorno inglés — inicio ventana', 'alert_config', 1, 20 * 60 + 30, null],
    [TOGGLE_KEYS.ENGLISH_RETURN_WINDOW_END_MINUTES, 'Retorno inglés — fin ventana', 'alert_config', 1, 21 * 60 + 30, null],
    [TOGGLE_KEYS.REST_LIMIT_MINUTES_FROM_MIDNIGHT, 'Límite descanso (min desde medianoche)', 'alert_config', 1, 23 * 60, null],
  ];

  for (const [id, label, category, enabled, numericValue, description] of toggles) {
    await db.runAsync(
      `INSERT INTO habit_toggles (id, label, category, enabled, numeric_value, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      label,
      category,
      enabled,
      numericValue,
      description,
    );
  }
}

/** Restablece todas las tablas y vuelve a insertar el seed (botón de fábrica). */
export async function resetToFactoryDefaults(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DELETE FROM app_configs; DELETE FROM time_blocks; DELETE FROM habit_toggles;');
  await seedDatabaseIfEmpty(db);
}
