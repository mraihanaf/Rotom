import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/api';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, ChevronDown, BookOpen, FileText } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, FlatList, Modal, ActivityIndicator } from 'react-native';
import { View, Pressable, TextInput, ScrollView } from '@/tw';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function NewAssignmentScreen() {
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [subjectId, setSubjectId] = React.useState<string | null>(null);
  const [dueDate, setDueDate] = React.useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [dateInput, setDateInput] = React.useState('');
  const [timeInput, setTimeInput] = React.useState('');
  const [showSubjectPicker, setShowSubjectPicker] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const { data: subjectsData } = useQuery(
    orpc.subjectMaterials?.getAll?.queryOptions({ input: { limit: 50 } }) as any
  );
  const subjects = (subjectsData as any)?.items ?? [];

  const selectedSubject = subjects.find((s: any) => s.id === subjectId);

  // Fetch assignment data if editing
  const { data: assignmentData, isPending: isLoadingAssignment } = useQuery({
    ...orpc.assignments.getAllAssignments.queryOptions({ input: { limit: 50 } }),
    enabled: isEditing,
  });

  // Populate form when editing
  React.useEffect(() => {
    if (isEditing && assignmentData?.items) {
      const assignment = assignmentData.items.find((a: any) => a.id === id);
      if (assignment) {
        setTitle(assignment.title);
        setDescription(assignment.description || '');
        setSubjectId(assignment.subject.id);
        const due = new Date(assignment.dueDate);
        setDueDate(due);
        const year = due.getFullYear();
        const month = String(due.getMonth() + 1).padStart(2, '0');
        const day = String(due.getDate()).padStart(2, '0');
        const hours = String(due.getHours()).padStart(2, '0');
        const minutes = String(due.getMinutes()).padStart(2, '0');
        setDateInput(`${year}-${month}-${day}`);
        setTimeInput(`${hours}:${minutes}`);
      }
    }
  }, [isEditing, assignmentData, id]);

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: orpc.dashboard.getDashboardSummary.queryOptions().queryKey });
  };

  const createMutation = useMutation({
    ...orpc.assignments.createAssignment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.assignments.getAllAssignments.queryOptions({ input: { limit: 50 } }).queryKey });
      invalidateDashboard();
      router.back();
      Alert.alert('Success', 'Tugas berhasil ditambahkan!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message ?? 'Gagal menambahkan tugas.');
    },
  });

  const updateMutation = useMutation({
    ...orpc.assignments.updateAssignment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.assignments.getAllAssignments.queryOptions({ input: { limit: 50 } }).queryKey });
      invalidateDashboard();
      router.back();
      Alert.alert('Success', 'Tugas berhasil diperbarui!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message ?? 'Gagal memperbarui tugas.');
    },
  });

  React.useEffect(() => {
    const date = dueDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setDateInput(`${year}-${month}-${day}`);
    setTimeInput(`${hours}:${minutes}`);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !subjectId) {
      Alert.alert('Error', 'Judul dan mata pelajaran wajib diisi.');
      return;
    }

    setSubmitting(true);
    if (isEditing) {
      updateMutation.mutate({
        id: id!,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate.toISOString(),
        subjectId,
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate.toISOString(),
        subjectId,
      });
    }
    setSubmitting(false);
  };

  const isValid = title.trim().length >= 1 && subjectId !== null;

  if (isEditing && isLoadingAssignment) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0ea340" />
          <Text className="text-slate-400 mt-4">Memuat tugas...</Text>
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
        <Text className="text-lg font-bold text-foreground">{isEditing ? 'Edit Tugas' : 'Tambah Tugas'}</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="px-4 pt-6 gap-6">
        {/* Title */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">Judul Tugas</Text>
            <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
              <TextInput
                className="flex-1 text-lg font-medium text-[#111827]"
                placeholder="Masukkan judul tugas"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                editable={!submitting}
              />
              <FileText size={20} color="#0ea340" />
            </View>
          </View>

          {/* Subject */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">Mata Pelajaran</Text>
            <Pressable
              onPress={() => setShowSubjectPicker(true)}
              disabled={submitting || subjects.length === 0}
            >
              <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
                <Text
                  className={`flex-1 text-lg font-medium ${
                    selectedSubject ? 'text-[#111827]' : 'text-[#9ca3af]'
                  }`}
                >
                  {selectedSubject?.name ?? 'Pilih mata pelajaran'}
                </Text>
                <ChevronDown size={20} color="#9ca3af" />
              </View>
            </Pressable>
          </View>

          {/* Due Date */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">Tanggal Tenggat</Text>
            <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
              <TextInput
                className="flex-1 text-lg font-medium text-[#111827]"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={dateInput}
                onChangeText={(text) => {
                  setDateInput(text);
                  const parsed = new Date(text);
                  if (!isNaN(parsed.getTime())) {
                    const [hours, minutes] = timeInput.split(':');
                    parsed.setHours(parseInt(hours || '23'), parseInt(minutes || '59'));
                    setDueDate(parsed);
                  }
                }}
                editable={!submitting}
              />
              <Calendar size={20} color="#0ea340" />
            </View>
          </View>

          {/* Due Time */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">Waktu Tenggat</Text>
            <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
              <TextInput
                className="flex-1 text-lg font-medium text-[#111827]"
                placeholder="HH:MM"
                placeholderTextColor="#9ca3af"
                value={timeInput}
                onChangeText={(text) => {
                  setTimeInput(text);
                  const [hours, minutes] = text.split(':');
                  if (hours && minutes) {
                    const newDate = new Date(dueDate);
                    newDate.setHours(parseInt(hours), parseInt(minutes));
                    setDueDate(newDate);
                  }
                }}
                editable={!submitting}
              />
            </View>
          </View>

          {/* Description */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">Deskripsi (Opsional)</Text>
            <View className="rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4 py-3">
              <TextInput
                className="text-base font-medium text-[#111827] min-h-[100]"
                placeholder="Tambahkan deskripsi tugas..."
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>
          </View>
      </View>
      {/* Submit Button */}
      <View className="px-4 pb-8 pt-4 border-t border-gray-200">
        <Button
          onPress={handleSubmit}
          disabled={!isValid || submitting || createMutation.isPending || updateMutation.isPending}
          className="w-full h-14 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Text className="text-lg font-bold tracking-tight" style={{ color: '#0a2e16' }}>
            {submitting || createMutation.isPending || updateMutation.isPending
              ? 'Menyimpan...'
              : isEditing ? 'Perbarui Tugas' : 'Simpan Tugas'}
          </Text>
        </Button>
      </View>

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setShowSubjectPicker(false)}
        />
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
            renderItem={({ item }: { item: any }) => (
              <Pressable
                onPress={() => {
                  setSubjectId(item.id);
                  setShowSubjectPicker(false);
                }}
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
                <Text className="text-slate-400">Tidak ada mata pelajaran</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
