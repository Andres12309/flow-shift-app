import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  clockToOffsetMinutes,
  formatMinutesFromMidnight,
  formatTimeLabel,
  minutesFromMidnight,
  offsetToClock,
  parseTimeToTodayDate,
  splitMinutesFromMidnight,
} from '@/src/application/services/time-utils';
import { TOGGLE_KEYS } from '@/src/domain/constants/toggle-keys';
import type { HabitToggle } from '@/src/domain/types/habit-toggle';
import { IntervalStepper } from '@/src/presentation/components/IntervalStepper';
import { LoadingOverlay } from '@/src/presentation/components/LoadingOverlay';
import { ScreenShell } from '@/src/presentation/components/ScreenShell';
import { TimeOfDayPicker } from '@/src/presentation/components/TimeOfDayPicker';
import { useApp } from '@/src/presentation/context/AppContext';
import { useDayStartReference } from '@/src/presentation/hooks/use-day-start-reference';

type AlertDraft =
  | { kind: 'interval'; minutes: number }
  | { kind: 'relative'; hours: number; minutes: number }
  | { kind: 'absolute'; hours: number; minutes: number };

function buildInitialDraft(toggle: HabitToggle, dayStart: Date): AlertDraft {
  const value = toggle.numericValue ?? 0;

  if (toggle.id === TOGGLE_KEYS.ACTIVE_BREAK_INTERVAL_MINUTES) {
    return { kind: 'interval', minutes: value || 45 };
  }

  if (toggle.id === TOGGLE_KEYS.LUNCH_OFFSET_MINUTES) {
    const clock = offsetToClock(dayStart, value);
    return { kind: 'relative', hours: clock.hours, minutes: clock.minutes };
  }

  const { hours, minutes } = splitMinutesFromMidnight(value);
  return { kind: 'absolute', hours, minutes };
}

function draftToNumericValue(draft: AlertDraft, dayStart: Date): number {
  if (draft.kind === 'interval') {
    return draft.minutes;
  }
  if (draft.kind === 'relative') {
    return clockToOffsetMinutes(dayStart, draft.hours, draft.minutes);
  }
  return minutesFromMidnight(draft.hours, draft.minutes);
}

function currentValueLabel(toggle: HabitToggle, dayStart: Date): string {
  const value = toggle.numericValue ?? 0;

  if (toggle.id === TOGGLE_KEYS.ACTIVE_BREAK_INTERVAL_MINUTES) {
    return `Cada ${value} minutos`;
  }

  if (toggle.id === TOGGLE_KEYS.LUNCH_OFFSET_MINUTES) {
    const { hours, minutes } = offsetToClock(dayStart, value);
    return formatTimeLabel(parseTimeToTodayDate(hours, minutes));
  }

  return formatMinutesFromMidnight(value);
}

export default function AlertsScreen() {
  const {
    isReady,
    isLoading,
    error,
    habitToggles,
    updateToggle,
    scheduledNotificationCount,
    appConfig,
  } = useApp();

  const dayStart = useDayStartReference();
  const alertConfigs = habitToggles.filter((t) => t.category === 'alert_config');

  const journeyHint = appConfig?.isDayActive
    ? `Las horas relativas usan tu jornada iniciada a las ${formatTimeLabel(dayStart)}`
    : 'Vista previa con jornada a las 7:00 (hasta que inicies el día)';

  const togglesSignature = alertConfigs
    .map((t) => `${t.id}:${t.numericValue ?? ''}`)
    .join('|');

  const initialDrafts = useMemo(() => {
    const map: Record<string, AlertDraft> = {};
    for (const toggle of habitToggles.filter((t) => t.category === 'alert_config')) {
      map[toggle.id] = buildInitialDraft(toggle, dayStart);
    }
    return map;
    // togglesSignature evita recalcular en cada render si los valores no cambiaron
    // eslint-disable-next-line react-hooks/exhaustive-deps -- habitToggles derivado de togglesSignature
  }, [togglesSignature, dayStart]);

  const [drafts, setDrafts] = useState<Record<string, AlertDraft>>(initialDrafts);

  useEffect(() => {
    setDrafts(initialDrafts);
  }, [initialDrafts]);

  if (!isReady) {
    return (
      <ScreenShell>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </ScreenShell>
    );
  }

  const setDraft = (id: string, draft: AlertDraft) => {
    setDrafts((prev) => ({ ...prev, [id]: draft }));
  };

  const saveDraft = async (toggle: HabitToggle) => {
    const draft = drafts[toggle.id] ?? buildInitialDraft(toggle, dayStart);
    const numericValue = draftToNumericValue(draft, dayStart);
    await updateToggle(toggle.id, { numericValue });
  };

  const renderEditor = (toggle: HabitToggle) => {
    const draft = drafts[toggle.id] ?? buildInitialDraft(toggle, dayStart);

    if (draft.kind === 'interval') {
      return (
        <IntervalStepper
          label="Frecuencia"
          minutes={draft.minutes}
          onChange={(minutes) => setDraft(toggle.id, { kind: 'interval', minutes })}
          step={5}
          min={15}
          max={120}
          helper="Solo durante bloques reactivos o de aprendizaje"
        />
      );
    }

    if (draft.kind === 'relative') {
      return (
        <TimeOfDayPicker
          label="Hora del almuerzo"
          hours={draft.hours}
          minutes={draft.minutes}
          onChange={(hours, minutes) => setDraft(toggle.id, { kind: 'relative', hours, minutes })}
          helper="Relativo al inicio de tu jornada"
        />
      );
    }

    const absoluteLabels: Record<string, string> = {
      [TOGGLE_KEYS.ENGLISH_EXIT_MINUTES_FROM_MIDNIGHT]: 'Hora de salida (inglés)',
      [TOGGLE_KEYS.ENGLISH_RETURN_WINDOW_START_MINUTES]: 'Inicio ventana de retorno',
      [TOGGLE_KEYS.ENGLISH_RETURN_WINDOW_END_MINUTES]: 'Fin ventana de retorno',
      [TOGGLE_KEYS.REST_LIMIT_MINUTES_FROM_MIDNIGHT]: 'Apagar todo (descanso)',
    };

    return (
      <TimeOfDayPicker
        label={absoluteLabels[toggle.id] ?? 'Hora'}
        hours={draft.hours}
        minutes={draft.minutes}
        onChange={(hours, minutes) => setDraft(toggle.id, { kind: 'absolute', hours, minutes })}
        helper="Hora del día (reloj)"
      />
    );
  };

  return (
    <ScreenShell>
      <LoadingOverlay visible={isLoading} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Alertas y frecuencias</Text>
        <Text style={styles.meta}>Programadas: {scheduledNotificationCount}</Text>
        <Text style={styles.journeyHint}>{journeyHint}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {alertConfigs.map((toggle) => (
          <View key={toggle.id} style={styles.card}>
            <Text style={styles.cardTitle}>{toggle.label}</Text>
            <Text style={styles.currentValue}>
              Actual: {currentValueLabel(toggle, dayStart)}
            </Text>
            {renderEditor(toggle)}
            <Pressable style={styles.button} onPress={() => void saveDraft(toggle)}>
              <Text style={styles.buttonText}>Guardar y reprogramar</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 32 },
  heading: { fontSize: 22, fontWeight: '700' },
  meta: { color: '#64748b', marginTop: 4 },
  journeyHint: { fontSize: 13, color: '#475569', marginTop: 8, marginBottom: 4 },
  error: { color: '#dc2626', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  currentValue: { fontSize: 14, color: '#2563eb', marginTop: 4, marginBottom: 4 },
  button: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
