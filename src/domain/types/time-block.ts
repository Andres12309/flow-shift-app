import type { MentalStateType } from './mental-state';

/** Bloque de tiempo relativo al inicio de jornada (offset + duración en minutos). */
export interface TimeBlock {
  id: number;
  name: string;
  mentalStateType: MentalStateType;
  startOffsetMinutes: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
}

export interface TimeBlockInput {
  name: string;
  mentalStateType: MentalStateType;
  startOffsetMinutes: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
}
