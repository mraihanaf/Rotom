import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Text } from '@/components/ui/text';
import { ErrorView } from '@/components/ui/error-view';
import { Stack, router } from 'expo-router';
import { Video, Plus, MapPin, Trash2, BookOpen, Pencil, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, RefreshControl } from 'react-native';
import { View, Pressable, ScrollView } from '@/tw';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { SkeletonBox } from '@/components/ui/skeleton';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { Image } from 'expo-image';

function ScheduleSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
      {/* Day picker */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBox key={i} width={36} height={52} borderRadius={10} style={{ flex: 1 }} />
        ))}
      </View>
      {/* Time slot rows */}
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonBox key={i} height={80} borderRadius={12} />
      ))}
    </View>
  );
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;
const DAY_FULL = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

const PIKET_DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'] as const;
const PIKET_DAY_INDICES = [1, 2, 3, 4, 5] as const;

type ScheduleMode = 'pelajaran' | 'piket';

const STATUS_COLORS = {
  SCHEDULED: { bg: '#f3f4f6', text: '#6b7280', icon: AlertCircle },
  COMPLETED: { bg: '#dcfce7', text: '#16a34a', icon: CheckCircle },
  MISSED: { bg: '#fee2e2', text: '#dc2626', icon: XCircle },
  EXCUSED: { bg: '#fef3c7', text: '#d97706', icon: AlertCircle },
};

function isCurrentSlot(start: string, end: string) {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return hhmm >= start && hhmm < end;
}

// Duty list component grouped by duty type
function DutyList({ duties }: { duties: any[] }) {
  // Group duties by duty type
  const grouped = duties.reduce((acc, duty) => {
    const typeName = duty.dutyType?.name || 'Unknown';
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(duty);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      {Object.entries(grouped).map(([typeName, typeDuties]) => (
        <View key={typeName} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2 px-1">{typeName}</Text>
          <View className="gap-2">
            {typeDuties.map((duty) => {
              const status = duty.status as keyof typeof STATUS_COLORS;
              const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
              const StatusIcon = statusConfig.icon;

              return (
                <View
                  key={duty.id}
                  className="bg-white border border-gray-200 rounded-xl p-3 flex-row items-center gap-3"
                >
                  <Image
                    source={{
                      uri: duty.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(duty.user?.name || 'User')}&size=64&background=e5f7eb&color=0ea340`,
                    }}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb' }}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">{duty.user?.name}</Text>
                    <View
                      className="flex-row items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full self-start"
                      style={{ backgroundColor: statusConfig.bg }}
                    >
                      <StatusIcon size={12} color={statusConfig.text} />
                      <Text className="text-xs font-medium" style={{ color: statusConfig.text }}>
                        {status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </>
  );
}

export default function ScheduleScreen() {
  const queryClient = useQueryClient();
  const { canWrite } = useUserRole();
  const todayDow = new Date().getDay();
  const [mode, setMode] = useState<ScheduleMode>('pelajaran');
  const [selectedDay, setSelectedDay] = useState(todayDow);
  const [piketDayIndex, setPiketDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5 ? today - 1 : 0;
  });

  const {
    data: schedule,
    isPending: isSchedulePending,
    isError: isScheduleError,
    refetch: refetchSchedule,
  } = useQuery(
    orpc.schedules.getByDay.queryOptions({
      input: { dayOfWeek: selectedDay },
    }),
  );

  // Duty/Piket queries
  const {
    data: weekDuties,
    isPending: isDutiesPending,
    isError: isDutiesError,
    refetch: refetchDuties,
  } = useQuery(
    orpc.duty.getWeekDuties.queryOptions({ input: {} }),
  );

  const isPending = mode === 'pelajaran' ? isSchedulePending : isDutiesPending;
  const isError = mode === 'pelajaran' ? isScheduleError : isDutiesError;

  const refetch = () => {
    if (mode === 'pelajaran') {
      refetchSchedule();
    } else {
      refetchDuties();
    }
  };

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: orpc.dashboard.getDashboardSummary.queryOptions().queryKey });
  };

  const deleteMutation = useMutation({
    ...orpc.schedules.deleteById.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.schedules.getByDay.queryOptions({ input: { dayOfWeek: selectedDay } }).queryKey,
      });
      invalidateDashboard();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Gagal menghapus jadwal.');
    },
  });

  const handleDelete = (id: string, subjectName: string) => {
    Alert.alert(
      'Hapus Jadwal',
      `Yakin ingin menghapus jadwal ${subjectName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate({ id }) },
      ],
    );
  };

  const items = schedule ?? [];
  const isToday = selectedDay === todayDow;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <AnimatedTabScreen>
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" style={{ flex: 1 }} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-4 pt-6 pb-2 flex-row items-start justify-between">
        <View>
          <Text className="text-xl font-bold tracking-tight">
            {mode === 'pelajaran' ? 'Jadwal Pelajaran' : 'Jadwal Piket'}
          </Text>
          <Text className="text-sm text-slate-500 mt-0.5">
            {mode === 'pelajaran' ? DAY_FULL[selectedDay] : DAY_FULL[piketDayIndex + 1]},{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {/* Mode Toggle */}
          <View className="flex-row bg-gray-200 rounded-xl p-1">
            <Pressable
              onPress={() => setMode('pelajaran')}
              className={`px-3 py-1.5 rounded-lg ${mode === 'pelajaran' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-semibold ${mode === 'pelajaran' ? 'text-emerald-700' : 'text-gray-500'}`}>
                Pelajaran
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('piket')}
              className={`px-3 py-1.5 rounded-lg ${mode === 'piket' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-semibold ${mode === 'piket' ? 'text-emerald-700' : 'text-gray-500'}`}>
                Piket
              </Text>
            </Pressable>
          </View>
          {mode === 'pelajaran' && canWrite('schedule') && (
            <Pressable
              className="flex-row items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2"
              onPress={() => router.push('/modal/manage-subjects' as any)}
            >
              <BookOpen size={14} color="#0ea340" />
              <Text className="text-xs font-semibold text-emerald-700">Mapel</Text>
            </Pressable>
          )}
          {mode === 'piket' && canWrite('duties') && (
            <Pressable
              className="flex-row items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2"
              onPress={() => router.push('/modal/manage-duties' as any)}
            >
              <Users size={14} color="#0ea340" />
              <Text className="text-xs font-semibold text-emerald-700">Kelola</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Day selector */}
      <View className="px-4 pt-3 pb-4">
        <View className="flex-row gap-2">
          {(mode === 'pelajaran' ? DAY_LABELS : PIKET_DAY_LABELS).map((label, i) => {
            const isSelected = mode === 'pelajaran' ? i === selectedDay : i === piketDayIndex;
            const actualDay = mode === 'pelajaran' ? i : i + 1;
            const isTodayPill = actualDay === todayDow;
            return (
              <Pressable
                key={label}
                onPress={() => mode === 'pelajaran' ? setSelectedDay(i) : setPiketDayIndex(i)}
                className={`flex-1 items-center py-2.5 rounded-xl ${
                  isSelected
                    ? 'bg-primary'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-[#0a2e16]' : 'text-slate-600'
                  }`}
                >
                  {label}
                </Text>
                {isTodayPill && !isSelected && (
                  <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {isPending ? (
        <ScheduleSkeleton />
      ) : isError ? (
        <ErrorView onRetry={() => refetch()} />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 96 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#13ec5b']}
              tintColor="#13ec5b"
            />
          }
        >
          <View className="px-4 gap-3">
            {mode === 'pelajaran' ? (
              // Subject schedule view
              <>
                {items.map((s) => {
                  const active = isToday && isCurrentSlot(s.startTime, s.endTime);
                  return (
                    <View
                      key={s.id}
                      className={
                        active
                          ? 'bg-white border-l-4 border-primary rounded-xl p-4 flex-row items-start gap-4 shadow-sm'
                          : 'bg-white border border-gray-200 rounded-xl p-4 flex-row items-start gap-4'
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
                      {canWrite('schedule') && (
                        <View className="flex-row gap-1">
                          <Pressable
                            className="w-8 h-8 rounded-full items-center justify-center"
                            onPress={() => router.push(`/modal/new-schedule?id=${s.id}` as any)}
                          >
                            <Pencil size={14} color="#6b7280" />
                          </Pressable>
                          <Pressable
                            className="w-8 h-8 rounded-full items-center justify-center"
                            onPress={() => handleDelete(s.id, s.subjectName)}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
                {items.length === 0 && (
                  <View className="items-center py-16">
                    <Text className="text-slate-400 text-sm">
                      Tidak ada jadwal untuk {DAY_FULL[selectedDay]}.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // Duty/Piket view
              <>
                {weekDuties?.week?.[piketDayIndex]?.duties && (
                  <DutyList duties={weekDuties.week[piketDayIndex].duties} />
                )}
                {(!weekDuties?.week?.[piketDayIndex]?.duties || weekDuties.week[piketDayIndex].duties.length === 0) && (
                  <View className="items-center py-16">
                    <Text className="text-slate-400 text-sm">
                      Tidak ada jadwal piket untuk {DAY_FULL[piketDayIndex + 1]}.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}
      {/* FAB */}
      {canWrite('schedule') && (
        <View className="absolute bottom-24 right-6 z-40">
          <Pressable
            className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
            onPress={() => router.push('/modal/new-schedule' as any)}
          >
            <Plus size={28} color="#0a2e16" />
          </Pressable>
        </View>
      )}
      </SafeAreaView>
    </AnimatedTabScreen>
  );
}
