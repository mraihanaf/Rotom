import { Text } from '@/components/ui/text';
import { Checkbox } from '@/components/ui/checkbox';
import { Stack } from 'expo-router';
import {
  Search,
  ListFilter,
  Clock,
  Calendar,
  CheckCircle,
  MoreHorizontal,
  Plus,
} from 'lucide-react-native';
import * as React from 'react';
import { View, ScrollView, Pressable } from 'react-native';

const TASK_FILTERS = ['All', 'Pending', 'Completed'] as const;

type TodayTask = {
  id: string;
  subject: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  due: string;
  urgent: boolean;
};

const MOCK_TASKS_TODAY: TodayTask[] = [
  {
    id: '1',
    subject: 'MATHEMATICS',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    title: 'Chapter 5 Calculus Exercises',
    due: '10:00 AM',
    urgent: true,
  },
  {
    id: '2',
    subject: 'HISTORY',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    title: 'WW2 Essay Draft',
    due: '11:59 PM',
    urgent: false,
  },
];

const MOCK_TASKS_TOMORROW = [
  {
    id: '3',
    subject: 'BIOLOGY',
    title: 'Plant Cell Diagram',
    due: 'Tomorrow, 9:00 AM',
  },
];

const MOCK_COMPLETED = [
  { id: '4', subject: 'BAHASA', title: 'Read Poetry Chapter 2' },
];

export default function AssignmentsScreen() {
  const [filter, setFilter] = React.useState<(typeof TASK_FILTERS)[number]>('All');
  const [checked, setChecked] = React.useState<Record<string, boolean>>({ '4': true });

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text className="text-xl font-bold tracking-[-0.015em] text-foreground flex-1">
          Tugas Saya
        </Text>
        <View className="flex-row gap-3">
          <Pressable className="w-10 h-10 items-center justify-center">
            <Search size={24} color="#111827" />
          </Pressable>
          <Pressable className="w-10 h-10 items-center justify-center">
            <ListFilter size={24} color="#111827" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4 gap-6">
          {/* Greeting */}
          <View className="gap-1 pt-2">
            <Text className="text-2xl font-bold text-foreground">Hello, Alex 👋</Text>
            <Text className="text-slate-500 text-sm">
              You have <Text className="text-green-600 font-bold">3 tasks</Text> pending
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
                <Text className="text-3xl font-bold text-foreground">62%</Text>
              </View>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-green-700">5/8 Done</Text>
              </View>
            </View>
            <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: '62%' }} />
            </View>
            <Text className="text-xs text-slate-400 text-right mt-3">Keep it up! 🚀</Text>
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
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">Today</Text>
              <Text className="text-xs text-slate-400">Oct 24</Text>
            </View>

            {MOCK_TASKS_TODAY.map((t) => (
              <View
                key={t.id}
                className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${
                  t.urgent ? 'border-l-4 border-l-orange-500' : ''
                }`}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className={`px-2 py-1 rounded-md ${t.badgeBg}`}>
                    <Text className={`text-[10px] font-bold uppercase ${t.badgeText}`}>
                      {t.subject}
                    </Text>
                  </View>
                  <MoreHorizontal size={20} color="#cbd5e1" />
                </View>
                <View className="flex-row items-start gap-4">
                  <Checkbox
                    checked={checked[t.id]}
                    onCheckedChange={() => toggle(t.id)}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{t.title}</Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      {t.urgent ? (
                        <Clock size={14} color="#f97316" />
                      ) : (
                        <Calendar size={14} color="#64748b" />
                      )}
                      <Text
                        className={`text-xs font-semibold ${
                          t.urgent ? 'text-orange-600' : 'text-slate-500'
                        }`}
                      >
                        Due {t.due}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Tomorrow */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">Tomorrow</Text>
              <Text className="text-xs text-slate-400">Oct 25</Text>
            </View>

            {MOCK_TASKS_TOMORROW.map((t) => (
              <View
                key={t.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="bg-emerald-100 px-2 py-1 rounded-md">
                    <Text className="text-[10px] font-bold uppercase text-emerald-700">
                      {t.subject}
                    </Text>
                  </View>
                  <MoreHorizontal size={20} color="#cbd5e1" />
                </View>
                <View className="flex-row items-start gap-4">
                  <Checkbox
                    checked={checked[t.id]}
                    onCheckedChange={() => toggle(t.id)}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{t.title}</Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <Calendar size={14} color="#64748b" />
                      <Text className="text-xs text-slate-500">{t.due}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Completed */}
          <View className="pt-4 border-t border-dashed border-gray-200">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                COMPLETED (1)
              </Text>
            </View>

            {MOCK_COMPLETED.map((t) => (
              <View
                key={t.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 opacity-60"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="bg-gray-200 px-2 py-1 rounded-md">
                    <Text className="text-[10px] font-bold uppercase text-gray-600">
                      {t.subject}
                    </Text>
                  </View>
                  <CheckCircle size={20} color="#13ec5b" />
                </View>
                <View className="flex-row items-start gap-4">
                  <Checkbox checked={true} onCheckedChange={() => {}} />
                  <View className="flex-1">
                    <Text className="text-base font-bold line-through text-slate-400">
                      {t.title}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <CheckCircle size={14} color="#13ec5b" />
                      <Text className="text-xs font-semibold text-primary">Completed</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <View className="absolute bottom-24 right-6 z-40">
        <Pressable className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg">
          <Plus size={28} color="#0a2e16" />
        </Pressable>
      </View>
    </>
  );
}
