import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Text } from '@/components/ui/text';
import { Checkbox } from '@/components/ui/checkbox';
import { ErrorView } from '@/components/ui/error-view';
import { Stack } from 'expo-router';
import {
  Search,
  ListFilter,
  Clock,
  Calendar,
  CheckCircle,
  MoreHorizontal,
  Plus,
  Users,
  Trash2,
  Pencil,
} from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, Alert } from 'react-native';
import { View, ScrollView, Pressable } from '@/tw';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { authClient } from '@/lib/auth-client';
import { router } from 'expo-router';
import { SkeletonBox } from '@/components/ui/skeleton';

// Animated progress bar for weekly goal
function AnimatedProgressBar({ percentage }: { percentage: number }) {
  const progress = useSharedValue(0);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (!hasAnimated.current) {
      // Start from 0 and animate to target on first load
      progress.value = 0;
      const timeout = setTimeout(() => {
        progress.value = withSpring(percentage / 100, {
          damping: 18,
          stiffness: 120,
          mass: 1,
        });
      }, 150);
      hasAnimated.current = true;
      return () => clearTimeout(timeout);
    } else {
      // Animate to new value on updates
      progress.value = withSpring(percentage / 100, {
        damping: 18,
        stiffness: 120,
        mass: 1,
      });
    }
  }, [percentage, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ height: 12, backgroundColor: '#f3f4f6', borderRadius: 9999, overflow: 'hidden' }}>
      <Animated.View
        style={[animatedStyle, { height: 12, backgroundColor: '#0fae43', borderRadius: 9999 }]}
      />
    </View>
  );
}

function AssignmentsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 16 }}>
      {/* Greeting */}
      <SkeletonBox width={220} height={28} borderRadius={8} />
      <SkeletonBox width={180} height={14} borderRadius={6} />
      {/* Progress card */}
      <SkeletonBox height={96} borderRadius={12} />
      {/* Filter pills */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SkeletonBox width={60} height={34} borderRadius={17} />
        <SkeletonBox width={80} height={34} borderRadius={17} />
        <SkeletonBox width={90} height={34} borderRadius={17} />
      </View>
      {/* Section label */}
      <SkeletonBox width={60} height={18} borderRadius={6} />
      {/* Task cards */}
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonBox key={i} height={88} borderRadius={12} />
      ))}
    </View>
  );
}

const TASK_FILTERS = ['All', 'Pending', 'Completed'] as const;

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

function getSubjectColor(name: string) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = [
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-orange-100', text: 'text-orange-700' },
    { bg: 'bg-pink-100', text: 'text-pink-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  ];
  return palette[hash % palette.length] ?? SUBJECT_COLORS.default;
}

function isToday(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isTomorrow(date: Date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getFullYear() === tomorrow.getFullYear() && date.getMonth() === tomorrow.getMonth() && date.getDate() === tomorrow.getDate();
}

function isUrgent(dueDate: string) {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return diffMs > 0 && diffMs < 6 * 60 * 60 * 1000; // < 6 hours
}

function formatDueTime(dueDate: string) {
  const d = new Date(dueDate);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function AssignmentsScreen() {
  const queryClient = useQueryClient();
  const { canWrite } = useUserRole();
  const { data: session } = authClient.useSession();
  const [filter, setFilter] = React.useState<(typeof TASK_FILTERS)[number]>('All');

  const { data, isPending, isError, refetch } = useQuery(orpc.assignments.getAllAssignments.queryOptions({ input: { limit: 50 } }));

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: orpc.dashboard.getDashboardSummary.queryOptions().queryKey });
  };

  const markMutation = useMutation({
    ...orpc.assignments.markAssignment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.assignments.getAllAssignments.queryOptions({ input: { limit: 50 } }).queryKey });
      invalidateDashboard();
    },
  });

  const unmarkMutation = useMutation({
    ...orpc.assignments.unmarkAssignment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.assignments.getAllAssignments.queryOptions({ input: { limit: 50 } }).queryKey });
      invalidateDashboard();
    },
  });

  const deleteMutation = useMutation({
    ...orpc.assignments.deleteAssignment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.assignments.getAllAssignments.queryOptions({ input: { limit: 50 } }).queryKey });
      invalidateDashboard();
    },
  });

  const assignments = data?.items ?? [];

  const pending = assignments.filter((a) => !a.done);
  const completed = assignments.filter((a) => a.done);

  const filtered = filter === 'Pending' ? pending : filter === 'Completed' ? completed : assignments;

  const todayTasks = filtered.filter((a) => !a.done && isToday(new Date(a.dueDate)));
  const tomorrowTasks = filtered.filter((a) => !a.done && isTomorrow(new Date(a.dueDate)));
  const laterTasks = filtered.filter((a) => !a.done && !isToday(new Date(a.dueDate)) && !isTomorrow(new Date(a.dueDate)));
  const completedTasks = filtered.filter((a) => a.done);

  const totalCount = assignments.length;
  const doneCount = completed.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const toggleAssignment = (id: string, done: boolean) => {
    if (done) {
      unmarkMutation.mutate({ id });
    } else {
      markMutation.mutate({ id });
    }
  };
  const {
        data: profile,
      } = useQuery(orpc.profiles.getMe.queryOptions());

  const userName = profile?.name.split(" ")[0]

  const renderAssignmentCard = (a: (typeof assignments)[number]) => {
    const colors = getSubjectColor(a.subject.name);
    const urgent = !a.done && isUrgent(a.dueDate as string);

    return (
      <View
        key={a.id}
        className={`rounded-xl p-4 shadow-sm border border-gray-100 ${
          a.done ? 'bg-gray-50 opacity-60' : 'bg-white'
        } ${urgent && !a.done ? 'border-l-4 border-l-orange-500' : ''}`}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className={`px-2 py-1 rounded-md ${a.done ? 'bg-gray-200' : colors.bg}`}>
            <Text className={`text-[10px] font-bold uppercase ${a.done ? 'text-gray-600' : colors.text}`}>
              {a.subject.name}
            </Text>
          </View>
          {a.done ? (
            <CheckCircle size={20} color="#13ec5b" />
          ) : canWrite('assignments') ? (
            <Pressable
              onPress={() => {
                Alert.alert(
                  a.title,
                  'Pilih aksi',
                  [
                    { text: 'Edit', onPress: () => router.push(`/modal/new-assignment?id=${a.id}` as any) },
                    { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate({ id: a.id }) },
                    { text: 'Batal', style: 'cancel' },
                  ]
                );
              }}
            >
              <MoreHorizontal size={20} color="#cbd5e1" />
            </Pressable>
          ) : (
            <MoreHorizontal size={20} color="#cbd5e1" />
          )}
        </View>
        <View className="flex-row items-start gap-4">
          <Checkbox
            checked={a.done}
            onCheckedChange={() => toggleAssignment(a.id, a.done)}
          />
          <View className="flex-1">
            <Text className={`text-base font-bold ${a.done ? 'line-through text-slate-400' : 'text-foreground'}`}>
              {a.title}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              {a.done ? (
                <>
                  <CheckCircle size={14} color="#13ec5b" />
                  <Text className="text-xs font-semibold text-primary">Completed</Text>
                </>
              ) : urgent ? (
                <>
                  <Clock size={14} color="#f97316" />
                  <Text className="text-xs font-semibold text-orange-600">
                    Due {formatDueTime(a.dueDate as string)}
                  </Text>
                </>
              ) : (
                <>
                  <Calendar size={14} color="#64748b" />
                  <Text className="text-xs text-slate-500">
                    Due {formatDueTime(a.dueDate as string)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AnimatedTabScreen>
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" style={{ flex: 1 }} edges={['top']}>
        <Stack.Screen options={{ title: 'Tugas', headerShown: false }} />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <Text className="text-xl font-bold tracking-[-0.015em] text-foreground flex-1">
            Tugas Saya
          </Text>
        </View>

      {isPending ? (
        <AssignmentsSkeleton />
      ) : isError ? (
        <ErrorView onRetry={() => refetch()} />
      ) : (
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
          <View className="px-4 pt-4 gap-6">
            {/* Greeting */}
            <View className="gap-1 pt-2">
              <Text className="text-2xl font-bold text-foreground">Hello, {userName} 👋</Text>
              <Text className="text-slate-500 text-sm">
                You have <Text className="text-green-600 font-bold">{pending.length} tasks</Text> pending
                this week.
              </Text>
            </View>

            {/* Weekly Goal */}
            <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row justify-between items-end mb-3">
                <View>
                  <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    WEEKLY GOAL
                  </Text>
                  <Text className="text-3xl font-bold text-foreground">{pct}%</Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-green-700">{doneCount}/{totalCount} Done</Text>
                </View>
              </View>
              <AnimatedProgressBar percentage={pct} />
            </View>

            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
              <View className="flex-row gap-3">
                {TASK_FILTERS.map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    className={`h-9 rounded-full px-5 items-center justify-center ${
                      filter === f ? 'bg-slate-900' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        filter === f ? 'text-white font-bold' : 'text-slate-600 font-medium'
                      }`}
                    >
                      {f}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Today */}
            {todayTasks.length > 0 && (
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-foreground">Today</Text>
                  <Text className="text-xs text-slate-400">{formatDateShort(new Date())}</Text>
                </View>
                {todayTasks.map(renderAssignmentCard)}
              </View>
            )}

            {/* Tomorrow */}
            {tomorrowTasks.length > 0 && (
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-foreground">Tomorrow</Text>
                  <Text className="text-xs text-slate-400">
                    {formatDateShort(new Date(Date.now() + 86400000))}
                  </Text>
                </View>
                {tomorrowTasks.map(renderAssignmentCard)}
              </View>
            )}

            {/* Later */}
            {laterTasks.length > 0 && (
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-foreground">Upcoming</Text>
                </View>
                {laterTasks.map(renderAssignmentCard)}
              </View>
            )}

            {/* Completed */}
            {completedTasks.length > 0 && (
              <View className="pt-4 border-t border-dashed border-gray-200">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    COMPLETED ({completedTasks.length})
                  </Text>
                </View>
                {completedTasks.map(renderAssignmentCard)}
              </View>
            )}

            {assignments.length === 0 && (
              <View className="items-center py-12">
                <Text className="text-slate-400 text-sm">No assignments yet.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* FABs — only for mentor/admin */}
      {canWrite('assignments') && (
        <View className="absolute bottom-24 right-6 z-40 gap-3">
          <Pressable
            className="w-14 h-14 rounded-full bg-white border-2 border-primary items-center justify-center shadow-lg"
            onPress={() => router.push('/modal/mentor-assignments' as any)}
          >
            <Users size={24} color="#0fae43" />
          </Pressable>
          <Pressable
            className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
            onPress={() => router.push('/modal/new-assignment' as any)}
          >
            <Plus size={28} color="#0a2e16" />
          </Pressable>
        </View>
      )}
      </SafeAreaView>
    </AnimatedTabScreen>
  );
}
