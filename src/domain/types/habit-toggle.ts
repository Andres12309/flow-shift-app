/** Kill switches y parámetros numéricos de alertas (frecuencias, offsets). */
export type HabitToggleCategory = 'kill_switch' | 'alert_config';

export interface HabitToggle {
  id: string;
  label: string;
  category: HabitToggleCategory;
  enabled: boolean;
  numericValue: number | null;
  description: string | null;
}

export interface HabitToggleUpdate {
  enabled?: boolean;
  numericValue?: number | null;
}
