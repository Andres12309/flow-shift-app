import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MENTAL_STATE_LABELS } from '@/src/domain/types/mental-state';
import type { TimeBlock } from '@/src/domain/types/time-block';
import { LoadingOverlay } from '@/src/presentation/components/LoadingOverlay';
import {
  TimeBlockEditorModal,
  type TimeBlockEditorMode,
} from '@/src/presentation/components/TimeBlockEditorModal';
import { useApp } from '@/src/presentation/context/AppContext';

type EditorState =
  | { open: false }
  | { open: true; mode: TimeBlockEditorMode; block: TimeBlock | null };

/**
 * CRUD completo de time_blocks: crear, editar, eliminar → AppContext → SQLite + notificaciones.
 */
export default function BlocksScreen() {
  const {
    isReady,
    isLoading,
    error,
    timeBlocks,
    updateBlock,
    createBlock,
    deleteBlock,
    scheduledNotificationCount,
  } = useApp();

  const [editor, setEditor] = useState<EditorState>({ open: false });

  const openCreate = () => {
    setEditor({ open: true, mode: 'create', block: null });
  };

  const openEdit = (block: TimeBlock) => {
    setEditor({ open: true, mode: 'edit', block });
  };

  const closeEditor = () => {
    setEditor({ open: false });
  };

  const confirmDelete = (block: TimeBlock) => {
    Alert.alert(
      'Eliminar bloque',
      `¿Eliminar "${block.name}"? Se reprogramarán las alertas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void deleteBlock(block.id),
        },
      ],
    );
  };

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading} />
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Bloques de tiempo</Text>
          <Text style={styles.meta}>Alertas sincronizadas: {scheduledNotificationCount}</Text>
        </View>
        <Pressable style={styles.addButton} onPress={openCreate}>
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={timeBlocks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay bloques. Pulsa «+ Nuevo» para crear uno.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => openEdit(item)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardLine}>{MENTAL_STATE_LABELS[item.mentalStateType]}</Text>
              <Text style={styles.cardLine}>
                Inicio +{item.startOffsetMinutes} min · Duración {item.durationMinutes} min
              </Text>
              <Text style={styles.cardLine}>
                {item.isActive ? 'Activo' : 'Desactivado'}
              </Text>
              <Text style={styles.editHint}>Tocar para editar</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
              <Text style={styles.deleteBtnText}>Eliminar</Text>
            </Pressable>
          </View>
        )}
      />

      {editor.open ? (
        <TimeBlockEditorModal
          visible
          mode={editor.mode}
          block={editor.block}
          onClose={closeEditor}
          onSaveEdit={updateBlock}
          onSaveCreate={createBlock}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerText: { flex: 1 },
  heading: { fontSize: 22, fontWeight: '700' },
  meta: { color: '#64748b', marginTop: 4 },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  error: { color: '#dc2626', paddingHorizontal: 20, marginTop: 8 },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  cardLine: { fontSize: 14, color: '#475569', marginTop: 4 },
  editHint: { fontSize: 12, color: '#2563eb', marginTop: 8 },
  deleteBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteBtnText: { color: '#b91c1c', fontSize: 14, fontWeight: '600' },
});
