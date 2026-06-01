import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export type BuildInfo = {
  appVersion: string;
  iosBuildNumber: string | null;
  androidVersionCode: string | null;
  runtimeVersion: string | null;
  channel: string | null;
  updateId: string | null;
  updateCreatedAt: string | null;
  isEmbeddedLaunch: boolean;
  updatesEnabled: boolean;
  environmentLabel: string;
};

export type UpdateStatus =
  | 'disabled'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready_to_reload'
  | 'up_to_date'
  | 'error';

export type UpdateOperationResult =
  | { ok: true; status: UpdateStatus; message: string }
  | { ok: false; status: UpdateStatus; message: string };

/** OTA solo en builds de producción/preview con expo-updates habilitado. */
export function canUseOtaUpdates(): boolean {
  return Updates.isEnabled && !__DEV__;
}

export function getBuildInfo(): BuildInfo {
  const config = Constants.expoConfig;
  const androidVersionCode = config?.android?.versionCode;

  return {
    appVersion: config?.version ?? '—',
    iosBuildNumber: config?.ios?.buildNumber ?? null,
    androidVersionCode:
      androidVersionCode !== undefined ? String(androidVersionCode) : null,
    runtimeVersion: Updates.runtimeVersion,
    channel: Updates.channel,
    updateId: Updates.updateId,
    updateCreatedAt: Updates.createdAt?.toISOString() ?? null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    updatesEnabled: Updates.isEnabled,
    environmentLabel: __DEV__
      ? 'Desarrollo'
      : Updates.channel
        ? `Canal: ${Updates.channel}`
        : 'Producción',
  };
}

function disabledResult(message: string): UpdateOperationResult {
  return { ok: false, status: 'disabled', message };
}

export async function checkForAppUpdate(): Promise<UpdateOperationResult> {
  if (!canUseOtaUpdates()) {
    return disabledResult(
      'Las actualizaciones OTA no están disponibles en desarrollo o Expo Go. Usa un build EAS.',
    );
  }

  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      return {
        ok: true,
        status: 'available',
        message: 'Hay una actualización disponible en el servidor.',
      };
    }
    return {
      ok: true,
      status: 'up_to_date',
      message: 'Ya tienes la última versión publicada.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al buscar actualizaciones';
    return { ok: false, status: 'error', message };
  }
}

export async function downloadAppUpdate(): Promise<UpdateOperationResult> {
  if (!canUseOtaUpdates()) {
    return disabledResult('Descarga OTA no disponible en este entorno.');
  }

  try {
    const fetchResult = await Updates.fetchUpdateAsync();
    if (fetchResult.isNew) {
      return {
        ok: true,
        status: 'ready_to_reload',
        message: 'Actualización descargada. Reinicia la app para aplicarla.',
      };
    }
    return {
      ok: true,
      status: 'up_to_date',
      message: 'No había una actualización nueva que descargar.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al descargar la actualización';
    return { ok: false, status: 'error', message };
  }
}

/** Descarga el OTA pendiente y reinicia la app con el bundle nuevo. */
export async function downloadAndApplyUpdate(): Promise<UpdateOperationResult> {
  if (!canUseOtaUpdates()) {
    return disabledResult('Instalación OTA no disponible en este entorno.');
  }

  try {
    const fetchResult = await Updates.fetchUpdateAsync();
    if (!fetchResult.isNew) {
      return {
        ok: true,
        status: 'up_to_date',
        message: 'Ya estás en la última versión.',
      };
    }

    await Updates.reloadAsync();
    return {
      ok: true,
      status: 'ready_to_reload',
      message: 'Reiniciando…',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al instalar la actualización';
    return { ok: false, status: 'error', message };
  }
}

export async function applyDownloadedUpdate(): Promise<UpdateOperationResult> {
  if (!canUseOtaUpdates()) {
    return disabledResult('Reinicio OTA no disponible en este entorno.');
  }

  try {
    await Updates.reloadAsync();
    return { ok: true, status: 'ready_to_reload', message: 'Reiniciando…' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al reiniciar la aplicación';
    return { ok: false, status: 'error', message };
  }
}
