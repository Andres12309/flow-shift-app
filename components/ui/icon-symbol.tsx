// Android y web: SF Symbols → Material Icons (mapeo explícito).

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * Nombres usados en la app (mismo identificador que en iOS / SF Symbols).
 * Cada clave debe tener icono Material válido: https://icons.expo.fyi
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'sun.max.fill': 'wb-sunny',
  calendar: 'calendar-today',
  'bell.fill': 'notifications',
  'gearshape.fill': 'settings',
  'arrow.down.circle': 'system-update',
  'square.and.arrow.down': 'file-download',
  'arrow.clockwise': 'refresh',
} as const satisfies Record<string, ComponentProps<typeof MaterialIcons>['name']>;

export type IconSymbolName = keyof typeof MAPPING;

const FALLBACK_ICON: ComponentProps<typeof MaterialIcons>['name'] = 'help-outline';

/**
 * En iOS se usa `icon-symbol.ios.tsx` (SymbolView nativo).
 * Aquí: Material Icons para Android y web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const materialName = MAPPING[name] ?? FALLBACK_ICON;

  return (
    <MaterialIcons color={color} size={size} name={materialName} style={style} />
  );
}
