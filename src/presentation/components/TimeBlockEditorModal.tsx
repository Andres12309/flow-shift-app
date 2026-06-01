import React, { useEffect, useState } from 'react';
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
  MENTAL_STATE_LABELS,
  MENTAL_STATE_OPTIONS,
  type MentalStateType,
} from '@/src/domain/types/mental-state';
import type { TimeBlock, TimeBlockInput } from '@/src/domain/types/time-block';

export type TimeBlockEditorMode = 'create' | 'edit';

type Props = {
  visible: boolean;
  mode: TimeBlockEditorMode;
  block: TimeBlock | null;
  onClose: () => void;
  onSaveEdit: (id: number, input: TimeBlockInput) => Promise<void>;
  onSaveCreate: (input: TimeBlockInput) => Promise<void>;
};

function buildInput(
  name: string,
  mentalState: MentalStateType,
  startOffset: string,
  duration: string,
  isActive: boolean,
  sortOrder: number,
): TimeBlockInput {
  return {
    name: name.trim() || 'Nuevo bloque',
    mentalStateType: mentalState,
    startOffsetMinutes: Number.parseInt(startOffset, 10) || 0,
    durationMinutes: Number.parseInt(duration, 10) || 30,
    isActive,
    sortOrder,
  };
}

/**
 * Modal CRUD: crear o editar bloque; el padre delega en AppContext
 * para persistir y reprogramar notificaciones.
 */
export function TimeBlockEditorModal({
  visible,
  mode,
  block,
  onClose,
  onSaveEdit,
  onSaveCreate,
}: Props) {
  const [name, setName] = useState('');
  const [mentalState, setMentalState] = useState<MentalStateType>('reactive');
  const [startOffset, setStartOffset] = useState('0');
  const [duration, setDuration] = useState('60');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (mode === 'edit' && block) {
      setName(block.name);
      setMentalState(block.mentalStateType);
      setStartOffset(String(block.startOffsetMinutes));
      setDuration(String(block.durationMinutes));
      setIsActive(block.isActive);
      return;
    }
    if (mode === 'create') {
      setName('');
      setMentalState('reactive');
      setStartOffset('0');
      setDuration('60');
      setIsActive(true);
    }
  }, [visible, mode, block]);

  const handleSave = async () => {
    if (mode === 'edit' && block) {
      const input = buildInput(
        name,
        mentalState,
        startOffset,
        duration,
        isActive,
        block.sortOrder,
      );
      await onSaveEdit(block.id, input);
      onClose();
      return;
    }

    if (mode === 'create') {
      const input = buildInput(name, mentalState, startOffset, duration, isActive, 0);
      await onSaveCreate(input);
      onClose();
    }
  };

  const title = mode === 'create' ? 'Nuevo bloque' : 'Editar bloque';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
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

            <Text style={styles.label}>Offset inicio (min desde inicio jornada)</Text>
            <TextInput
              style={styles.input}
              value={startOffset}
              onChangeText={setStartOffset}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Duración (min)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
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
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
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
