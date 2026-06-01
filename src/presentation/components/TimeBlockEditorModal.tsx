import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  clockToOffsetMinutes,
  durationFromClockRange,
  formatBlockSchedule,
  offsetToClock,
} from '@/src/application/services/time-utils';
import {
  MENTAL_STATE_LABELS,
  MENTAL_STATE_OPTIONS,
  type MentalStateType,
} from '@/src/domain/types/mental-state';
import type { TimeBlock, TimeBlockInput } from '@/src/domain/types/time-block';
import { TimeOfDayPicker } from '@/src/presentation/components/TimeOfDayPicker';

export type TimeBlockEditorMode = 'create' | 'edit';

type Props = {
  visible: boolean;
  mode: TimeBlockEditorMode;
  block: TimeBlock | null;
  dayStart: Date;
  journeyPreviewLabel: string;
  onClose: () => void;
  onSaveEdit: (id: number, input: TimeBlockInput) => Promise<void>;
  onSaveCreate: (input: TimeBlockInput) => Promise<void>;
};

export function TimeBlockEditorModal({
  visible,
  mode,
  block,
  dayStart,
  journeyPreviewLabel,
  onClose,
  onSaveEdit,
  onSaveCreate,
}: Props) {
  const [name, setName] = useState('');
  const [mentalState, setMentalState] = useState<MentalStateType>('reactive');
  const [startHours, setStartHours] = useState(7);
  const [startMinutes, setStartMinutes] = useState(0);
  const [endHours, setEndHours] = useState(8);
  const [endMinutes, setEndMinutes] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (mode === 'edit' && block) {
      setName(block.name);
      setMentalState(block.mentalStateType);
      const start = offsetToClock(dayStart, block.startOffsetMinutes);
      const end = offsetToClock(dayStart, block.startOffsetMinutes + block.durationMinutes);
      setStartHours(start.hours);
      setStartMinutes(start.minutes);
      setEndHours(end.hours);
      setEndMinutes(end.minutes);
      setIsActive(block.isActive);
      return;
    }
    if (mode === 'create') {
      setName('');
      setMentalState('reactive');
      const defaultStart = offsetToClock(dayStart, 0);
      setStartHours(defaultStart.hours);
      setStartMinutes(defaultStart.minutes);
      setEndHours(defaultStart.hours + 1);
      setEndMinutes(defaultStart.minutes);
      setIsActive(true);
    }
  }, [visible, mode, block, dayStart]);

  const buildInput = (sortOrder: number): TimeBlockInput => {
    const startOffsetMinutes = clockToOffsetMinutes(dayStart, startHours, startMinutes);
    const durationMinutes = durationFromClockRange(
      startHours,
      startMinutes,
      endHours,
      endMinutes,
    );
    return {
      name: name.trim() || 'Nuevo bloque',
      mentalStateType: mentalState,
      startOffsetMinutes,
      durationMinutes,
      isActive,
      sortOrder,
    };
  };

  const previewSchedule = formatBlockSchedule(
    dayStart,
    clockToOffsetMinutes(dayStart, startHours, startMinutes),
    durationFromClockRange(startHours, startMinutes, endHours, endMinutes),
  );

  const handleSave = async () => {
    if (mode === 'edit' && block) {
      await onSaveEdit(block.id, buildInput(block.sortOrder));
      onClose();
      return;
    }
    if (mode === 'create') {
      await onSaveCreate(buildInput(0));
      onClose();
    }
  };

  const title = mode === 'create' ? 'Nuevo bloque' : 'Editar bloque';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.previewHint}>{journeyPreviewLabel}</Text>
          <Text style={styles.previewTime}>{previewSchedule}</Text>
          <ScrollView>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nombre del bloque"
            />

            <Text style={styles.label}>Estado mental</Text>
            {MENTAL_STATE_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={[styles.option, mentalState === option && styles.optionSelected]}
                onPress={() => setMentalState(option)}>
                <Text style={styles.optionText}>{MENTAL_STATE_LABELS[option]}</Text>
              </Pressable>
            ))}

            <TimeOfDayPicker
              label="Hora de inicio"
              hours={startHours}
              minutes={startMinutes}
              onChange={(h, m) => {
                setStartHours(h);
                setStartMinutes(m);
              }}
            />

            <TimeOfDayPicker
              label="Hora de fin"
              hours={endHours}
              minutes={endMinutes}
              onChange={(h, m) => {
                setEndHours(h);
                setEndMinutes(m);
              }}
              helper="Debe ser posterior a la hora de inicio"
            />

            <View style={styles.row}>
              <Text style={styles.label}>Bloque activo</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.save]} onPress={() => void handleSave()}>
              <Text style={styles.saveText}>Guardar y reprogramar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  previewHint: { fontSize: 12, color: '#64748b' },
  previewTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  option: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 6,
  },
  optionSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancel: { backgroundColor: '#f3f4f6' },
  save: { backgroundColor: '#2563eb' },
  saveText: { color: '#fff', fontWeight: '600' },
});
