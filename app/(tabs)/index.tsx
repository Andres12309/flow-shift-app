import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatTimeLabel } from '@/src/application/services/time-utils';
import { LoadingOverlay } from '@/src/presentation/components/LoadingOverlay';
import { ScreenShell } from '@/src/presentation/components/ScreenShell';
import { useApp } from '@/src/presentation/context/AppContext';

/**
 * Pantalla principal: selección de hora de inicio y disparo del programador diario.
 * No contiene offsets ni nombres de bloques — todo proviene de SQLite tras "Iniciar Jornada".
 */
export default function HomeScreen() {
  const {
    isReady,
    isLoading,
    error,
    appConfig,
    scheduledNotificationCount,
    startDay,
    endDay,
  } = useApp();

  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedMinute, setSelectedMinute] = useState(0);

  if (!isReady) {
    return (
      <ScreenShell>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Inicializando FlowShift…</Text>
        </View>
      </ScreenShell>
    );
  }

  const quickPresets: { label: string; hour: number; minute: number }[] = [
    { label: '7:00 AM', hour: 7, minute: 0 },
    { label: '8:00 AM', hour: 8, minute: 0 },
  ];

  const dayStartPreview = appConfig?.dayStartIso
    ? formatTimeLabel(new Date(appConfig.dayStartIso))
    : null;

  return (
    <ScreenShell>
      <LoadingOverlay visible={isLoading} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>FlowShift</Text>
        <Text style={styles.subtitle}>
          Gestión de estados mentales con tiempos relativos al inicio de tu jornada
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {appConfig?.isDayActive ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Jornada activa</Text>
            <Text style={styles.cardBody}>
              Inicio registrado: {dayStartPreview ?? '—'}
            </Text>
            <Text style={styles.cardBody}>
              Alertas programadas: {scheduledNotificationCount}
            </Text>
            <Pressable style={[styles.button, styles.secondary]} onPress={() => void endDay()}>
              <Text style={styles.secondaryText}>Finalizar jornada</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Inicio de jornada</Text>
            <Text style={styles.cardHint}>Atajos rápidos</Text>
            <View style={styles.presetRow}>
              {quickPresets.map((preset) => (
                <Pressable
                  key={preset.label}
                  style={[
                    styles.preset,
                    selectedHour === preset.hour &&
                      selectedMinute === preset.minute &&
                      styles.presetActive,
                  ]}
                  onPress={() => {
                    setSelectedHour(preset.hour);
                    setSelectedMinute(preset.minute);
                  }}>
                  <Text>{preset.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.cardHint}>
              Hora seleccionada: {selectedHour.toString().padStart(2, '0')}:
              {selectedMinute.toString().padStart(2, '0')}
            </Text>

            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepper}
                onPress={() => setSelectedHour((h) => (h <= 0 ? 23 : h - 1))}>
                <Text>− Hora</Text>
              </Pressable>
              <Pressable
                style={styles.stepper}
                onPress={() => setSelectedHour((h) => (h >= 23 ? 0 : h + 1))}>
                <Text>+ Hora</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.button, styles.primary]}
              onPress={() => void startDay(selectedHour, selectedMinute)}>
              <Text style={styles.primaryText}>Iniciar Jornada</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  heading: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 8, marginBottom: 20 },
  muted: { color: '#94a3b8' },
  error: { color: '#dc2626', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardBody: { fontSize: 15, color: '#334155', marginBottom: 4 },
  cardHint: { fontSize: 13, color: '#64748b', marginTop: 8 },
  presetRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  preset: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  presetActive: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#2563eb' },
  stepperRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stepper: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  button: { marginTop: 16, padding: 16, borderRadius: 10, alignItems: 'center' },
  primary: { backgroundColor: '#2563eb' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { backgroundColor: '#fee2e2' },
  secondaryText: { color: '#b91c1c', fontWeight: '600' },
});
