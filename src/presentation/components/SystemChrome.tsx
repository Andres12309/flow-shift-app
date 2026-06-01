import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Alinea status bar, barra de navegación Android y fondo raíz con el tema.
 * Con edge-to-edge los insets los aporta SafeAreaView / tab bar; aquí el estilo del sistema.
 */
export function SystemChrome() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette.screenBackground);

    if (Platform.OS !== 'android') {
      return;
    }

    void NavigationBar.setButtonStyleAsync(statusBarStyle);
  }, [palette.screenBackground, statusBarStyle]);

  return (
    <StatusBar
      style={statusBarStyle}
      translucent={Platform.OS === 'android'}
      backgroundColor={Platform.OS === 'android' ? palette.screenBackground : undefined}
    />
  );
}
