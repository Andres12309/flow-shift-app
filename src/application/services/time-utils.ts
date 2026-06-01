/**
 * Utilidades puras de tiempo: sin dependencias de React ni SQLite.
 * Facilitan pruebas unitarias del cálculo de offsets relativos.
 */

export function addMinutesToDate(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

/** Minutos desde medianoche local para una fecha absoluta del mismo día calendario que `reference`. */
export function dateFromMinutesSinceMidnight(
  reference: Date,
  minutesFromMidnight: number,
): Date {
  const result = new Date(reference);
  result.setHours(0, 0, 0, 0);
  result.setMinutes(minutesFromMidnight);
  return result;
}

export function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseTimeToTodayDate(hours: number, minutes: number): Date {
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

export function buildDayStartFromTime(hours: number, minutes: number): Date {
  return parseTimeToTodayDate(hours, minutes);
}

/** Solo programa notificaciones futuras (evita errores en plataformas nativas). */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}
