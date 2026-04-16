import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/api';
import { Stack, router } from 'expo-router';
import { ArrowLeft, BookOpen } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { View, Pressable, TextInput } from '@/tw';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function NewSubjectScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');

  const createMutation = useMutation({
    ...orpc.subjectMaterials.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.subjectMaterials.getAll.queryOptions({ input: { limit: 50 } }).queryKey,
      });
      router.back();
      Alert.alert('Berhasil', 'Mata pelajaran berhasil ditambahkan!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Gagal menambahkan mata pelajaran.');
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama mata pelajaran wajib diisi.');
      return;
    }
    createMutation.mutate({ name: name.trim() });
  };

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
        <Text className="text-lg font-bold text-foreground">Tambah Mata Pelajaran</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="px-4 pt-8 gap-6">
        <View className="gap-1">
          <Text className="text-sm font-semibold text-[#111827] ml-1">Nama Mata Pelajaran</Text>
          <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
            <TextInput
              className="flex-1 text-lg font-medium text-[#111827]"
              placeholder="Contoh: Matematika"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              editable={!createMutation.isPending}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <BookOpen size={20} color="#0ea340" />
          </View>
        </View>
      </View>

      <View className="px-4 pb-8 pt-4 mt-auto border-t border-gray-200">
        <Button
          onPress={handleSubmit}
          disabled={!name.trim() || createMutation.isPending}
          className="w-full h-14 rounded-xl"
        >
          <Text className="text-lg font-bold tracking-tight" style={{ color: '#0a2e16' }}>
            {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
