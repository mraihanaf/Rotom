import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Stack, router } from 'expo-router';
import {
  Check,
  CheckCircle,
  History,
  MapPin,
  TrendingUp,
  User,
  Video,
  Wallet,
} from 'lucide-react-native';
import { Image, Pressable, ScrollView, View } from 'react-native';

const SCHEDULE = [
  {
    id: '1',
    start: '07:30',
    end: '09:00',
    title: 'Matematika Wajib',
    room: 'R. 204',
    teacher: 'Pak Budi',
    active: true,
  },
  {
    id: '2',
    start: '09:30',
    end: '11:00',
    title: 'Bahasa Inggris',
    room: 'Lab Bahasa',
    teacher: 'Ms. Sarah',
    active: false,
  },
];

const TASKS = [
  { id: '1', title: 'Bayar Kas Mingguan', subtitle: 'Jatuh tempo hari ini', done: false },
  { id: '2', title: 'Jadwal Piket Kebersihan', subtitle: 'Selesai', done: true },
];

const BAR_HEIGHTS = [40, 60, 35, 70, 50, 85, 20];

export default function DashboardScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1 bg-[#f6f8f6]" showsVerticalScrollIndicator={false}>
        <View className="pt-12 pb-24 px-4">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-6">
            <View>
              <Text className="text-gray-500 text-sm font-medium mb-1">
                Senin, 24 Oktober
              </Text>
              <Text className="text-3xl font-bold tracking-tight">
                Halo, Andi! 👋
              </Text>
            </View>
            <View className="relative">
              <View className="h-12 w-12 rounded-full border-2 border-primary p-0.5">
                <Image
                  source={{ uri: 'https://i.pravatar.cc/100?u=andi' }}
                  className="h-full w-full rounded-full"
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
                <View className="flex-row items-center gap-1 bg-primary/20 rounded-full px-2.5 py-1">
                  <TrendingUp size={14} color="#0fae43" />
                  <Text className="text-emerald-800 text-xs font-bold">+12%</Text>
                </View>
              </View>

              <View className="mt-4">
                <Text className="text-3xl font-bold tracking-tight">Rp 2.500.000</Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Saldo terkini per hari ini
                </Text>
              </View>

              <View className="flex-row h-16 items-end gap-1 my-1">
                {BAR_HEIGHTS.map((h, i) => (
                  <View
                    key={i}
                    className={`flex-1 rounded-t-sm ${
                      i === 5
                        ? 'bg-primary'
                        : i === 6
                          ? 'bg-primary/10'
                          : 'bg-primary/20'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </View>

              <View className="flex-row gap-3 pt-2">
                <Button
                  className="flex-1 rounded-lg py-2.5"
                  onPress={() =>
                    router.push('/(tabs)/funds' as import('expo-router').Href)
                  }
                >
                  <Text className="text-sm font-bold" style={{ color: '#112217' }}>
                    Bayar Kas
                  </Text>
                </Button>
                <Pressable className="rounded-lg bg-gray-100 p-2.5 border border-gray-200 items-center justify-center">
                  <History size={20} color="#374151" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Jadwal Hari Ini */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold">Jadwal Hari Ini</Text>
              <Pressable
                onPress={() =>
                  router.push('/(tabs)/schedule' as import('expo-router').Href)
                }
              >
                <Text className="text-emerald-600 text-sm font-semibold">
                  Lihat Semua
                </Text>
              </Pressable>
            </View>
            <View className="gap-3">
              {SCHEDULE.map((s) => (
                <View
                  key={s.id}
                  className={
                    s.active
                      ? 'bg-white border-l-4 border-primary rounded-xl p-4 flex-row items-start gap-4 shadow-sm'
                      : 'bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-start gap-4'
                  }
                  style={!s.active ? { opacity: 0.7 } : undefined}
                >
                  <View className="rounded-lg bg-gray-100 px-3 py-2 min-w-[70px] items-center">
                    <Text className="text-lg font-bold">{s.start}</Text>
                    <Text className="text-xs text-gray-500">{s.end}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold mb-1">{s.title}</Text>
                    <View className="flex-row gap-4 flex-wrap">
                      <View className="flex-row items-center gap-1">
                        <MapPin size={14} color="#059669" />
                        <Text className="text-xs text-emerald-600">{s.room}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <User size={14} color="#059669" />
                        <Text className="text-xs text-emerald-600">{s.teacher}</Text>
                      </View>
                    </View>
                  </View>
                  {s.active && (
                    <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                      <Video size={18} color="#0fae43" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Tugasmu */}
          <View className="mb-4">
            <Text className="text-lg font-bold mb-4">Tugasmu</Text>
            <View className="gap-3">
              {TASKS.map((t) => (
                <View
                  key={t.id}
                  className={
                    t.done
                      ? 'flex-row items-center gap-3 rounded-xl p-3 bg-gray-50 border border-gray-200'
                      : 'flex-row items-center gap-3 rounded-xl p-3 bg-white border border-gray-200'
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
                      style={t.done ? { textDecorationColor: '#6b7280' } : undefined}
                    >
                      {t.title}
                    </Text>
                    <Text
                      className={
                        t.done ? 'text-xs text-gray-500' : 'text-xs text-red-500'
                      }
                    >
                      {t.subtitle}
                    </Text>
                  </View>
                  {!t.done && (
                    <View className="h-2 w-2 rounded-full bg-red-500" />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
