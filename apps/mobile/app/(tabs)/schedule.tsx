import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import { MapPin, User, Video } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

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

export default function ScheduleScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-12 pb-24 px-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold">Jadwal Hari Ini</Text>
            <Text className="text-emerald-600 text-sm font-semibold">
              Lihat Semua
            </Text>
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
      </ScrollView>
    </>
  );
}
