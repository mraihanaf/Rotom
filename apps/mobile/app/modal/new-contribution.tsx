import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/api';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Banknote, User, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

function formatCurrency(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

type TransactionType = 'INCOME' | 'EXPENSE';

export default function NewContributionScreen() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  const [type, setType] = React.useState<TransactionType>('INCOME');
  const [submitting, setSubmitting] = React.useState(false);
  const [showUserPicker, setShowUserPicker] = React.useState(false);

  const { data: usersData, isLoading: usersLoading } = useQuery(
    orpc.users?.getAll?.queryOptions({ input: { limit: 50 } }) as any
  );
  const users = (usersData as any)?.items ?? [];

  const selectedUser = users.find((u: any) => u.id === userId);

  const createMutation = useMutation({
    ...orpc.funds.createContribution.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.funds.getAllContributions.queryOptions({ input: { limit: 50 } }).queryKey });
      queryClient.invalidateQueries({ queryKey: orpc.funds.getFund.queryOptions().queryKey });
      router.back();
      Alert.alert('Success', 'Transaksi berhasil ditambahkan!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Gagal menambahkan transaksi.');
    },
  });

  const handleSubmit = async () => {
    const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    const isUserRequired = type === 'INCOME';
    if ((isUserRequired && !userId.trim()) || !parsedAmount || parsedAmount <= 0) {
      Alert.alert('Error', isUserRequired ? 'ID Pengguna dan jumlah wajib diisi.' : 'Jumlah wajib diisi.');
      return;
    }

    setSubmitting(true);
    createMutation.mutate({
      userContributorId: userId.trim() || null,
      amount: parsedAmount,
      note: note.trim() || null,
      type,
    });
    setSubmitting(false);
  };

  const isValid = (type === 'INCOME' ? userId.trim().length >= 1 : true) && amount.trim().length >= 1;

  const getInitials = (name: string) => {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters
    const numeric = text.replace(/[^0-9]/g, '');
    setAmount(numeric);
  };

  const displayAmount = amount ? formatCurrency(parseInt(amount, 10) || 0) : '';

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
        <Text className="text-lg font-bold text-foreground">Tambah Transaksi</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="px-4 pt-6 gap-6">
          {/* Transaction Type */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">Jenis Transaksi</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setType('INCOME')}
                className={`flex-1 flex-row items-center justify-center gap-2 h-14 rounded-xl border ${
                  type === 'INCOME'
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-200'
                }`}
                disabled={submitting}
              >
                <ArrowUp size={20} color={type === 'INCOME' ? '#0a2e16' : '#6b7280'} />
                <Text
                  className={`font-semibold ${
                    type === 'INCOME' ? 'text-[#0a2e16]' : 'text-gray-500'
                  }`}
                >
                  Pemasukan
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType('EXPENSE')}
                className={`flex-1 flex-row items-center justify-center gap-2 h-14 rounded-xl border ${
                  type === 'EXPENSE'
                    ? 'bg-red-500 border-red-500'
                    : 'bg-white border-gray-200'
                }`}
                disabled={submitting}
              >
                <ArrowDown size={20} color={type === 'EXPENSE' ? '#fff' : '#6b7280'} />
                <Text
                  className={`font-semibold ${
                    type === 'EXPENSE' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Pengeluaran
                </Text>
              </Pressable>
            </View>
          </View>

          {/* User Select */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">
              {type === 'EXPENSE' ? 'Pilih Anggota (Opsional)' : 'Pilih Anggota'}
            </Text>
            <Pressable
              onPress={() => setShowUserPicker(true)}
              disabled={submitting || usersLoading}
            >
              <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
                {selectedUser ? (
                  <View className="flex-row items-center gap-3 flex-1">
                    {selectedUser.image ? (
                      <Image source={{ uri: selectedUser.image }} className="w-8 h-8 rounded-full" />
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center">
                        <Text className="text-white font-bold text-xs">{getInitials(selectedUser.name)}</Text>
                      </View>
                    )}
                    <Text className="text-lg font-medium text-[#111827]">{selectedUser.name}</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-8 h-8 rounded-full bg-gray-400 items-center justify-center">
                      <Text className="text-white font-bold text-xs">-</Text>
                    </View>
                    <Text className="text-lg font-medium text-[#9ca3af]">
                      {usersLoading ? 'Memuat...' : type === 'EXPENSE' ? 'Umum' : 'Pilih anggota'}
                    </Text>
                  </View>
                )}
                <ChevronDown size={20} color="#9ca3af" />
              </View>
            </Pressable>
          </View>

          {/* Amount */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">Jumlah (Rp)</Text>
            <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
              <Text className="text-lg font-medium text-[#111827] mr-2">Rp</Text>
              <TextInput
                className="flex-1 text-lg font-medium text-[#111827]"
                placeholder="0"
                placeholderTextColor="#9ca3af"
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                editable={!submitting}
              />
              <Banknote size={20} color="#0ea340" />
            </View>
            {displayAmount && (
              <Text className="text-sm font-medium text-primary ml-1 mt-1">
                {displayAmount}
              </Text>
            )}
          </View>

          {/* Note */}
          <View className="gap-1">
            <Text className="text-sm font-semibold text-[#111827] ml-1">Catatan (Opsional)</Text>
            <View className="rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4 py-3">
              <TextInput
                className="text-base font-medium text-[#111827] min-h-[80]"
                placeholder="Tambahkan catatan transaksi..."
                placeholderTextColor="#9ca3af"
                value={note}
                onChangeText={setNote}
                multiline
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>
          </View>
      </View>

      {/* User Picker Modal */}
      <Modal
        visible={showUserPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setShowUserPicker(false)}
        />
        <View className="bg-white rounded-t-2xl max-h-[60%] pb-8">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
            <Text className="text-lg font-bold text-[#111827]">Pilih Anggota</Text>
            <Pressable onPress={() => setShowUserPicker(false)}>
              <Text className="text-base font-semibold text-[#0ea340]">Done</Text>
            </Pressable>
          </View>
          <FlatList
            data={users}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <Pressable
                onPress={() => {
                  setUserId(item.id);
                  setShowUserPicker(false);
                }}
                className="px-6 py-4 flex-row items-center gap-3 border-b border-gray-100"
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} className="w-10 h-10 rounded-full" />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center">
                    <Text className="text-white font-bold text-sm">{getInitials(item.name)}</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-base font-medium text-[#111827]">{item.name}</Text>
                </View>
                {userId === item.id && (
                  <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="px-6 py-8 items-center">
                <Text className="text-slate-400">{usersLoading ? 'Memuat...' : 'Tidak ada anggota'}</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Submit Button */}
      <View className="px-4 pb-8 pt-4 border-t border-gray-200">
        <Button
          onPress={handleSubmit}
          disabled={!isValid || submitting || createMutation.isPending}
          className={`w-full h-14 rounded-xl flex-row items-center justify-center gap-2 ${
            type === 'EXPENSE' ? 'bg-red-500' : ''
          }`}
        >
          <Text className={`text-lg font-bold tracking-tight ${type === 'EXPENSE' ? 'text-white' : ''}`} style={type === 'INCOME' ? { color: '#0a2e16' } : undefined}>
            {submitting || createMutation.isPending ? 'Menyimpan...' : `Simpan ${type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}`}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
