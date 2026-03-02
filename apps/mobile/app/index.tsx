import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function IndexScreen() {
  // const { data: session, isPending } = authClient.useSession();

  // if (isPending) {
  //   return (
  //     <View className="flex-1 items-center justify-center bg-[#f6f8f6]">
  //       <ActivityIndicator size="large" color="#13ec5b" />
  //       <Text className="text-sm text-slate-500 mt-3">Loading...</Text>
  //     </View>
  //   );
  // }

  // if (session) {
  //   return <Redirect href="/(tabs)" />;
  // }

  return <Redirect href="/auth/login" />;
}
