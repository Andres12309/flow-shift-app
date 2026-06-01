/**
 * Identificadores estables de filas en habit_toggles.
 * No son valores de negocio: solo enlazan código con filas persistidas en SQLite.
 */
export const TOGGLE_KEYS = {
  // Kill switches globales
  BLOCK_NOTIFICATIONS: 'block_notifications',
  ACTIVE_BREAKS: 'active_breaks',
  LUNCH_ALERT: 'lunch_alert',
  ENGLISH_BLOCK: 'english_block',
  REST_LIMIT: 'rest_limit',
  DEEP_WORK_BLOCK_ALERTS: 'deep_work_block_alerts',

  // Parámetros numéricos (alert_config)
  ACTIVE_BREAK_INTERVAL_MINUTES: 'active_break_interval_minutes',
  LUNCH_OFFSET_MINUTES: 'lunch_offset_minutes',
  ENGLISH_EXIT_MINUTES_FROM_MIDNIGHT: 'english_exit_minutes_from_midnight',
  ENGLISH_RETURN_WINDOW_START_MINUTES: 'english_return_window_start_minutes',
  ENGLISH_RETURN_WINDOW_END_MINUTES: 'english_return_window_end_minutes',
  REST_LIMIT_MINUTES_FROM_MIDNIGHT: 'rest_limit_minutes_from_midnight',
} as const;

export type ToggleKey = (typeof TOGGLE_KEYS)[keyof typeof TOGGLE_KEYS];
