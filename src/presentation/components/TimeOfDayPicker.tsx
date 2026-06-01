import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTimeLabel, parseTimeToTodayDate } from '@/src/application/services/time-utils';

type Props = {
  label: string;
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  helper?: string;
};

/**
 * Selector de hora sin pedir minutos “desde medianoche” al usuario.
 */
export function TimeOfDayPicker({ label, hours, minutes, onChange, helper }: Props) {
  const display = formatTimeLabel(parseTimeToTodayDate(hours, minutes));

  const adjustHour = (delta: number) => {
    const next = (hours + delta + 24) % 24;
    onChange(next, minutes);
  };

  const adjustMinute = (delta: number) => {
    const total = hours * 60 + minutes + delta;
    const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
    onChange(Math.floor(normalized / 60), normalized % 60);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <Text style={styles.timeDisplay}>{display}</Text>
      <View style={styles.row}>
        <Pressable style={styles.step} onPress={() => adjustHour(-1)}>
          <Text style={styles.stepText}>−1 h</Text>
        </Pressable>
        <Pressable style={styles.step} onPress={() => adjustHour(1)}>
          <Text style={styles.stepText}>+1 h</Text>
        </Pressable>
        <Pressable style={styles.step} onPress={() => adjustMinute(-15)}>
          <Text style={styles.stepText}>−15 min</Text>
        </Pressable>
        <Pressable style={styles.step} onPress={() => adjustMinute(15)}>
          <Text style={styles.stepText}>+15 min</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  helper: { fontSize: 12, color: '#64748b', marginTop: 4 },
  timeDisplay: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563eb',
    marginVertical: 10,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  step: {
    flexGrow: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  stepText: { fontSize: 13, fontWeight: '600', color: '#334155' },
});
