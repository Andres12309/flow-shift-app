import type { SQLiteDatabase } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getAppConfig } from '@/src/data/repositories/app-config-repository';
import {
  getAllHabitToggles,
  getToggleNumericValue,
  isToggleEnabled,
} from '@/src/data/repositories/habit-toggle-repository';
import { getAllTimeBlocks } from '@/src/data/repositories/time-block-repository';
import { TOGGLE_KEYS } from '@/src/domain/constants/toggle-keys';
import type { MentalStateType } from '@/src/domain/types/mental-state';
import type { TimeBlock } from '@/src/domain/types/time-block';
import { ANDROID_CHANNEL_ID } from '@/src/infrastructure/notifications/notification-permissions';

import {
  addMinutesToDate,
  dateFromMinutesSinceMidnight,
  isFuture,
} from './time-utils';

type SchedulePayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Orquestador desacoplado: lee SQLite, cancela el pool anterior y reprograma.
 * Invocado tras iniciar jornada o tras cualquier guardado en CRUD de bloques/alertas.
 */
export async function rescheduleAllNotifications(db: SQLiteDatabase): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const config = await getAppConfig(db);
  if (!config.isDayActive || !config.dayStartIso) {
    return;
  }

  const dayStart = new Date(config.dayStartIso);
  const blocks = (await getAllTimeBlocks(db)).filter((b) => b.isActive);
  const toggles = await getAllHabitToggles(db);
  const toggleMap = new Map(toggles.map((t) => [t.id, t]));

  const blockNotificationsOn =
    toggleMap.get(TOGGLE_KEYS.BLOCK_NOTIFICATIONS)?.enabled ?? true;

  if (blockNotificationsOn) {
    for (const block of blocks) {
      await scheduleBlockBoundaryNotifications(dayStart, block, toggleMap);
    }
  }

  await scheduleActiveBreaks(db, dayStart, blocks, toggleMap);
  await scheduleLunch(db, dayStart, toggleMap);
  await scheduleEnglishBlock(db, dayStart, toggleMap);
  await scheduleRestLimit(db, dayStart, toggleMap);
}

async function scheduleAt(
  fireDate: Date,
  payload: SchedulePayload,
): Promise<void> {
  if (!isFuture(fireDate)) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });
}

async function scheduleBlockBoundaryNotifications(
  dayStart: Date,
  block: TimeBlock,
  toggleMap: Map<string, { enabled: boolean }>,
): Promise<void> {
  const deepWorkAlerts = toggleMap.get(TOGGLE_KEYS.DEEP_WORK_BLOCK_ALERTS)?.enabled ?? false;

  if (block.mentalStateType === 'deep_work' && !deepWorkAlerts) {
    return;
  }

  const startAt = addMinutesToDate(dayStart, block.startOffsetMinutes);
  const endAt = addMinutesToDate(
    dayStart,
    block.startOffsetMinutes + block.durationMinutes,
  );

  await scheduleAt(startAt, {
    title: `Inicio: ${block.name}`,
    body: `Entrando en ${mentalStateLabel(block.mentalStateType)}`,
    data: { type: 'block_start', blockId: String(block.id) },
  });

  await scheduleAt(endAt, {
    title: `Fin: ${block.name}`,
    body: 'Cambio de bloque programado',
    data: { type: 'block_end', blockId: String(block.id) },
  });
}

function mentalStateLabel(type: MentalStateType): string {
  switch (type) {
    case 'reactive':
      return 'Modo Reactivo';
    case 'deep_work':
      return 'Modo Deep Work';
    case 'learning':
      return 'Modo Aprendizaje';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/**
 * Pausas activas: intervalo configurable, solo en bloques reactivos
 * (y learning si pausas activas están habilitadas globalmente).
 */
async function scheduleActiveBreaks(
  db: SQLiteDatabase,
  dayStart: Date,
  blocks: TimeBlock[],
  toggleMap: Map<string, { enabled: boolean }>,
): Promise<void> {
  const enabled = toggleMap.get(TOGGLE_KEYS.ACTIVE_BREAKS)?.enabled ?? false;
  if (!enabled) {
    return;
  }

  const intervalMinutes = await getToggleNumericValue(
    db,
    TOGGLE_KEYS.ACTIVE_BREAK_INTERVAL_MINUTES,
    45,
  );

  const eligibleBlocks = blocks.filter(
    (b) => b.mentalStateType === 'reactive' || b.mentalStateType === 'learning',
  );

  for (const block of eligibleBlocks) {
    const blockStart = addMinutesToDate(dayStart, block.startOffsetMinutes);
    const blockEnd = addMinutesToDate(
      dayStart,
      block.startOffsetMinutes + block.durationMinutes,
    );

    let cursor = addMinutesToDate(blockStart, intervalMinutes);
    while (cursor < blockEnd) {
      if (block.mentalStateType === 'deep_work') {
        break;
      }

      const body =
        block.mentalStateType === 'learning'
          ? 'Pausa de estudio enfocado — estira y hidrata'
          : 'Pausa activa — despeja la mente un momento';

      await scheduleAt(cursor, {
        title: 'Pausa activa',
        body,
        data: { type: 'active_break', blockId: String(block.id) },
      });

      cursor = addMinutesToDate(cursor, intervalMinutes);
    }
  }
}

async function scheduleLunch(
  db: SQLiteDatabase,
  dayStart: Date,
  toggleMap: Map<string, { enabled: boolean }>,
): Promise<void> {
  if (!(toggleMap.get(TOGGLE_KEYS.LUNCH_ALERT)?.enabled ?? false)) {
    return;
  }

  const lunchOffset = await getToggleNumericValue(
    db,
    TOGGLE_KEYS.LUNCH_OFFSET_MINUTES,
    300,
  );
  const lunchAt = addMinutesToDate(dayStart, lunchOffset);

  await scheduleAt(lunchAt, {
    title: 'Hora de comida',
    body: 'Almuerzo según tu jornada — incluso en Deep Work',
    data: { type: 'lunch' },
  });
}

async function scheduleEnglishBlock(
  db: SQLiteDatabase,
  dayStart: Date,
  toggleMap: Map<string, { enabled: boolean }>,
): Promise<void> {
  if (!(toggleMap.get(TOGGLE_KEYS.ENGLISH_BLOCK)?.enabled ?? false)) {
    return;
  }

  const exitMinutes = await getToggleNumericValue(
    db,
    TOGGLE_KEYS.ENGLISH_EXIT_MINUTES_FROM_MIDNIGHT,
    18 * 60 + 15,
  );
  const returnStart = await getToggleNumericValue(
    db,
    TOGGLE_KEYS.ENGLISH_RETURN_WINDOW_START_MINUTES,
    20 * 60 + 30,
  );
  const returnEnd = await getToggleNumericValue(
    db,
    TOGGLE_KEYS.ENGLISH_RETURN_WINDOW_END_MINUTES,
    21 * 60 + 30,
  );

  const calendarRef = dayStart;
  const exitAt = dateFromMinutesSinceMidnight(calendarRef, exitMinutes);
  const returnStartAt = dateFromMinutesSinceMidnight(calendarRef, returnStart);
  const returnEndAt = dateFromMinutesSinceMidnight(calendarRef, returnEnd);

  await scheduleAt(exitAt, {
    title: 'Bloque de inglés — salida',
    body: 'Hora de salir a tu clase o práctica de inglés',
    data: { type: 'english_exit' },
  });

  await scheduleAt(returnStartAt, {
    title: 'Ventana de retorno — inicio',
    body: 'Puedes marcar tu llegada entre ahora y el fin de la ventana',
    data: { type: 'english_return_window_start' },
  });

  await scheduleAt(returnEndAt, {
    title: 'Ventana de retorno — cierre',
    body: 'Fin de ventana flexible para tiempo libre personal',
    data: { type: 'english_return_window_end' },
  });
}

async function scheduleRestLimit(
  db: SQLiteDatabase,
  dayStart: Date,
  toggleMap: Map<string, { enabled: boolean }>,
): Promise<void> {
  if (!(toggleMap.get(TOGGLE_KEYS.REST_LIMIT)?.enabled ?? false)) {
    return;
  }

  const restMinutes = await getToggleNumericValue(
    db,
    TOGGLE_KEYS.REST_LIMIT_MINUTES_FROM_MIDNIGHT,
    23 * 60,
  );

  const restAt = dateFromMinutesSinceMidnight(dayStart, restMinutes);

  await scheduleAt(restAt, {
    title: 'Límite de descanso',
    body: '11:00 PM — apaga la computadora. Descanso innegociable.',
    data: { type: 'rest_limit' },
  });
}

/** Comprueba si las notificaciones de bloque deben suprimirse en deep work (excepto comida). */
export async function shouldSuppressNonEssentialAlerts(
  db: SQLiteDatabase,
): Promise<boolean> {
  const deepWorkAlerts = await isToggleEnabled(db, TOGGLE_KEYS.DEEP_WORK_BLOCK_ALERTS);
  return !deepWorkAlerts;
}

export async function getScheduledCount(): Promise<number> {
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}
