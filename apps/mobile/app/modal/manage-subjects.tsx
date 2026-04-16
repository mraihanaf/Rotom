import { Text } from '@/components/ui/text';
import { orpc } from '@/lib/api';
import { Stack, router } from 'expo-router';
import { ArrowLeft, BookOpen, Plus, Trash2, Pencil, X, Check } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ActivityIndicator } from 'react-native';
import { View, Pressable, TextInput, ScrollView } from '@/tw';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Subject = { id: string; name: string };

export default function ManageSubjectsScreen() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');

  const { data, isPending, isError, error } = useQuery(
    orpc.subjectMaterials.getAll.queryOptions({ input: { limit: 50 } }),
  );
  const subjects = data?.items ?? [];

  // Debug logging
  React.useEffect(() => {
    console.log('[ManageSubjects] data:', data);
    console.log('[ManageSubjects] subjects:', subjects);
    console.log('[ManageSubjects] isError:', isError, 'error:', error);
  }, [data, subjects, isError, error]);

  const createMutation = useMutation({
    ...orpc.subjectMaterials.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.subjectMaterials.getAll.queryOptions({ input: { limit: 50 } }).queryKey,
      });
      setNewName('');
      setShowAdd(false);
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Gagal menambahkan mata pelajaran.');
    },
  });

  const updateMutation = useMutation({
    ...orpc.subjectMaterials.updateById.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.subjectMaterials.getAll.queryOptions({ input: { limit: 50 } }).queryKey,
      });
      setEditingId(null);
      setEditName('');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Gagal mengubah mata pelajaran.');
    },
  });

  const deleteMutation = useMutation({
    ...orpc.subjectMaterials.deleteById.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.subjectMaterials.getAll.queryOptions({ input: { limit: 50 } }).queryKey,
      });
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Gagal menghapus mata pelajaran.');
    },
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim() });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Hapus Mata Pelajaran',
      `Yakin ingin menghapus "${name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ id }),
        },
      ],
    );
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setEditName(subject.name);
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim()) return;
    updateMutation.mutate({ id: editingId, name: editName.trim() });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8f6]" edges={['top']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />

      {/* Header */}
      <View className="flex-row items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">Kelola Mata Pelajaran</Text>
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full bg-primary"
          onPress={() => setShowAdd((v) => !v)}
        >
          <Plus size={20} color="#0a2e16" />
        </Pressable>
      </View>

      {/* Add form */}
      {showAdd && (
        <View className="bg-white border-b border-gray-100 px-4 py-4 gap-3">
          <Text className="text-sm font-semibold text-[#111827]">Mata Pelajaran Baru</Text>
          <View className="flex-row items-center h-12 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4 gap-3">
            <TextInput
              className="flex-1 text-base font-medium text-[#111827]"
              placeholder="Nama mata pelajaran"
              placeholderTextColor="#9ca3af"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              editable={!createMutation.isPending}
            />
          </View>
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 h-11 rounded-xl bg-gray-100 items-center justify-center"
              onPress={() => { setShowAdd(false); setNewName(''); }}
            >
              <Text className="text-sm font-semibold text-gray-600">Batal</Text>
            </Pressable>
            <Pressable
              className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"
              onPress={handleAdd}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="#0a2e16" />
              ) : (
                <Text className="text-sm font-bold" style={{ color: '#0a2e16' }}>Tambah</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#13ec5b" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-500 text-center mb-2">Failed to load subjects</Text>
          <Text className="text-slate-400 text-sm text-center mb-4">{error?.message ?? 'Unknown error'}</Text>
          <Pressable
            className="bg-primary px-4 py-2 rounded-xl"
            onPress={() => queryClient.invalidateQueries({ queryKey: orpc.subjectMaterials.getAll.queryOptions({ input: { limit: 50 } }).queryKey })}
          >
            <Text className="text-sm font-bold" style={{ color: '#0a2e16' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          <View className="px-4 pt-4 gap-3">
            {subjects.length === 0 && (
              <View className="items-center py-16">
                <Text className="text-slate-400 text-sm">Belum ada mata pelajaran.</Text>
              </View>
            )}
            {subjects.map((s) => (
              <View
                key={s.id}
                className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-100"
              >
                {editingId === s.id ? (
                  <>
                    <View className="flex-1 flex-row items-center gap-2">
                      <TextInput
                        className="flex-1 h-10 rounded-lg bg-[#f3f4f6] border border-[#e5e7eb] px-3 text-base font-medium text-[#111827]"
                        value={editName}
                        onChangeText={setEditName}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleUpdate}
                      />
                    </View>
                    <Pressable
                      className="w-9 h-9 rounded-full items-center justify-center ml-2"
                      onPress={cancelEdit}
                    >
                      <X size={18} color="#6b7280" />
                    </Pressable>
                    <Pressable
                      className="w-9 h-9 rounded-full items-center justify-center bg-primary/10 ml-1"
                      onPress={handleUpdate}
                      disabled={!editName.trim() || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <ActivityIndicator size="small" color="#0ea340" />
                      ) : (
                        <Check size={18} color="#0ea340" />
                      )}
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center mr-3">
                      <BookOpen size={18} color="#0ea340" />
                    </View>
                    <Text className="flex-1 text-base font-semibold text-[#111827]">{s.name}</Text>
                    <Pressable
                      className="w-9 h-9 rounded-full items-center justify-center"
                      onPress={() => handleEdit(s)}
                    >
                      <Pencil size={16} color="#6b7280" />
                    </Pressable>
                    <Pressable
                      className="w-9 h-9 rounded-full items-center justify-center"
                      onPress={() => handleDelete(s.id, s.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </Pressable>
                  </>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
