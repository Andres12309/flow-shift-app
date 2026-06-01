import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SystemChrome } from '@/src/presentation/components/SystemChrome';
import { UpdatesOnLaunch } from '@/src/presentation/components/UpdatesOnLaunch';
import { AppProvider } from '@/src/presentation/context/AppContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function buildNavigationTheme(scheme: 'light' | 'dark') {
  const palette = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.tint,
      background: palette.screenBackground,
      card: palette.tabBarBackground,
      text: palette.text,
      border: palette.tabBarBorder,
    },
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <SafeAreaProvider>
      <AppProvider>
        <SystemChrome />
        <UpdatesOnLaunch />
        <ThemeProvider value={buildNavigationTheme(colorScheme)}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: Colors[colorScheme].screenBackground },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </ThemeProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
