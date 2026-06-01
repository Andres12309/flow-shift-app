/**
 * Tipos de estado mental que gobiernan el comportamiento de alertas durante un bloque.
 * Los valores string coinciden con la columna mental_state_type en SQLite.
 */
export type MentalStateType = 'reactive' | 'deep_work' | 'learning';

export const MENTAL_STATE_LABELS: Record<MentalStateType, string> = {
  reactive: 'Modo Reactivo',
  deep_work: 'Modo Deep Work',
  learning: 'Modo Aprendizaje / Proyectos',
};

export const MENTAL_STATE_OPTIONS: MentalStateType[] = [
  'reactive',
  'deep_work',
  'learning',
];

export function isMentalStateType(value: string): value is MentalStateType {
  return MENTAL_STATE_OPTIONS.includes(value as MentalStateType);
}
