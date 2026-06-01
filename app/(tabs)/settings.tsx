import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/src/presentation/components/LoadingOverlay';
import { OtaUpdatesSection } from '@/src/presentation/components/OtaUpdatesSection';
import { useApp } from '@/src/presentation/context/AppContext';

/** Kill switches globales + restablecer valores de fábrica. */
export default function SettingsScreen() {
  const {
    isReady,
    isLoading,
    error,
    habitToggles,
    updateToggle,
    resetFactoryDefaults,
    scheduledNotificationCount,
  } = useApp();

  const killSwitches = habitToggles.filter((t) => t.category === 'kill_switch');

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const confirmReset = () => {
    Alert.alert(
      'Restablecer valores de fábrica',
      'Se borrarán bloques y configuraciones personalizadas. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => void resetFactoryDefaults(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Kill switches</Text>
        <Text style={styles.meta}>Alertas activas: {scheduledNotificationCount}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {killSwitches.map((toggle) => (
          <View key={toggle.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>{toggle.label}</Text>
              {toggle.description ? (
                <Text style={styles.desc}>{toggle.description}</Text>
              ) : null}
            </View>
            <Switch
              value={toggle.enabled}
              onValueChange={(enabled) => void updateToggle(toggle.id, { enabled })}
            />
          </View>
        ))}

        <OtaUpdatesSection />

        <Pressable style={styles.danger} onPress={confirmReset}>
          <Text style={styles.dangerText}>Restablecer valores de fábrica</Text>
        </Pressable>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowText: { flex: 1, paddingRight: 8 },
  label: { fontSize: 15, fontWeight: '600' },
  desc: { fontSize: 12, color: '#64748b', marginTop: 4 },
  danger: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerText: { color: '#b91c1c', fontWeight: '700' },
});
