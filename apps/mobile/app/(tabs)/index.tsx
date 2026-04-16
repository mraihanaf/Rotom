import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Button } from '@/components/ui/button';
import { ErrorView } from '@/components/ui/error-view';
import { Text } from '@/components/ui/text';
import { Stack, router } from 'expo-router';
import {
  CheckCircle,
  History,
  MapPin,
  Video,
  Wallet,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl } from 'react-native';
import { View, Pressable, ScrollView } from '@/tw';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { SkeletonBox } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 8 }}>
          <SkeletonBox width={100} height={12} borderRadius={6} />
          <SkeletonBox width={200} height={28} borderRadius={8} />
        </View>
        <SkeletonBox width={48} height={48} borderRadius={24} />
      </View>
      <SkeletonBox height={130} borderRadius={16} />
      <SkeletonBox width={140} height={18} borderRadius={6} />
      {[0, 1, 2].map((i) => (
        <SkeletonBox key={i} height={72} borderRadius={12} />
      ))}
      <SkeletonBox width={100} height={18} borderRadius={6} />
      {[0, 1, 2].map((i) => (
        <SkeletonBox key={i} height={56} borderRadius={12} />
      ))}
    </View>
  );
}

function formatCurrency(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function isCurrentSlot(start: string, end: string) {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return hhmm >= start && hhmm < end;
}

export default function DashboardScreen() {
  console.log('[Dashboard] Component mounting');
  // Wrap in try-catch to catch any render errors
  try {
    const { canWrite } = useUserRole();
    console.log('[Dashboard] useUserRole succeeded');
    const { data: session } = authClient.useSession();
    console.log('[Dashboard] useSession succeeded, session:', !!session);

    const {
      data: dashboard,
      isPending,
      isError,
      refetch: refetchDashboard,
    } = useQuery(orpc.dashboard.getDashboardSummary.queryOptions());

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchDashboard();
    setRefreshing(false);
  }, [refetchDashboard]);

  const scheduleItems = dashboard?.todaySchedule ?? [];
  const pendingTasks = dashboard?.pendingAssignments ?? [];

  const userName =
    dashboard?.user?.name?.split(' ')[0] ??
    session?.user?.name?.split(' ')[0] ??
    'Student';
  const avatarUrl =
    dashboard?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(dashboard?.user?.name ?? '')}&size=100&background=13ec5b&color=112217`;

  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <AnimatedTabScreen>
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          className="flex-1 bg-[#f6f8f6]"
          style={{ flex: 1 }}
          edges={['top']}
        >
          {isPending ? (
            <DashboardSkeleton />
          ) : isError ? (
            <ErrorView onRetry={onRefresh} />
          ) : (
            <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 96,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#13ec5b']}
                tintColor="#13ec5b"
              />
            }
          >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-6">
              <View>
                <Text className="text-gray-500 text-sm font-medium mb-1">
                  {dateStr}
                </Text>
                <Text className="text-3xl font-bold tracking-tight">
                  Halo, {userName}! 👋
                </Text>
              </View>
              <View className="relative">
                <View className="h-12 w-12 rounded-full border-2 border-primary p-0.5">
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 999,
                    }}
                    contentFit="cover"
                    transition={200}
                  />
                </View>
                <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-white" />
              </View>
            </View>

            {/* Kas Kelas */}
            <View className="relative overflow-hidden rounded-2xl bg-white p-5 mb-8 border border-gray-100">
              <View
                className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary"
                style={{ opacity: 0.1 }}
              />
              <View className="relative z-10">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Wallet size={20} color="#0fae43" />
                    <Text className="text-emerald-700 text-sm font-semibold uppercase tracking-wider">
                      KAS KELAS
                    </Text>
                  </View>
                </View>

                <View className="mt-4">
                  <Text className="text-3xl font-bold tracking-tight">
                    {formatCurrency(dashboard?.fund?.totalAmount ?? 0)}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    Saldo terkini per hari ini
                  </Text>
                </View>

                <View className="flex-row gap-3 pt-4">
                  {canWrite('funds') && (
                    <Button
                      className="flex-1 rounded-lg py-2.5"
                      onPress={() =>
                        router.push(
                          '/(tabs)/funds' as import('expo-router').Href,
                        )
                      }
                    >
                      <Text
                        className="text-sm font-bold"
                        style={{ color: '#112217' }}
                      >
                        Bayar Kas
                      </Text>
                    </Button>
                  )}
                  <Pressable
                    className="rounded-lg bg-gray-100 p-2.5 border border-gray-200 items-center justify-center"
                    onPress={() =>
                      router.push(
                        '/(tabs)/funds' as import('expo-router').Href,
                      )
                    }
                  >
                    <History size={20} color="#374151" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Jadwal Hari Ini */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold">Jadwal Hari Ini</Text>
              <Pressable
                onPress={() =>
                  router.push(
                    '/(tabs)/schedule' as import('expo-router').Href,
                  )
                }
              >
                <Text className="text-emerald-600 text-sm font-semibold">
                  Lihat Semua
                </Text>
              </Pressable>
            </View>

            {isError ? (
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 items-center">
                <Text className="text-sm text-slate-400">Gagal memuat jadwal.</Text>
              </View>
            ) : scheduleItems.length === 0 ? (
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 items-center">
                <Text className="text-sm text-slate-400">
                  Tidak ada jadwal hari ini.
                </Text>
              </View>
            ) : (
              scheduleItems.map((s) => {
                const active = isCurrentSlot(s.startTime, s.endTime);
                return (
                  <View
                    key={s.id}
                    className={
                      active
                        ? 'bg-white border-l-4 border-primary rounded-xl p-4 flex-row items-start gap-4 shadow-sm mb-3'
                        : 'bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-start gap-4 mb-3'
                    }
                    style={!active ? { opacity: 0.7 } : undefined}
                  >
                    <View className="rounded-lg bg-gray-100 px-3 py-2 min-w-[70px] items-center">
                      <Text className="text-lg font-bold">{s.startTime}</Text>
                      <Text className="text-xs text-gray-500">{s.endTime}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold mb-1">
                        {s.subjectName}
                      </Text>
                      <View className="flex-row gap-4 flex-wrap">
                        {s.room && (
                          <View className="flex-row items-center gap-1">
                            <MapPin size={14} color="#059669" />
                            <Text className="text-xs text-emerald-600">
                              {s.room}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {active && (
                      <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                        <Video size={18} color="#0fae43" />
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* Tugasmu */}
            <View className="flex-row items-center justify-between mt-5 mb-4">
              <Text className="text-lg font-bold">Tugasmu</Text>
              <Pressable
                onPress={() =>
                  router.push('/(tabs)/assignments' as import('expo-router').Href)
                }
              >
                <Text className="text-emerald-600 text-sm font-semibold">
                  Lihat Semua
                </Text>
              </Pressable>
            </View>

            {pendingTasks.length === 0 ? (
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 items-center">
                <Text className="text-sm text-slate-400">
                  {'Tidak ada tugas yang belum selesai. 🎉'}
                </Text>
              </View>
            ) : (
              pendingTasks.map((t) => (
                <View
                  key={t.id}
                  className="flex-row items-center gap-3 rounded-xl p-3 bg-white border border-gray-200 mb-3"
                >
                  <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-100">
                    <CheckCircle size={20} color="#9ca3af" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold">
                      {t.title}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {t.subject.name}
                    </Text>
                  </View>
                  <View className="h-2 w-2 rounded-full bg-red-500" />
                </View>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
      </>
    </AnimatedTabScreen>
    );
  } catch (err) {
    // Log any render errors
    console.error('Dashboard render error:', err);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f8f6' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#ef4444', textAlign: 'center' }}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
}
