import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/api';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronDown, Clock, MapPin } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, FlatList, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { View, Pressable, TextInput } from '@/tw';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

function validateTime(t: string) {
  return /^\d{2}:\d{2}$/.test(t);
}

export default function NewScheduleScreen() {
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [subjectId, setSubjectId] = React.useState<string | null>(null);
  const [dayOfWeek, setDayOfWeek] = React.useState(new Date().getDay());
  const [startTime, setStartTime] = React.useState('07:00');
  const [endTime, setEndTime] = React.useState('08:00');
  const [room, setRoom] = React.useState('');
  const [showSubjectPicker, setShowSubjectPicker] = React.useState(false);

  const { data: subjectsData } = useQuery(
    orpc.subjectMaterials.getAll.queryOptions({ input: { limit: 50 } }),
  );
  const subjects = subjectsData?.items ?? [];
  const selectedSubject = subjects.find((s) => s.id === subjectId);

  // Fetch week schedule if editing
  const { data: weekSchedule, isPending: isLoadingSchedule } = useQuery({
    ...orpc.schedules.getWeek.queryOptions(),
    enabled: isEditing,
  });

  // Populate form when editing
  React.useEffect(() => {
    if (isEditing && weekSchedule) {
      const schedule = weekSchedule.find((s: any) => s.id === id);
      if (schedule) {
        setSubjectId(schedule.subjectId);
        setDayOfWeek(schedule.dayOfWeek);
        setStartTime(schedule.startTime);
        setEndTime(schedule.endTime);
        setRoom(schedule.room ?? '');
      }
    }
  }, [isEditing, weekSchedule, id]);

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: orpc.dashboard.getDashboardSummary.queryOptions().queryKey });
  };

  const createMutation = useMutation({
    ...orpc.schedules.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.schedules.getByDay.queryOptions({ input: { dayOfWeek } }).queryKey,
      });
      invalidateDashboard();
      router.back();
      Alert.alert('Berhasil', 'Jadwal berhasil ditambahkan!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Gagal menambahkan jadwal.');
    },
  });

  const updateMutation = useMutation({
    ...orpc.schedules.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.schedules.getByDay.queryOptions({ input: { dayOfWeek } }).queryKey,
      });
      invalidateDashboard();
      router.back();
      Alert.alert('Berhasil', 'Jadwal berhasil diperbarui!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Gagal memperbarui jadwal.');
    },
  });

  const isValid =
    subjectId !== null &&
    validateTime(startTime) &&
    validateTime(endTime) &&
    startTime < endTime;

  const handleSubmit = () => {
    if (!isValid) {
      Alert.alert('Error', 'Lengkapi semua field dengan benar.');
      return;
    }
    if (isEditing) {
      updateMutation.mutate({
        id: id!,
        subjectId: subjectId!,
        dayOfWeek,
        startTime,
        endTime,
        room: room.trim() || null,
      });
    } else {
      createMutation.mutate({
        subjectId: subjectId!,
        dayOfWeek,
        startTime,
        endTime,
        room: room.trim() || null,
      });
    }
  };

  if (isEditing && isLoadingSchedule) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0ea340" />
          <Text className="text-slate-400 mt-4">Memuat jadwal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">{isEditing ? 'Edit Jadwal' : 'Tambah Jadwal'}</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 20 }}>
        {/* Subject */}
        <View style={{ gap: 4 }}>
          <Text className="text-sm font-semibold text-[#111827] ml-1">Mata Pelajaran</Text>
          <Pressable onPress={() => setShowSubjectPicker(true)} disabled={subjects.length === 0}>
            <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
              <BookOpen size={18} color="#0ea340" style={{ marginRight: 10 }} />
              <Text className={`flex-1 text-base font-medium ${selectedSubject ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                {selectedSubject?.name ?? (subjects.length === 0 ? 'Tidak ada mata pelajaran' : 'Pilih mata pelajaran')}
              </Text>
              <ChevronDown size={20} color="#9ca3af" />
            </View>
          </Pressable>
        </View>

        {/* Day of week */}
        <View style={{ gap: 4 }}>
          <Text className="text-sm font-semibold text-[#111827] ml-1">Hari</Text>
          <View className="flex-row gap-2 flex-wrap">
            {DAY_LABELS.map((label, i) => (
              <Pressable
                key={i}
                onPress={() => setDayOfWeek(i)}
                className={`px-3 py-2 rounded-xl border ${
                  dayOfWeek === i ? 'bg-primary border-primary' : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`text-sm font-semibold ${dayOfWeek === i ? 'text-[#0a2e16]' : 'text-slate-600'}`}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Start time */}
        <View style={{ gap: 4 }}>
          <Text className="text-sm font-semibold text-[#111827] ml-1">Mulai</Text>
          <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
            <Clock size={18} color="#0ea340" style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 text-lg font-medium text-[#111827]"
              placeholder="HH:MM"
              placeholderTextColor="#9ca3af"
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>

        {/* End time */}
        <View style={{ gap: 4 }}>
          <Text className="text-sm font-semibold text-[#111827] ml-1">Selesai</Text>
          <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
            <Clock size={18} color="#0ea340" style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 text-lg font-medium text-[#111827]"
              placeholder="HH:MM"
              placeholderTextColor="#9ca3af"
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>

        {/* Room */}
        <View style={{ gap: 4 }}>
          <Text className="text-sm font-semibold text-[#111827] ml-1">Ruangan (Opsional)</Text>
          <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
            <MapPin size={18} color="#0ea340" style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 text-base font-medium text-[#111827]"
              placeholder="Contoh: Lab Komputer"
              placeholderTextColor="#9ca3af"
              value={room}
              onChangeText={setRoom}
            />
          </View>
        </View>

        {/* Submit */}
        <Button
          onPress={handleSubmit}
          disabled={!isValid || createMutation.isPending || updateMutation.isPending}
          className="w-full h-14 rounded-xl mt-2"
        >
          <Text className="text-lg font-bold tracking-tight" style={{ color: '#0a2e16' }}>
            {createMutation.isPending || updateMutation.isPending
              ? 'Menyimpan...'
              : isEditing ? 'Perbarui Jadwal' : 'Simpan Jadwal'}
          </Text>
        </Button>
      </ScrollView>

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowSubjectPicker(false)} />
        <View className="bg-white rounded-t-2xl max-h-[50%] pb-8">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
            <Text className="text-lg font-bold text-[#111827]">Pilih Mata Pelajaran</Text>
            <Pressable onPress={() => setShowSubjectPicker(false)}>
              <Text className="text-base font-semibold text-[#0ea340]">Done</Text>
            </Pressable>
          </View>
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { setSubjectId(item.id); setShowSubjectPicker(false); }}
                className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-lg bg-primary/20 items-center justify-center">
                    <BookOpen size={16} color="#0ea340" />
                  </View>
                  <Text className="text-base text-[#111827]">{item.name}</Text>
                </View>
                {subjectId === item.id && (
                  <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="px-6 py-8 items-center">
                <Text className="text-slate-400">Tidak ada mata pelajaran. Tambah dulu!</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
