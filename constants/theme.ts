/**
 * Colores alineados con la UI de FlowShift (fondos claros, acento #2563eb).
 */

import { Platform } from 'react-native';

const accent = '#2563eb';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#ffffff',
    screenBackground: '#f8fafc',
    tint: accent,
    icon: '#64748b',
    tabIconDefault: '#64748b',
    tabIconSelected: accent,
    tabBarBackground: '#ffffff',
    tabBarBorder: '#e2e8f0',
  },
  dark: {
    text: '#f1f5f9',
    background: '#0f172a',
    screenBackground: '#020617',
    tint: '#60a5fa',
    icon: '#94a3b8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#60a5fa',
    tabBarBackground: '#0f172a',
    tabBarBorder: '#334155',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
