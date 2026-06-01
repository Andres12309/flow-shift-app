/** Estado global de la jornada actual (fila única id=1 en app_configs). */
export interface AppConfig {
  dayStartIso: string | null;
  isDayActive: boolean;
}
