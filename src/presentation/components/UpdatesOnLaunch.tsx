import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import {
  applyDownloadedUpdate,
  canUseOtaUpdates,
  checkForAppUpdate,
  downloadAndApplyUpdate,
} from '@/src/application/services/updates-service';

/**
 * Complementa `checkAutomatically: ON_LOAD` en app.json:
 * - ON_LOAD: busca y descarga en segundo plano al iniciar.
 * - Este componente: avisa al usuario y pide confirmación antes de reiniciar.
 */
export function UpdatesOnLaunch() {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const hasPrompted = useRef(false);

  const confirmRestart = useCallback((onConfirm: () => void) => {
    Alert.alert(
      'Reinicio de la aplicación',
      'La app se reiniciará para aplicar la actualización. Tus datos en SQLite se conservan.',
      [
        { text: 'Más tarde', style: 'cancel' },
        { text: 'Reiniciar ahora', onPress: onConfirm },
      ],
    );
  }, []);

  const promptAvailableUpdate = useCallback(() => {
    Alert.alert(
      'Actualización disponible',
      'Hay una nueva versión de FlowShift. Se descargará y, tras confirmar, la app se reiniciará.',
      [
        { text: 'Más tarde', style: 'cancel' },
        {
          text: 'Actualizar ahora',
          onPress: () =>
            confirmRestart(() => {
              void downloadAndApplyUpdate();
            }),
        },
      ],
    );
  }, [confirmRestart]);

  const promptPendingUpdate = useCallback(() => {
    Alert.alert(
      'Actualización descargada',
      'Ya se descargó una nueva versión (al iniciar la app o manualmente). ¿Reiniciar para aplicarla?',
      [
        { text: 'Más tarde', style: 'cancel' },
        {
          text: 'Reiniciar ahora',
          onPress: () =>
            confirmRestart(() => {
              void applyDownloadedUpdate();
            }),
        },
      ],
    );
  }, [confirmRestart]);

  const tryPromptUpdate = useCallback(() => {
    if (!canUseOtaUpdates() || hasPrompted.current) {
      return;
    }

    if (isUpdatePending) {
      hasPrompted.current = true;
      promptPendingUpdate();
      return;
    }

    if (isUpdateAvailable) {
      hasPrompted.current = true;
      promptAvailableUpdate();
    }
  }, [isUpdateAvailable, isUpdatePending, promptAvailableUpdate, promptPendingUpdate]);

  useEffect(() => {
    tryPromptUpdate();
  }, [tryPromptUpdate]);

  useEffect(() => {
    if (!canUseOtaUpdates() || hasPrompted.current) {
      return;
    }

    void (async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 2500);
      });

      if (hasPrompted.current) {
        return;
      }

      tryPromptUpdate();

      if (hasPrompted.current) {
        return;
      }

      const check = await checkForAppUpdate();
      if (check.status === 'available') {
        hasPrompted.current = true;
        promptAvailableUpdate();
      }
    })();
  }, [tryPromptUpdate, promptAvailableUpdate]);

  return null;
}
