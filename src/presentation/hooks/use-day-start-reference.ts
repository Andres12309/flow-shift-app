import { resolveDayStartReference } from '@/src/application/services/time-utils';
import { useApp } from '@/src/presentation/context/AppContext';

/** Hora de inicio de jornada real o 7:00 AM como vista previa al editar/listar. */
export function useDayStartReference(): Date {
  const { appConfig } = useApp();
  return resolveDayStartReference(appConfig?.dayStartIso ?? null);
}
