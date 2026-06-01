import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

import {
  applyDownloadedUpdate,
  canUseOtaUpdates,
  checkForAppUpdate,
  downloadAppUpdate,
  downloadAndApplyUpdate,
  getBuildInfo,
  type UpdateStatus,
} from '@/src/application/services/updates-service';

const STATUS_LABELS: Record<UpdateStatus, string> = {
  disabled: 'No disponible',
  idle: 'Listo',
  checking: 'Buscando…',
  available: 'Actualización disponible',
  downloading: 'Descargando…',
  ready_to_reload: 'Lista para instalar',
  up_to_date: 'Al día',
  error: 'Error',
};

export function OtaUpdatesSection() {
  const buildInfo = useMemo(() => getBuildInfo(), []);
  const [buildInfoExpanded, setBuildInfoExpanded] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>(
    canUseOtaUpdates() ? 'idle' : 'disabled',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const otaEnabled = canUseOtaUpdates();

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

  const runAction = useCallback(
    async (action: () => Promise<{ status: UpdateStatus; message: string }>) => {
      setBusy(true);
      const result = await action();
      setStatus(result.status);
      setMessage(result.message);
      setBusy(false);
    },
    [],
  );

  const onCheck = () => {
    void runAction(async () => {
      setStatus('checking');
      const result = await checkForAppUpdate();
      return { status: result.status, message: result.message };
    });
  };

  const onDownload = () => {
    void runAction(async () => {
      setStatus('downloading');
      const result = await downloadAppUpdate();
      return { status: result.status, message: result.message };
    });
  };

  const onInstall = () => {
    Alert.alert(
      'Instalar actualización',
      'La aplicación se reiniciará para aplicar la versión descargada. Tus datos en SQLite no se borran.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar ahora',
          onPress: () => {
            void runAction(async () => {
              if (status === 'ready_to_reload') {
                const result = await applyDownloadedUpdate();
                return { status: result.status, message: result.message };
              }
              setStatus('downloading');
              const result = await downloadAndApplyUpdate();
              return { status: result.status, message: result.message };
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actualizaciones (EAS)</Text>
      <Text style={styles.sectionHint}>
        Al abrir la app se buscan updates automáticamente (ON_LOAD). También puedes comprobarlas aquí.
      </Text>

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

      <Text style={styles.status}>
        Estado: {STATUS_LABELS[status]}
        {message ? ` — ${message}` : ''}
      </Text>

      {!otaEnabled ? (
        <Text style={styles.hint}>
          En desarrollo o sin build EAS, las actualizaciones OTA no aplican. Usa{' '}
          <Text style={styles.mono}>eas build</Text> y <Text style={styles.mono}>eas update</Text>.
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.secondary, busy && styles.disabled]}
          onPress={onCheck}
          disabled={busy || !otaEnabled}>
          {busy && status === 'checking' ? (
            <ActivityIndicator color="#1e40af" />
          ) : (
            <Text style={styles.secondaryText}>Buscar actualizaciones</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondary, busy && styles.disabled]}
          onPress={onDownload}
          disabled={busy || !otaEnabled || status !== 'available'}>
          <Text style={styles.secondaryText}>Descargar</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.primary, busy && styles.disabled]}
          onPress={onInstall}
          disabled={
            busy ||
            !otaEnabled ||
            (status !== 'available' && status !== 'ready_to_reload')
          }>
          <Text style={styles.primaryText}>Instalar y reiniciar</Text>
        </Pressable>
      </View>
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
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
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
  status: { fontSize: 13, color: '#475569', marginTop: 10 },
  hint: { fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 18 },
  actions: { gap: 8, marginTop: 12 },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#2563eb' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  secondaryText: { color: '#1e40af', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
