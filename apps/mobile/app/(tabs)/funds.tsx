import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Text } from '@/components/ui/text';
import { ErrorView } from '@/components/ui/error-view';
import { Stack } from 'expo-router';
import {
  Settings,
  TrendingUp,
  Eye,
  Banknote,
  ArrowRight,
  Plus,
  Check,
  ArrowDown,
} from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, View, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { router } from 'expo-router';

function formatCurrency(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatRelativeDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    return `Hari Ini, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffDays === 1) return 'Kemarin';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function FundsScreen() {
  const { canWrite } = useUserRole();
  const [tab, setTab] = React.useState<'income' | 'expense'>('income');

  const { data: fund, isPending: fundLoading, isError: fundError, refetch: refetchFund } = useQuery(orpc.funds.getFund.queryOptions());
  const { data: contributions, isPending: contribLoading, isError: contribError, refetch: refetchContrib } = useQuery(
    orpc.funds.getAllContributions.queryOptions({ input: { limit: 50 } }),
  );

  const isPending = fundLoading || contribLoading;
  const isError = fundError || contribError;
  const items = contributions?.items ?? [];
  const incomeItems = items.filter((c) => c.type === 'INCOME');
  const expenseItems = items.filter((c) => c.type === 'EXPENSE');
  const totalIncome = incomeItems.reduce((sum, c) => sum + c.amount, 0);
  const totalExpense = expenseItems.reduce((sum, c) => sum + c.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const contributorCount = new Set(incomeItems.map((c) => c.contributor.id)).size;

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFund(), refetchContrib()]);
    setRefreshing(false);
  }, [refetchFund, refetchContrib]);

  return (
    <AnimatedTabScreen>
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" style={{ flex: 1 }} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

  
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#13ec5b" />
        </View>
      ) : isError ? (
        <ErrorView onRetry={onRefresh} />
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
          {/* Balance */}
          <View className="items-center pt-8 pb-6 px-4">
            <Text className="text-slate-500 text-sm font-bold uppercase mb-2 tracking-wider">
              Total Saldo Saat Ini
            </Text>
            <View className="flex-row items-center gap-3">
              <Text className="font-bold text-[#111827]" style={{ fontSize: 40, lineHeight: 44 }}>
                {formatCurrency(fund?.totalAmount ?? 0)}
              </Text>
              <Pressable>
                <Eye size={20} color="#94a3b8" />
              </Pressable>
            </View>
          </View>

          {/* Cash Flow */}
          <View className="px-4 mb-6">
            <View className="bg-white rounded-2xl p-5 border border-slate-200">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-base font-bold text-[#111827]">Cash Flow</Text>
                  <Text className="text-slate-500 text-xs">
                    {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-6">
                {/* Donut chart */}
                <View className="w-24 h-24 items-center justify-center">
                  <View
                    className="w-24 h-24 rounded-full items-center justify-center"
                    style={{
                      borderWidth: 10,
                      borderColor: '#13ec5b',
                      borderTopColor: '#f1f5f9',
                    }}
                  >
                    <Text className="text-xl font-bold text-[#111827]">{contributorCount}</Text>
                    <Text className="text-[9px] text-slate-500 uppercase tracking-wider">
                      Members
                    </Text>
                  </View>
                </View>

                <View className="flex-1 gap-3">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-primary" />
                      <Text className="text-sm text-slate-600">Pemasukan</Text>
                    </View>
                    <Text className="text-sm font-bold text-[#111827]">{formatCurrency(totalIncome)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-red-500" />
                      <Text className="text-sm text-slate-600">Pengeluaran</Text>
                    </View>
                    <Text className="text-sm font-bold text-red-600">-{formatCurrency(totalExpense)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center pt-2 border-t border-slate-100">
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-blue-500" />
                      <Text className="text-sm text-slate-600">Saldo</Text>
                    </View>
                    <Text className="text-sm font-bold text-[#111827]">{formatCurrency(fund?.totalAmount ?? 0)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Recent activity */}
          <View className="px-4 mb-2">
            <View className="flex-row justify-between items-end mb-3">
              <Text className="text-base font-bold text-[#111827]">Aktivitas Terbaru</Text>
              <Pressable className="flex-row items-center gap-1">
                <Text className="text-green-600 text-xs font-bold">Lihat Semua</Text>
                <ArrowRight size={14} color="#16a34a" />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3 pb-2">
                {items.slice(0, 5).map((c) => (
                  <View
                    key={c.id}
                    className="w-[200px] bg-white p-3 rounded-xl border border-slate-200"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className={`p-1.5 rounded-lg ${c.type === 'EXPENSE' ? 'bg-red-100' : 'bg-primary/20'}`}>
                        <Banknote size={18} color={c.type === 'EXPENSE' ? '#dc2626' : '#15803d'} />
                      </View>
                      <Text className="text-[10px] text-slate-400">{formatRelativeDate(c.createdAt)}</Text>
                    </View>
                    <Text className="text-sm font-bold text-[#111827]" numberOfLines={1}>
                      {c.type === 'EXPENSE' ? c.note || 'Pengeluaran' : `Iuran: ${c.contributor.name}`}
                    </Text>
                    <Text className={`text-xs font-bold mt-1 ${c.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                      {c.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(c.amount)}
                    </Text>
                  </View>
                ))}
                {items.length === 0 && (
                  <Text className="text-slate-400 text-sm py-4">Belum ada aktivitas.</Text>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Spacer */}
          <View className="h-4" />

          {/* Contributions list */}
          <View className="bg-white rounded-t-[32px] border-t border-slate-200">
            <View className="flex-row px-4 pt-2">
              <Pressable
                onPress={() => setTab('income')}
                className={`flex-1 items-center py-4 border-b-[3px] ${
                  tab === 'income' ? 'border-b-primary' : 'border-b-transparent'
                }`}
              >
                <View className="flex-row items-center gap-1.5">
                  <Text
                    className={`text-sm font-bold ${
                      tab === 'income' ? 'text-[#111827]' : 'text-slate-400'
                    }`}
                  >
                    Pemasukan
                  </Text>
                  <View className={`px-1.5 py-0.5 rounded ${tab === 'income' ? 'bg-primary/20' : 'bg-slate-100'}`}>
                    <Text className={`text-[10px] font-bold ${tab === 'income' ? 'text-green-700' : 'text-slate-500'}`}>
                      {incomeItems.length}
                    </Text>
                  </View>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setTab('expense')}
                className={`flex-1 items-center py-4 border-b-[3px] ${
                  tab === 'expense' ? 'border-b-red-500' : 'border-b-transparent'
                }`}
              >
                <View className="flex-row items-center gap-1.5">
                  <Text
                    className={`text-sm font-bold ${
                      tab === 'expense' ? 'text-red-600' : 'text-slate-400'
                    }`}
                  >
                    Pengeluaran
                  </Text>
                  <View className={`px-1.5 py-0.5 rounded ${tab === 'expense' ? 'bg-red-100' : 'bg-slate-100'}`}>
                    <Text className={`text-[10px] font-bold ${tab === 'expense' ? 'text-red-700' : 'text-slate-500'}`}>
                      {expenseItems.length}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <View className="p-4 gap-3">
              {(tab === 'income' ? incomeItems : expenseItems).map((c) => (
                <View
                  key={c.id}
                  className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="relative">
                      {c.contributor.image ? (
                        <Image
                          source={{ uri: c.contributor.image }}
                          className="w-10 h-10 rounded-full"
                          style={{ borderWidth: 1, borderColor: '#e2e8f0' }}
                        />
                      ) : (
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{
                            borderWidth: 1,
                            borderColor: '#e2e8f0',
                            backgroundColor: '#8b5cf6',
                          }}
                        >
                          <Text className="text-white font-bold text-xs">
                            {getInitials(c.contributor.name)}
                          </Text>
                        </View>
                      )}
                      <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary items-center justify-center" style={{ borderWidth: 2, borderColor: '#fff' }}>
                        <Check size={8} color="#112217" strokeWidth={3} />
                      </View>
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-[#111827]">{c.contributor.name}</Text>
                      <Text className="text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded ${c.type === 'INCOME' ? 'bg-primary/10' : 'bg-red-100'}`}>
                    <Text className={`text-xs font-bold ${c.type === 'INCOME' ? 'text-green-700' : 'text-red-700'}`}>
                      {c.type === 'EXPENSE' ? '-' : ''}{formatCurrency(c.amount)}
                    </Text>
                  </View>
                </View>
              ))}

              {(tab === 'income' ? incomeItems : expenseItems).length === 0 && (
                <View className="items-center py-8">
                  <Text className="text-slate-400 text-sm">
                    {tab === 'income' ? 'Belum ada pemasukan.' : 'Belum ada pengeluaran.'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* FAB — only for maintainer/admin */}
      {canWrite('funds') && (
        <View className="absolute bottom-6 right-4 z-50">
          <Pressable
            className="flex-row items-center gap-2 bg-primary px-5 py-4 rounded-full"
            style={{ elevation: 8, shadowColor: 'rgba(19,236,91,0.3)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20 }}
            onPress={() => router.push('/modal/new-contribution' as any)}
          >
            <Plus size={20} color="#102216" strokeWidth={2.5} />
            <Text className="font-bold text-sm" style={{ color: '#102216' }}>
              Transaksi
            </Text>
          </Pressable>
        </View>
      )}
      </SafeAreaView>
    </AnimatedTabScreen>
  );
}
