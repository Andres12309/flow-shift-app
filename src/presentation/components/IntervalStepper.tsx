import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatIntervalLabel } from '@/src/application/services/time-utils';

type Props = {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
  step?: number;
  min?: number;
  max?: number;
  helper?: string;
};

/** Intervalo en minutos con etiqueta legible (p. ej. pausas activas). */
export function IntervalStepper({
  label,
  minutes,
  onChange,
  step = 5,
  min = 15,
  max = 120,
  helper,
}: Props) {
  const decrease = () => onChange(Math.max(min, minutes - step));
  const increase = () => onChange(Math.min(max, minutes + step));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <Text style={styles.value}>{formatIntervalLabel(minutes)}</Text>
      <View style={styles.row}>
        <Pressable style={styles.step} onPress={decrease}>
          <Text style={styles.stepText}>−{step} min</Text>
        </Pressable>
        <Pressable style={styles.step} onPress={increase}>
          <Text style={styles.stepText}>+{step} min</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  helper: { fontSize: 12, color: '#64748b', marginTop: 4 },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
    marginVertical: 10,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 8 },
  step: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  stepText: { fontSize: 14, fontWeight: '600', color: '#334155' },
});
