import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Button } from '@/components/ui/button';
import { ErrorView } from '@/components/ui/error-view';
import { Text } from '@/components/ui/text';
import { Stack, router } from 'expo-router';
import {
  Check,
  CheckCircle,
  History,
  MapPin,
  Video,
  Wallet,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { useUserRole } from '@/lib/hooks/useUserRole';

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
      data: profile,
      isPending: profileLoading,
      isError: profileError,
      refetch: refetchProfile,
    } = useQuery(orpc.profiles.getMe.queryOptions());

    const {
      data: fund,
      isPending: fundLoading,
      isError: fundError,
      refetch: refetchFund,
    } = useQuery(orpc.funds.getFund.queryOptions());

    const todayDow = new Date().getDay();
    const {
      data: schedule,
      isPending: scheduleLoading,
      isError: scheduleError,
      refetch: refetchSchedule,
    } = useQuery(
      orpc.schedules.getByDay.queryOptions({ input: { dayOfWeek: todayDow } }),
    );

    const {
      data: assignmentsData,
      isPending: assignmentsLoading,
      isError: assignmentsError,
      refetch: refetchAssignments,
    } = useQuery(
      orpc.assignments.getAllAssignments.queryOptions({ input: { limit: 5 } }),
    );

    const isPending =
      profileLoading || fundLoading || scheduleLoading || assignmentsLoading;
    const isError =
      profileError || fundError || scheduleError || assignmentsError;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchFund(),
      refetchSchedule(),
      refetchAssignments(),
    ]);
    setRefreshing(false);
  }, [refetchProfile, refetchFund, refetchSchedule, refetchAssignments]);

  const scheduleItems = schedule ?? [];
  const assignments = assignmentsData?.items ?? [];
  const pendingTasks = assignments.filter((a) => !a.done);

  const userName =
    profile?.name?.split(' ')[0] ??
    session?.user?.name?.split(' ')[0] ??
    'Student';
  const avatarUrl =
    profile?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name ?? '')}&size=100&background=13ec5b&color=112217`;

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
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#13ec5b" />
            </View>
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
                    {formatCurrency(fund?.totalAmount ?? 0)}
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

            {scheduleItems.length === 0 ? (
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
            <View className="mt-5 mb-4">
              <Text className="text-lg font-bold">Tugasmu</Text>
            </View>

            {pendingTasks.length === 0 && assignments.length === 0 ? (
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 items-center">
                <Text className="text-sm text-slate-400">
                  Tidak ada tugas.
                </Text>
              </View>
            ) : (
              assignments.slice(0, 5).map((t) => (
                <View
                  key={t.id}
                  className={
                    t.done
                      ? 'flex-row items-center gap-3 rounded-xl p-3 bg-gray-50 border border-gray-200 mb-3'
                      : 'flex-row items-center gap-3 rounded-xl p-3 bg-white border border-gray-200 mb-3'
                  }
                  style={t.done ? { opacity: 0.6 } : undefined}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      t.done ? 'bg-primary' : 'bg-gray-100'
                    }`}
                  >
                    {t.done ? (
                      <Check size={20} color="#112217" strokeWidth={2.5} />
                    ) : (
                      <CheckCircle size={20} color="#9ca3af" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-semibold ${t.done ? 'line-through' : ''}`}
                      style={
                        t.done
                          ? { textDecorationColor: '#6b7280' }
                          : undefined
                      }
                    >
                      {t.title}
                    </Text>
                    <Text
                      className={
                        t.done
                          ? 'text-xs text-gray-500'
                          : 'text-xs text-slate-500'
                      }
                    >
                      {t.done ? 'Selesai' : t.subject.name}
                    </Text>
                  </View>
                  {!t.done && (
                    <View className="h-2 w-2 rounded-full bg-red-500" />
                  )}
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
