import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { createQueryClient } from '@/lib/query-client';
import { ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    return onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        setOnline(state.isConnected ?? true);
      });
    });
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NAV_THEME[colorScheme]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }} />
          <PortalHost />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
