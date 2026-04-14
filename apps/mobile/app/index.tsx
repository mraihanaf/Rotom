import { authClient } from '@/lib/auth-client';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function IndexScreen() {
  const { data: session, isPending } = authClient.useSession();
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log('[Index] Session state:', { isPending, hasSession: !!session, isProfileComplete: session?.user?.isProfileComplete });

    if (isPending) return;
    if (hasNavigated.current) return;

    if (session) {
      hasNavigated.current = true;
      if (!session.user.isProfileComplete) {
        console.log('[Index] Navigating to complete-profile');
        router.replace('/auth/complete-profile' as import('expo-router').Href);
      } else {
        console.log('[Index] Navigating to tabs');
        router.replace('/(tabs)' as import('expo-router').Href);
      }
    } else {
      hasNavigated.current = true;
      console.log('[Index] Navigating to login');
      router.replace('/auth/login' as import('expo-router').Href);
    }
  }, [session, isPending]);

  // Always render a loading spinner — navigation happens imperatively above
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f8f6' }}>
      <ActivityIndicator size="large" color="#13ec5b" />
    </View>
  );
}
