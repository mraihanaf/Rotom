import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Button } from '@/components/ui/button';
import { ErrorView } from '@/components/ui/error-view';
import { Text } from '@/components/ui/text';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Badge,
  Calendar,
  Check,
  Edit,
  LogOut,
  Mail,
  Phone,
  Save,
  School,
} from 'lucide-react-native';
import * as React from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { View, Pressable, ScrollView, TextInput } from '@/tw';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SkeletonBox } from '@/components/ui/skeleton';

function ProfileSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 20, alignItems: 'center' }}>
        {/* Avatar */}
        <SkeletonBox width={96} height={96} borderRadius={48} />
        {/* Name + role */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <SkeletonBox width={160} height={22} borderRadius={8} />
          <SkeletonBox width={100} height={14} borderRadius={6} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 32, gap: 16 }}>
        {/* Info fields */}
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBox key={i} height={56} borderRadius={12} />
        ))}
        {/* Save button */}
        <SkeletonBox height={48} borderRadius={12} />
      </View>
    </SafeAreaView>
  );
}
import { orpc, uploadProfilePicture } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: profile, isPending, isError, refetch } = useQuery(orpc.profiles.getMe.queryOptions());

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const [name, setName] = React.useState('');
  const [birthday, setBirthday] = React.useState('');
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      if (profile.birthday) {
        const date = new Date(profile.birthday);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setBirthday(`${year}-${month}-${day}`);
      }
    }
  }, [profile]);

  const saveMutation = useMutation({
    ...orpc.profiles.updateProfile.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.profiles.getMe.queryOptions().queryKey });
      setDirty(false);
      Alert.alert('Success', 'Profile updated successfully.');
    },
    onError: (err) => {
      Alert.alert('Error', err.message ?? 'Failed to save profile.');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }
    saveMutation.mutate({
      name: name.trim(),
      birthday: birthday ? new Date(birthday).toISOString() : new Date().toISOString(),
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace('/auth/login' as import('expo-router').Href);
  };

  const handleChangeProfilePicture = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    try {
      await uploadProfilePicture({
        uri: asset.uri,
        type: asset.mimeType,
        fileName: asset.fileName,
      });
      queryClient.invalidateQueries({ queryKey: orpc.profiles.getMe.queryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: orpc.dashboard.getDashboardSummary.queryOptions().queryKey });
      Alert.alert('Success', 'Profile picture updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to upload profile picture.');
    }
  };

  const handleFieldChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setDirty(true);
  };


  if (isPending) {
    return <ProfileSkeleton />;
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }} edges={['top']}>
        <ErrorView onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  const displayRole = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : 'Member';

  return (
    <AnimatedTabScreen>
      <>
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }} edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
          <Pressable className="h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-foreground">My Profile</Text>
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={handleSave}
            disabled={!dirty || saveMutation.isPending}
          >
            <Check size={24} color={dirty ? '#13ec5b' : '#d1d5db'} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#13ec5b']}
              tintColor="#13ec5b"
            />
          }
        >
          <View className="px-4 pt-6">
            <View className="mb-8 items-center">
              <Pressable className="relative mb-4" onPress={handleChangeProfilePicture}>
                <Image
                  source={{ uri: profile?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name ?? '')}&size=200&background=13ec5b&color=112217` }}
                  style={{ width: 112, height: 112, borderRadius: 999 }}
                  contentFit="cover"
                  transition={200}
                />
                <View className="absolute bottom-0 right-0 items-center justify-center rounded-full border-[3px] border-[#f6f8f6] bg-primary p-2">
                  <Edit size={14} color="#000" />
                </View>
              </Pressable>
              <Text className="text-2xl font-bold tracking-tight text-foreground">{profile?.name ?? ''}</Text>
              <View className="mt-2 rounded-full border border-primary/30 bg-primary/20 px-3 py-1">
                <Text className="text-xs font-bold uppercase tracking-wider text-primary">
                  {displayRole}
                </Text>
              </View>
            </View>

            <View className="mb-8">
              <Text className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Edit Profile
              </Text>
              <View className="gap-4">
                <View>
                  <Text className="mb-2 ml-1 text-sm font-medium text-foreground">Name</Text>
                  <View className="h-14 flex-row items-center rounded-xl border border-gray-200 bg-white px-4">
                    <TextInput
                      className="flex-1 text-base text-foreground"
                      value={name}
                      onChangeText={handleFieldChange(setName)}
                      placeholder="Your name"
                      placeholderTextColor="#9ca3af"
                    />
                    <Edit size={20} color="#13ec5b" />
                  </View>
                </View>
                <View>
                  <Text className="mb-2 ml-1 text-sm font-medium text-foreground">Birthday</Text>
                  <View className="h-14 flex-row items-center rounded-xl border border-gray-200 bg-white px-4">
                    <TextInput
                      className="flex-1 text-base text-foreground"
                      value={birthday}
                      onChangeText={handleFieldChange(setBirthday)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9ca3af"
                      inputMode="tel"
                      keyboardType="numeric"
                    />
                    <Calendar size={20} color="#13ec5b" />
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-8">
              <Text className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Account Info
              </Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                      <Badge size={18} color="#3b82f6" />
                    </View>
                    <Text className="text-sm font-medium text-foreground">User ID</Text>
                  </View>
                  <Text className="font-mono text-sm font-semibold text-gray-500" numberOfLines={1}>
                    {profile?.id ? profile.id.slice(0, 8) + '...' : '—'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                      <School size={18} color="#a855f7" />
                    </View>
                    <Text className="text-sm font-medium text-foreground">Role</Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-500">{displayRole}</Text>
                </View>
                <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
                      <Phone size={18} color="#22c55e" />
                    </View>
                    <Text className="text-sm font-medium text-foreground">Phone</Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-500">{profile?.phoneNumber || '—'}</Text>
                </View>
                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                      <Mail size={18} color="#f97316" />
                    </View>
                    <Text className="text-sm font-medium text-foreground">Email</Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-500">{session?.user?.email ?? '—'}</Text>
                </View>
              </View>
            </View>

            <View className="gap-4">
              <Button
                className="h-14 w-full rounded-xl"
                onPress={handleSave}
                disabled={!dirty || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Save size={20} color="#000" />
                )}
                <Text className="font-bold text-black">
                  {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Text>
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-red-200 bg-transparent"
                onPress={handleSignOut}
              >
                <LogOut size={20} color="#ef4444" />
                <Text className="font-bold text-red-500">Sign Out</Text>
              </Button>
              <Text className="pt-4 text-center text-xs text-gray-400">Rotom App v2.4.1</Text>
            </View>
          </View>
        </ScrollView>
        </SafeAreaView>
      </>
    </AnimatedTabScreen>
  );
}
