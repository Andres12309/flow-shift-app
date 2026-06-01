/**
 * Utilidades puras de tiempo: sin dependencias de React ni SQLite.
 * La UI muestra reloj (HH:mm); la DB sigue guardando minutos/offsets.
 */

export const DEFAULT_JOURNEY_START_HOUR = 7;
export const DEFAULT_JOURNEY_START_MINUTE = 0;

export function addMinutesToDate(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

export function dateFromMinutesSinceMidnight(
  reference: Date,
  minutesFromMidnight: number,
): Date {
  const result = new Date(reference);
  result.setHours(0, 0, 0, 0);
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  result.setHours(hours, mins, 0, 0);
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

export function resolveDayStartReference(dayStartIso: string | null): Date {
  if (dayStartIso) {
    return new Date(dayStartIso);
  }
  return buildDayStartFromTime(DEFAULT_JOURNEY_START_HOUR, DEFAULT_JOURNEY_START_MINUTE);
}

export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

export function minutesFromMidnight(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

export function splitMinutesFromMidnight(totalMinutes: number): {
  hours: number;
  minutes: number;
} {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    hours: Math.floor(normalized / 60),
    minutes: normalized % 60,
  };
}

/** Hora del día a partir de minutos desde medianoche (p. ej. 1095 → 18:15). */
export function formatMinutesFromMidnight(totalMinutes: number): string {
  const { hours, minutes } = splitMinutesFromMidnight(totalMinutes);
  return formatTimeLabel(parseTimeToTodayDate(hours, minutes));
}

/** Rango legible de un bloque respecto al inicio de jornada. */
export function formatBlockSchedule(
  dayStart: Date,
  startOffsetMinutes: number,
  durationMinutes: number,
): string {
  const start = addMinutesToDate(dayStart, startOffsetMinutes);
  const end = addMinutesToDate(start, durationMinutes);
  return `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`;
}

export function offsetToClock(
  dayStart: Date,
  offsetMinutes: number,
): { hours: number; minutes: number } {
  const at = addMinutesToDate(dayStart, offsetMinutes);
  return { hours: at.getHours(), minutes: at.getMinutes() };
}

/** Minutos desde el inicio de jornada hasta la hora indicada (mismo día). */
export function clockToOffsetMinutes(
  dayStart: Date,
  hours: number,
  minutes: number,
): number {
  const start = new Date(dayStart);
  start.setSeconds(0, 0);
  const target = parseTimeToTodayDate(hours, minutes);
  return Math.round((target.getTime() - start.getTime()) / (60 * 1000));
}

/** Duración entre dos horas del mismo día (fin puede ser después de inicio). */
export function durationFromClockRange(
  startHours: number,
  startMinutes: number,
  endHours: number,
  endMinutes: number,
): number {
  const start = parseTimeToTodayDate(startHours, startMinutes);
  const end = parseTimeToTodayDate(endHours, endMinutes);
  const diff = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
  return Math.max(diff, 1);
}

/** Texto amigable para intervalos (solo pausas activas). */
export function formatIntervalLabel(minutes: number): string {
  if (minutes < 60) {
    return `Cada ${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) {
    return `Cada ${h} h`;
  }
  return `Cada ${h} h ${m} min`;
}
