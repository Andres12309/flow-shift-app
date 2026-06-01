import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOGGLE_KEYS } from '@/src/domain/constants/toggle-keys';
import { LoadingOverlay } from '@/src/presentation/components/LoadingOverlay';
import { useApp } from '@/src/presentation/context/AppContext';

/**
 * Edición de parámetros numéricos (alert_config en habit_toggles).
 * Cada guardado dispara la misma cadena de sincronización que los bloques.
 */
export default function AlertsScreen() {
  const { isReady, isLoading, error, habitToggles, updateToggle, scheduledNotificationCount } =
    useApp();

  const alertConfigs = habitToggles.filter((t) => t.category === 'alert_config');

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const getDraft = (id: string, fallback: number | null) =>
    drafts[id] ?? (fallback !== null ? String(fallback) : '');

  const saveNumeric = async (id: string) => {
    const raw = drafts[id];
    const value = Number.parseInt(raw, 10);
    if (Number.isNaN(value)) {
      return;
    }
    await updateToggle(id, { numericValue: value });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const formatHint = (id: string): string => {
    switch (id) {
      case TOGGLE_KEYS.ACTIVE_BREAK_INTERVAL_MINUTES:
        return 'Minutos entre pausas activas durante bloques elegibles';
      case TOGGLE_KEYS.LUNCH_OFFSET_MINUTES:
        return 'Minutos desde el inicio de jornada hasta la comida';
      case TOGGLE_KEYS.ENGLISH_EXIT_MINUTES_FROM_MIDNIGHT:
        return 'Minutos desde medianoche (ej. 1095 = 6:15 PM)';
      case TOGGLE_KEYS.ENGLISH_RETURN_WINDOW_START_MINUTES:
        return 'Inicio ventana de retorno flexible';
      case TOGGLE_KEYS.ENGLISH_RETURN_WINDOW_END_MINUTES:
        return 'Fin ventana de retorno (8:30–9:30 PM por defecto en seed)';
      case TOGGLE_KEYS.REST_LIMIT_MINUTES_FROM_MIDNIGHT:
        return 'Límite estricto de descanso (1380 = 11:00 PM)';
      default:
        return 'Valor numérico en minutos';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Alertas y frecuencias</Text>
        <Text style={styles.meta}>Programadas: {scheduledNotificationCount}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {alertConfigs.map((toggle) => (
          <View key={toggle.id} style={styles.card}>
            <Text style={styles.cardTitle}>{toggle.label}</Text>
            <Text style={styles.hint}>{formatHint(toggle.id)}</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={getDraft(toggle.id, toggle.numericValue)}
              onChangeText={(text) =>
                setDrafts((prev) => ({ ...prev, [toggle.id]: text }))
              }
            />
            <Pressable
              style={styles.button}
              onPress={() => void saveNumeric(toggle.id)}>
              <Text style={styles.buttonText}>Guardar y reprogramar</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  heading: { fontSize: 22, fontWeight: '700' },
  meta: { color: '#64748b', marginVertical: 8 },
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
  hint: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
