import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Text } from '@/components/ui/text';
import { ErrorView } from '@/components/ui/error-view';
import { Stack } from 'expo-router';
import { MapPin, Video } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/lib/api';

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

function isCurrentSlot(start: string, end: string) {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return hhmm >= start && hhmm < end;
}

export default function ScheduleScreen() {
  const todayDow = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(todayDow);

  const {
    data: schedule,
    isPending,
    isError,
    refetch,
  } = useQuery(
    orpc.schedules.getByDay.queryOptions({
      input: { dayOfWeek: selectedDay },
    }),
  );

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
      <View className="px-4 pt-6 pb-2">
        <Text className="text-xl font-bold tracking-tight">Jadwal Pelajaran</Text>
        <Text className="text-sm text-slate-500 mt-0.5">
          {DAY_FULL[selectedDay]},{' '}
          {new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      {/* Day selector */}
      <View className="px-4 pt-3 pb-4">
        <View className="flex-row gap-2">
          {DAY_LABELS.map((label, i) => {
            const isSelected = i === selectedDay;
            const isTodayPill = i === todayDow;
            return (
              <Pressable
                key={label}
                onPress={() => setSelectedDay(i)}
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#13ec5b" />
        </View>
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
          </View>
        </ScrollView>
      )}
      </SafeAreaView>
    </AnimatedTabScreen>
  );
}
