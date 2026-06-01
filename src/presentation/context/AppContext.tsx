import type { SQLiteDatabase } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getScheduledCount,
  rescheduleAllNotifications,
} from '@/src/application/services/notification-scheduler';
import { buildDayStartFromTime } from '@/src/application/services/time-utils';
import {
  clearActiveDay,
  getAppConfig,
  setDayStart,
} from '@/src/data/repositories/app-config-repository';
import {
  getAllHabitToggles,
  updateHabitToggle,
} from '@/src/data/repositories/habit-toggle-repository';
import {
  createTimeBlock,
  deleteTimeBlock,
  getAllTimeBlocks,
  getNextSortOrder,
  updateTimeBlock,
} from '@/src/data/repositories/time-block-repository';
import type { AppConfig } from '@/src/domain/types/app-config';
import type { HabitToggle, HabitToggleUpdate } from '@/src/domain/types/habit-toggle';
import type { TimeBlock, TimeBlockInput } from '@/src/domain/types/time-block';
import { initializeDatabase } from '@/src/infrastructure/database/connection';
import { resetToFactoryDefaults } from '@/src/infrastructure/database/seed';
import {
  configureNotificationHandler,
  ensureNotificationPermissions,
} from '@/src/infrastructure/notifications/notification-permissions';

type AppContextValue = {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  appConfig: AppConfig | null;
  timeBlocks: TimeBlock[];
  habitToggles: HabitToggle[];
  scheduledNotificationCount: number;
  startDay: (hours: number, minutes: number) => Promise<void>;
  endDay: () => Promise<void>;
  refreshFromDatabase: () => Promise<void>;
  updateBlock: (id: number, input: TimeBlockInput) => Promise<void>;
  createBlock: (input: TimeBlockInput) => Promise<void>;
  deleteBlock: (id: number) => Promise<void>;
  updateToggle: (id: string, update: HabitToggleUpdate) => Promise<void>;
  resetFactoryDefaults: () => Promise<void>;
  syncNotifications: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [habitToggles, setHabitToggles] = useState<HabitToggle[]>([]);
  const [scheduledNotificationCount, setScheduledNotificationCount] = useState(0);

  const loadState = useCallback(async (database: SQLiteDatabase) => {
    const [config, blocks, toggles] = await Promise.all([
      getAppConfig(database),
      getAllTimeBlocks(database),
      getAllHabitToggles(database),
    ]);
    setAppConfig(config);
    setTimeBlocks(blocks);
    setHabitToggles(toggles);
  }, []);

  const syncNotifications = useCallback(async () => {
    if (!db) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const granted = await ensureNotificationPermissions();
      if (!granted) {
        setError('Permisos de notificación denegados');
        return;
      }
      await rescheduleAllNotifications(db);
      const count = await getScheduledCount();
      setScheduledNotificationCount(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reprogramar alertas';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      configureNotificationHandler();
      try {
        const database = await initializeDatabase();
        if (!mounted) {
          return;
        }
        setDb(database);
        await loadState(database);
        setIsReady(true);
      } catch (err) {
        if (!mounted) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Error al inicializar la base de datos';
        setError(message);
      }
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [loadState]);

  const refreshFromDatabase = useCallback(async () => {
    if (!db) {
      return;
    }
    await loadState(db);
  }, [db, loadState]);

  const startDay = useCallback(
    async (hours: number, minutes: number) => {
      if (!db) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const dayStart = buildDayStartFromTime(hours, minutes);
        await setDayStart(db, dayStart.toISOString());
        await loadState(db);
        await syncNotifications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo iniciar la jornada';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [db, loadState, syncNotifications],
  );

  const endDay = useCallback(async () => {
    if (!db) {
      return;
    }
    setIsLoading(true);
    try {
      await clearActiveDay(db);
      await Notifications.cancelAllScheduledNotificationsAsync();
      await loadState(db);
      setScheduledNotificationCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [db, loadState]);

  const updateBlock = useCallback(
    async (id: number, input: TimeBlockInput) => {
      if (!db) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        await updateTimeBlock(db, id, input);
        await loadState(db);
        await syncNotifications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar bloque';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [db, loadState, syncNotifications],
  );

  const createBlock = useCallback(
    async (input: TimeBlockInput) => {
      if (!db) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const sortOrder =
          input.sortOrder > 0 ? input.sortOrder : await getNextSortOrder(db);
        await createTimeBlock(db, { ...input, sortOrder });
        await loadState(db);
        await syncNotifications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear bloque';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [db, loadState, syncNotifications],
  );

  const deleteBlock = useCallback(
    async (id: number) => {
      if (!db) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        await deleteTimeBlock(db, id);
        await loadState(db);
        await syncNotifications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al eliminar bloque';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [db, loadState, syncNotifications],
  );

  const updateToggle = useCallback(
    async (id: string, update: HabitToggleUpdate) => {
      if (!db) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        await updateHabitToggle(db, id, update);
        await loadState(db);
        await syncNotifications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar interruptor';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [db, loadState, syncNotifications],
  );

  const resetFactoryDefaults = useCallback(async () => {
    if (!db) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await resetToFactoryDefaults(db);
      await Notifications.cancelAllScheduledNotificationsAsync();
      await loadState(db);
      setScheduledNotificationCount(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al restablecer';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [db, loadState]);

  const value = useMemo<AppContextValue>(
    () => ({
      isReady,
      isLoading,
      error,
      appConfig,
      timeBlocks,
      habitToggles,
      scheduledNotificationCount,
      startDay,
      endDay,
      refreshFromDatabase,
      updateBlock,
      createBlock,
      deleteBlock,
      updateToggle,
      resetFactoryDefaults,
      syncNotifications,
    }),
    [
      isReady,
      isLoading,
      error,
      appConfig,
      timeBlocks,
      habitToggles,
      scheduledNotificationCount,
      startDay,
      endDay,
      refreshFromDatabase,
      updateBlock,
      createBlock,
      deleteBlock,
      updateToggle,
      resetFactoryDefaults,
      syncNotifications,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return ctx;
}
