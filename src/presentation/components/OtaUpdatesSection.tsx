import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Updates from 'expo-updates';

import { IconSymbol } from '@/components/ui/icon-symbol';

import {
  applyDownloadedUpdate,
  canUseOtaUpdates,
  checkForAppUpdate,
  downloadAndApplyUpdate,
  getBuildInfo,
  type UpdateStatus,
} from '@/src/application/services/updates-service';

export function OtaUpdatesSection() {
  const buildInfo = useMemo(() => getBuildInfo(), []);
  const [buildInfoExpanded, setBuildInfoExpanded] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>(
    canUseOtaUpdates() ? 'idle' : 'disabled',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const otaEnabled = canUseOtaUpdates();

  const showDownloadRow =
    otaEnabled &&
    (status === 'available' || isUpdateAvailable) &&
    status !== 'ready_to_reload' &&
    !isUpdatePending;

  const showRestartRow =
    otaEnabled && (status === 'ready_to_reload' || isUpdatePending);

  const nativeBuildLabel =
    buildInfo.iosBuildNumber !== null
      ? `build ${buildInfo.iosBuildNumber}`
      : buildInfo.androidVersionCode !== null
        ? `build ${buildInfo.androidVersionCode}`
        : null;

  const buildSummary = [
    buildInfo.appVersion,
    nativeBuildLabel,
    buildInfo.channel ?? buildInfo.environmentLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const searchSubtitle = useMemo(() => {
    if (!otaEnabled) {
      return 'Solo en builds EAS (no Expo Go)';
    }
    if (busy && status === 'checking') {
      return 'Comprobando en el servidor…';
    }
    if (showRestartRow) {
      return 'Actualización descargada, pendiente de reinicio';
    }
    if (showDownloadRow) {
      return message ?? 'Hay una nueva versión disponible';
    }
    if (status === 'up_to_date') {
      return message ?? 'Estás en la última versión';
    }
    return 'Verificar si hay nuevas versiones';
  }, [
    busy,
    message,
    otaEnabled,
    showDownloadRow,
    showRestartRow,
    status,
  ]);

  const onCheck = useCallback(async () => {
    if (!otaEnabled || busy) {
      return;
    }

    setBusy(true);
    setStatus('checking');
    setMessage(null);

    const result = await checkForAppUpdate();
    setStatus(result.status);
    setMessage(result.message);
    setBusy(false);

    if (result.status === 'up_to_date') {
      Alert.alert('Sin actualizaciones', result.message);
    } else if (result.status === 'available') {
      Alert.alert('Actualización disponible', result.message);
    } else if (result.status === 'error' || result.status === 'disabled') {
      Alert.alert('Actualizaciones', result.message);
    }
  }, [busy, otaEnabled]);

  const confirmDownloadAndApply = useCallback(() => {
    Alert.alert(
      'Descargar actualización',
      'Se descargará la nueva versión y, tras confirmar, la app se reiniciará. Tus datos en SQLite no se borran.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: () => {
            void (async () => {
              setBusy(true);
              setStatus('downloading');
              const result = await downloadAndApplyUpdate();
              setStatus(result.status);
              setMessage(result.message);
              setBusy(false);
              if (result.status === 'error') {
                Alert.alert('Error', result.message);
              }
            })();
          },
        },
      ],
    );
  }, []);

  const confirmRestart = useCallback(() => {
    Alert.alert(
      'Reiniciar aplicación',
      'La app se reiniciará para aplicar la versión descargada. Tus datos en SQLite no se borran.',
      [
        { text: 'Más tarde', style: 'cancel' },
        {
          text: 'Reiniciar ahora',
          onPress: () => {
            void (async () => {
              setBusy(true);
              const result = await applyDownloadedUpdate();
              setStatus(result.status);
              setMessage(result.message);
              setBusy(false);
              if (result.status === 'error') {
                Alert.alert('Error', result.message);
              }
            })();
          },
        },
      ],
    );
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actualizaciones</Text>
      <Text style={styles.sectionHint}>
        Al abrir la app se buscan updates automáticamente. También puedes comprobarlas aquí.
      </Text>

      <View style={styles.card}>
        <Pressable
          style={[styles.row, styles.rowBorder]}
          onPress={() => void onCheck()}
          disabled={busy || !otaEnabled}
          accessibilityRole="button">
          <View style={styles.rowIconWrap}>
            {busy && status === 'checking' ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <IconSymbol name="arrow.down.circle" size={22} color="#2563eb" />
            )}
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>
              {busy && status === 'checking'
                ? 'Buscando actualizaciones…'
                : 'Buscar actualizaciones'}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={2}>
              {searchSubtitle}
            </Text>
          </View>
          {showDownloadRow && !showRestartRow ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NUEVO</Text>
            </View>
          ) : null}
          <IconSymbol name="chevron.right" size={18} color="#94a3b8" />
        </Pressable>

        {showDownloadRow ? (
          <Pressable
            style={[styles.row, styles.rowHighlight, styles.rowBorder]}
            onPress={confirmDownloadAndApply}
            disabled={busy}
            accessibilityRole="button">
            <View style={[styles.rowIconWrap, styles.rowIconGreen]}>
              {busy && status === 'downloading' ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <IconSymbol name="square.and.arrow.down" size={22} color="#059669" />
              )}
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>
                {busy && status === 'downloading'
                  ? 'Descargando…'
                  : 'Descargar actualización'}
              </Text>
              <Text style={styles.rowSubtitle}>
                Descargar e instalar ahora
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color="#94a3b8" />
          </Pressable>
        ) : null}

        {showRestartRow ? (
          <Pressable
            style={[styles.row, styles.rowHighlight]}
            onPress={confirmRestart}
            disabled={busy}
            accessibilityRole="button">
            <View style={[styles.rowIconWrap, styles.rowIconGreen]}>
              <IconSymbol name="arrow.clockwise" size={22} color="#059669" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Reiniciar para aplicar</Text>
              <Text style={styles.rowSubtitle}>
                La actualización ya está descargada
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>

      {!otaEnabled ? (
        <Text style={styles.hint}>
          En desarrollo o sin build EAS, las actualizaciones OTA no aplican. Usa{' '}
          <Text style={styles.mono}>eas build</Text> y <Text style={styles.mono}>eas update</Text>.
        </Text>
      ) : null}

      <Pressable
        style={styles.collapseHeader}
        onPress={() => setBuildInfoExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: buildInfoExpanded }}>
        <IconSymbol
          name="chevron.right"
          size={16}
          color="#64748b"
          style={{ transform: [{ rotate: buildInfoExpanded ? '90deg' : '0deg' }] }}
        />
        <View style={styles.collapseHeaderText}>
          <Text style={styles.collapseTitle}>Información del build</Text>
          {!buildInfoExpanded ? (
            <Text style={styles.collapseSummary} numberOfLines={1}>
              {buildSummary}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {buildInfoExpanded ? (
        <View style={styles.infoCard}>
          <InfoRow label="Versión" value={buildInfo.appVersion} />
          <InfoRow label="Build nativo" value={nativeBuildLabel ?? '—'} />
          <InfoRow label="Runtime" value={buildInfo.runtimeVersion ?? '—'} />
          <InfoRow label="Canal" value={buildInfo.channel ?? '—'} />
          <InfoRow label="Update ID" value={buildInfo.updateId ?? '—'} mono />
          <InfoRow
            label="Creado"
            value={
              buildInfo.updateCreatedAt
                ? new Date(buildInfo.updateCreatedAt).toLocaleString()
                : '—'
            }
          />
          <InfoRow
            label="Bundle"
            value={buildInfo.isEmbeddedLaunch ? 'Embebido en el build' : 'Descargado (OTA)'}
          />
          <InfoRow label="Entorno" value={buildInfo.environmentLabel} />
          <InfoRow label="OTA habilitado" value={buildInfo.updatesEnabled ? 'Sí' : 'No'} />
        </View>
      ) : null}
    </View>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionHint: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowHighlight: { backgroundColor: '#f0fdf4' },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconGreen: { backgroundColor: '#dcfce7' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  rowSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  hint: { fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 18 },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  collapseHeaderText: { flex: 1 },
  collapseTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  collapseSummary: { fontSize: 12, color: '#64748b', marginTop: 2 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: { fontSize: 13, color: '#64748b', flex: 1 },
  infoValue: { fontSize: 13, color: '#0f172a', flex: 1.2, textAlign: 'right' },
  mono: { fontFamily: 'monospace', fontSize: 11 },
});
