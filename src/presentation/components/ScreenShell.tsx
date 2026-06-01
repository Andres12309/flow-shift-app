import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  /** Pantallas con tab bar: solo top + laterales; el bottom lo reserva la tab bar. */
  withTabBar?: boolean;
};

/**
 * Respeta status bar y márgenes laterales. El inset inferior lo gestiona la tab bar cuando `withTabBar`.
 */
export function ScreenShell({ children, style, withTabBar = true }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: palette.screenBackground }, style]}
      edges={withTabBar ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
});
