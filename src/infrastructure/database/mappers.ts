import type { AppConfig } from '@/src/domain/types/app-config';
import type { HabitToggle, HabitToggleCategory } from '@/src/domain/types/habit-toggle';
import { isMentalStateType } from '@/src/domain/types/mental-state';
import type { TimeBlock } from '@/src/domain/types/time-block';

type TimeBlockRow = {
  id: number;
  name: string;
  mental_state_type: string;
  start_offset_minutes: number;
  duration_minutes: number;
  is_active: number;
  sort_order: number;
};

type HabitToggleRow = {
  id: string;
  label: string;
  category: string;
  enabled: number;
  numeric_value: number | null;
  description: string | null;
};

type AppConfigRow = {
  day_start_iso: string | null;
  is_day_active: number;
};

export function mapTimeBlockRow(row: TimeBlockRow): TimeBlock {
  if (!isMentalStateType(row.mental_state_type)) {
    throw new Error(`Estado mental inválido en DB: ${row.mental_state_type}`);
  }
  return {
    id: row.id,
    name: row.name,
    mentalStateType: row.mental_state_type,
    startOffsetMinutes: row.start_offset_minutes,
    durationMinutes: row.duration_minutes,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
  };
}

function isHabitCategory(value: string): value is HabitToggleCategory {
  return value === 'kill_switch' || value === 'alert_config';
}

export function mapHabitToggleRow(row: HabitToggleRow): HabitToggle {
  if (!isHabitCategory(row.category)) {
    throw new Error(`Categoría de toggle inválida: ${row.category}`);
  }
  return {
    id: row.id,
    label: row.label,
    category: row.category,
    enabled: row.enabled === 1,
    numericValue: row.numeric_value,
    description: row.description,
  };
}

export function mapAppConfigRow(row: AppConfigRow): AppConfig {
  return {
    dayStartIso: row.day_start_iso,
    isDayActive: row.is_day_active === 1,
  };
}
