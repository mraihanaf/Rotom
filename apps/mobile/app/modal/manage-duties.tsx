import { Stack, router } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, Users } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { View, Pressable, Text } from '@/tw';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { useUserRole } from '@/lib/hooks/useUserRole';

// Types
const STATUS_OPTIONS = ['SCHEDULED', 'COMPLETED', 'MISSED', 'EXCUSED'] as const;
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

export default function ManageDutiesScreen() {
  const queryClient = useQueryClient();
  const { canWrite } = useUserRole();
  const [activeTab, setActiveTab] = React.useState<'types' | 'assignments' | 'status'>('types');

  // Queries
  const { data: dutyTypes, isPending: typesLoading } = useQuery(
    orpc.duty.getAllDutyTypes.queryOptions()
  );
  const { data: weekDuties, isPending: dutiesLoading } = useQuery(
    orpc.duty.getWeekDuties.queryOptions({ input: {} })
  );
  const { data: usersData } = useQuery(
    orpc.users.getAll.queryOptions({ input: {} })
  );

  // Mutations
  const createTypeMutation = useMutation({
    ...orpc.duty.createDutyType.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.duty.getAllDutyTypes.queryOptions().queryKey });
    },
  });

  const deleteTypeMutation = useMutation({
    ...orpc.duty.deleteDutyType.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.duty.getAllDutyTypes.queryOptions().queryKey });
    },
  });

  const createScheduleMutation = useMutation({
    ...orpc.duty.createDutySchedule.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.duty.getWeekDuties.queryOptions({ input: {} }).queryKey });
    },
  });

  const deleteScheduleMutation = useMutation({
    ...orpc.duty.deleteDutySchedule.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.duty.getWeekDuties.queryOptions({ input: {} }).queryKey });
    },
  });

  const updateStatusMutation = useMutation({
    ...orpc.duty.updateDutyStatus.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.duty.getWeekDuties.queryOptions({ input: {} }).queryKey });
    },
  });

  const canManage = canWrite('duty');

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
        <Text className="text-lg font-bold text-foreground">Kelola Piket</Text>
        <View className="h-10 w-10" />
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        {(['types', 'assignments', 'status'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 ${activeTab === tab ? 'border-b-2 border-primary' : ''}`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                activeTab === tab ? 'text-emerald-700' : 'text-gray-500'
              }`}
            >
              {tab === 'types' ? 'Tugas' : tab === 'assignments' ? 'Penugasan' : 'Status'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'types' && (
          <TypesTab
            dutyTypes={dutyTypes || []}
            loading={typesLoading}
            canManage={canManage}
            onCreate={(data) => createTypeMutation.mutate(data)}
            onDelete={(id) => deleteTypeMutation.mutate({ id })}
          />
        )}
        {activeTab === 'assignments' && (
          <AssignmentsTab
            dutyTypes={dutyTypes || []}
            weekDuties={weekDuties?.week || []}
            users={usersData?.items || []}
            loading={dutiesLoading}
            canManage={canManage}
            onCreate={(data) => createScheduleMutation.mutate(data)}
            onDelete={(id) => deleteScheduleMutation.mutate({ id })}
          />
        )}
        {activeTab === 'status' && (
          <StatusTab
            weekDuties={weekDuties?.week || []}
            canManage={canManage}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Types Tab Component
function TypesTab({
  dutyTypes,
  loading,
  canManage,
  onCreate,
  onDelete,
}: {
  dutyTypes: any[];
  loading: boolean;
  canManage: boolean;
  onCreate: (data: { name: string; category: 'CLEANING' | 'MBG' }) => void;
  onDelete: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newCategory, setNewCategory] = React.useState<'CLEANING' | 'MBG'>('CLEANING');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onCreate({ name: newName.trim(), category: newCategory });
    setNewName('');
    setShowAdd(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#13ec5b" />
      </View>
    );
  }

  return (
    <View className="gap-4">
      {canManage && (
        <Pressable
          onPress={() => setShowAdd(true)}
          className="flex-row items-center justify-center gap-2 bg-primary py-3 rounded-xl"
        >
          <Plus size={20} color="#0a2e16" />
          <Text className="font-semibold text-[#0a2e16]">Tambah Tugas</Text>
        </Pressable>
      )}

      {showAdd && canManage && (
        <View className="bg-white border border-gray-200 rounded-xl p-4 gap-3">
          <Text className="text-sm font-semibold text-[#111827]">Tugas Baru</Text>
          <TextInput
            className="h-12 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4 text-base font-medium text-[#111827]"
            placeholder="Nama tugas (e.g., Piket Kebersihan)"
            value={newName}
            onChangeText={setNewName}
          />
          <View className="flex-row gap-2">
            {(['CLEANING', 'MBG'] as const).map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setNewCategory(cat)}
                className={`flex-1 py-2 rounded-lg border ${
                  newCategory === cat ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    newCategory === cat ? 'text-[#0a2e16]' : 'text-gray-600'
                  }`}
                >
                  {cat === 'CLEANING' ? 'Kebersihan' : 'MBG'}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={() => setShowAdd(false)}
              className="flex-1 py-2 rounded-lg bg-gray-100"
            >
              <Text className="text-center font-semibold text-gray-600">Batal</Text>
            </Pressable>
            <Pressable onPress={handleAdd} className="flex-1 py-2 rounded-lg bg-primary">
              <Text className="text-center font-semibold text-[#0a2e16]">Simpan</Text>
            </Pressable>
          </View>
        </View>
      )}

      {dutyTypes.map((type) => (
        <View
          key={type.id}
          className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-100"
        >
          <View
            className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
              type.category === 'CLEANING' ? 'bg-blue-100' : 'bg-orange-100'
            }`}
          >
            <Text className={`text-xs font-bold ${type.category === 'CLEANING' ? 'text-blue-600' : 'text-orange-600'}`}>
              {type.category === 'CLEANING' ? 'K' : 'M'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-[#111827]">{type.name}</Text>
            <Text className="text-xs text-gray-500">
              {type.category === 'CLEANING' ? 'Kebersihan' : 'MBG'}
            </Text>
          </View>
          {canManage && (
            <Pressable
              onPress={() =>
                Alert.alert('Hapus Tugas', `Yakin ingin menghapus "${type.name}"?`, [
                  { text: 'Batal', style: 'cancel' },
                  { text: 'Hapus', style: 'destructive', onPress: () => onDelete(type.id) },
                ])
              }
              className="w-9 h-9 rounded-full items-center justify-center"
            >
              <Trash2 size={16} color="#ef4444" />
            </Pressable>
          )}
        </View>
      ))}

      {dutyTypes.length === 0 && (
        <View className="items-center py-16">
          <Text className="text-slate-400 text-sm">Belum ada tugas piket.</Text>
        </View>
      )}
    </View>
  );
}

// Assignments Tab Component
function AssignmentsTab({
  dutyTypes,
  weekDuties,
  users,
  loading,
  canManage,
  onCreate,
  onDelete,
}: {
  dutyTypes: any[];
  weekDuties: any[];
  users: any[];
  loading: boolean;
  canManage: boolean;
  onCreate: (data: { dutyTypeId: string; userId: string; dayOfWeek: number }) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [selectedType, setSelectedType] = React.useState('');
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  const [showUserSelect, setShowUserSelect] = React.useState(false);

  const dayDuties = weekDuties.find((d) => d.dayOfWeek === selectedDay)?.duties || [];

  // Get already assigned user IDs for this day and type
  const assignedUserIds = dayDuties
    .filter((d: any) => d.dutyType?.id === selectedType)
    .map((d: any) => d.user?.id);

  // Filter out already assigned users
  const availableUsers = users.filter((u) => !assignedUserIds.includes(u.id));

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => {
    setSelectedUsers(availableUsers.map((u) => u.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const handleAssign = () => {
    if (!selectedType || selectedUsers.length === 0) return;
    // Create assignment for each selected user
    selectedUsers.forEach((userId) => {
      onCreate({ dutyTypeId: selectedType, userId, dayOfWeek: selectedDay });
    });
    setSelectedUsers([]);
    setShowUserSelect(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#13ec5b" />
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* Day Selector */}
      <View className="flex-row bg-gray-200 rounded-xl p-1">
        {[1, 2, 3, 4, 5].map((day, i) => (
          <Pressable
            key={day}
            onPress={() => setSelectedDay(day)}
            className={`flex-1 py-2 rounded-lg ${selectedDay === day ? 'bg-white shadow-sm' : ''}`}
          >
            <Text
              className={`text-center text-xs font-semibold ${
                selectedDay === day ? 'text-emerald-700' : 'text-gray-500'
              }`}
            >
              {DAYS[i].slice(0, 3)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Assignment Form */}
      {canManage && (
        <View className="bg-white border border-gray-200 rounded-xl p-4 gap-3">
          <Text className="text-sm font-semibold text-[#111827]">Tambah Penugasan</Text>

          {/* Duty Type Select */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {dutyTypes.map((type) => (
              <Pressable
                key={type.id}
                onPress={() => setSelectedType(type.id)}
                className={`px-3 py-2 rounded-lg border ${
                  selectedType === type.id ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${selectedType === type.id ? 'text-[#0a2e16]' : 'text-gray-600'}`}
                >
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Select Students Button */}
          <Pressable
            onPress={() => setShowUserSelect(true)}
            disabled={!selectedType}
            className={`py-3 rounded-lg border ${!selectedType ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}
          >
            <Text className={`text-center font-medium ${!selectedType ? 'text-gray-400' : 'text-gray-700'}`}>
              {selectedUsers.length > 0 ? `${selectedUsers.length} siswa dipilih` : 'Pilih Siswa'}
            </Text>
          </Pressable>

          {/* User Multi-Select Modal */}
          {showUserSelect && selectedType && (
            <View className="bg-gray-50 rounded-xl p-3 gap-2">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sm font-semibold text-gray-700">Pilih Siswa</Text>
                <View className="flex-row gap-2">
                  <Pressable onPress={selectAll} className="px-2 py-1">
                    <Text className="text-xs text-emerald-600 font-medium">Pilih Semua</Text>
                  </Pressable>
                  <Pressable onPress={clearSelection} className="px-2 py-1">
                    <Text className="text-xs text-red-500 font-medium">Batal</Text>
                  </Pressable>
                </View>
              </View>

              <ScrollView className="max-h-48" showsVerticalScrollIndicator={true}>
                <View className="gap-1">
                  {availableUsers.map((user) => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                      <Pressable
                        key={user.id}
                        onPress={() => toggleUser(user.id)}
                        className={`flex-row items-center gap-3 px-3 py-2.5 rounded-lg ${
                          isSelected ? 'bg-primary/20' : 'bg-white'
                        }`}
                      >
                        <View
                          className={`w-5 h-5 rounded border ${
                            isSelected ? 'bg-[#0ea340] border-[#0ea340]' : 'border-gray-300 bg-white'
                          } items-center justify-center`}
                        >
                          {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                        </View>
                        <Text
                          className={`text-sm font-medium ${isSelected ? 'text-[#0a2e16]' : 'text-gray-700'}`}
                        >
                          {user.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              <Pressable
                onPress={() => setShowUserSelect(false)}
                className="mt-2 py-2 bg-white border border-gray-200 rounded-lg"
              >
                <Text className="text-center text-sm font-medium text-gray-600">Selesai</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={handleAssign}
            disabled={!selectedType || selectedUsers.length === 0}
            className={`py-3 rounded-lg ${!selectedType || selectedUsers.length === 0 ? 'bg-gray-200' : 'bg-primary'}`}
          >
            <Text className={`text-center font-semibold ${!selectedType || selectedUsers.length === 0 ? 'text-gray-400' : 'text-[#0a2e16]'}`}>
              Tugaskan {selectedUsers.length > 0 && `(${selectedUsers.length})`}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Current Assignments */}
      <Text className="text-sm font-semibold text-gray-700 mt-2">
        Penugasan {DAYS[selectedDay - 1]}
      </Text>

      {dayDuties.map((duty) => (
        <View
          key={duty.id}
          className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-100"
        >
          <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center mr-3">
            <Users size={16} color="#0ea340" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-[#111827]">{duty.user?.name}</Text>
            <Text className="text-xs text-gray-500">{duty.dutyType?.name}</Text>
          </View>
          {canManage && (
            <Pressable
              onPress={() =>
                Alert.alert('Hapus Penugasan', `Hapus ${duty.user?.name} dari ${duty.dutyType?.name}?`, [
                  { text: 'Batal', style: 'cancel' },
                  { text: 'Hapus', style: 'destructive', onPress: () => onDelete(duty.id) },
                ])
              }
              className="w-9 h-9 rounded-full items-center justify-center"
            >
              <Trash2 size={16} color="#ef4444" />
            </Pressable>
          )}
        </View>
      ))}

      {dayDuties.length === 0 && (
        <View className="items-center py-8">
          <Text className="text-slate-400 text-sm">Belum ada penugasan untuk hari ini.</Text>
        </View>
      )}
    </View>
  );
}

// Status Tab Component
function StatusTab({
  weekDuties,
  canManage,
  onUpdateStatus,
}: {
  weekDuties: any[];
  canManage: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const today = new Date().getDay();
  const todayIndex = today >= 1 && today <= 5 ? today - 1 : 0;
  const [selectedDay, setSelectedDay] = React.useState(today);

  const dayDuties = weekDuties.find((d) => d.dayOfWeek === selectedDay)?.duties || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'MISSED':
        return 'bg-red-100 text-red-700';
      case 'EXCUSED':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <View className="gap-4">
      {/* Day Selector */}
      <View className="flex-row bg-gray-200 rounded-xl p-1">
        {[1, 2, 3, 4, 5].map((day, i) => (
          <Pressable
            key={day}
            onPress={() => setSelectedDay(day)}
            className={`flex-1 py-2 rounded-lg ${selectedDay === day ? 'bg-white shadow-sm' : ''}`}
          >
            <Text
              className={`text-center text-xs font-semibold ${
                selectedDay === day ? 'text-emerald-700' : 'text-gray-500'
              }`}
            >
              {DAYS[i].slice(0, 3)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Status List */}
      <Text className="text-sm font-semibold text-gray-700 mt-2">
        Status Piket {DAYS[selectedDay - 1]}
      </Text>

      {dayDuties.map((duty) => (
        <View
          key={duty.id}
          className="bg-white rounded-xl px-4 py-3 border border-gray-100"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-base font-semibold text-[#111827]">{duty.user?.name}</Text>
              <Text className="text-xs text-gray-500">{duty.dutyType?.name}</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${getStatusColor(duty.status)}`}>
              <Text className="text-xs font-semibold">{duty.status}</Text>
            </View>
          </View>

          {canManage && (
            <View className="flex-row gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => onUpdateStatus(duty.id, status)}
                  className={`flex-1 py-2 rounded-lg border ${
                    duty.status === status ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-semibold ${
                      duty.status === status ? 'text-[#0a2e16]' : 'text-gray-600'
                    }`}
                  >
                    {status === 'SCHEDULED' ? 'Dijadwalkan' : status === 'COMPLETED' ? 'Selesai' : status === 'MISSED' ? 'Tidak Hadir' : 'Izin'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}

      {dayDuties.length === 0 && (
        <View className="items-center py-8">
          <Text className="text-slate-400 text-sm">Belum ada penugasan untuk hari ini.</Text>
        </View>
      )}
    </View>
  );
}
