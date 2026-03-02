import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import {
  Settings,
  TrendingUp,
  Eye,
  Banknote,
  ShoppingCart,
  ArrowRight,
  Plus,
  Check,
  Bell,
  Clock,
} from 'lucide-react-native';
import * as React from 'react';
import { View, ScrollView, Pressable, Image } from 'react-native';

const MOCK_ACTIVITY = [
  { id: '1', title: 'Iuran: Budi Santoso', amount: 20_000, type: 'in' as const, time: 'Hari Ini, 09:41' },
  { id: '2', title: 'Beli Spidol & Penghapus', amount: 45_000, type: 'out' as const, time: 'Kemarin' },
];

const MOCK_PAID: { id: string; name: string; date: string; image?: string; initial?: string }[] = [
  { id: '1', name: 'Budi Santoso', date: 'Oct 24, 2023', image: 'https://i.pravatar.cc/100?u=budi' },
  { id: '2', name: 'Sarah Amalia', date: 'Oct 23, 2023', image: 'https://i.pravatar.cc/100?u=sarah' },
  { id: '3', name: 'Rizky Febian', date: 'Oct 22, 2023', image: 'https://i.pravatar.cc/100?u=rizky' },
  { id: '4', name: 'Dina Astuti', date: 'Oct 20, 2023', initial: 'DA' },
];

export default function FundsScreen() {
  const [tab, setTab] = React.useState<'paid' | 'unpaid'>('paid');

  return (
    <View className="flex-1 bg-[#f6f8f6]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <View>
          <Text className="text-green-600 text-xs font-semibold uppercase tracking-wider">
            Rotom App
          </Text>
          <Text className="text-lg font-bold text-[#111827]">Uang Kas Class 12-A</Text>
        </View>
        <Pressable className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
          <Settings size={20} color="#374151" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <View className="items-center pt-8 pb-6 px-4">
          <Text className="text-slate-500 text-sm font-bold uppercase mb-2 tracking-wider">
            Total Saldo Saat Ini
          </Text>
          <View className="flex-row items-center gap-3">
            <Text className="font-bold text-[#111827]" style={{ fontSize: 40, lineHeight: 44 }}>
              Rp 2.450.000
            </Text>
            <Pressable>
              <Eye size={20} color="#94a3b8" />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-2 mt-3 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <TrendingUp size={16} color="#16a34a" />
            <Text className="text-green-700 text-xs font-bold">+15% from last month</Text>
          </View>
        </View>

        {/* Cash Flow */}
        <View className="px-4 mb-6">
          <View className="bg-white rounded-2xl p-5 border border-slate-200">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-base font-bold text-[#111827]">Cash Flow</Text>
                <Text className="text-slate-500 text-xs">Oktober 2023</Text>
              </View>
              <View className="flex-row bg-slate-100 rounded-lg p-1">
                <Pressable className="px-3 py-1.5 rounded-md bg-white">
                  <Text className="text-[10px] font-bold text-[#111827]">Month</Text>
                </Pressable>
                <Pressable className="px-3 py-1.5 rounded-md">
                  <Text className="text-[10px] font-bold text-slate-400">Sem</Text>
                </Pressable>
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
                  <Text className="text-xl font-bold text-[#111827]">75%</Text>
                  <Text className="text-[9px] text-slate-500 uppercase tracking-wider">
                    Collected
                  </Text>
                </View>
              </View>

              <View className="flex-1 gap-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <Text className="text-sm text-slate-600">Pemasukan</Text>
                  </View>
                  <Text className="text-sm font-bold text-[#111827]">Rp 850k</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-red-500" />
                    <Text className="text-sm text-slate-600">Pengeluaran</Text>
                  </View>
                  <Text className="text-sm font-bold text-[#111827]">Rp 120k</Text>
                </View>
                <View className="h-px bg-slate-100 w-full my-1" />
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-slate-500">Target</Text>
                  <Text className="text-xs font-bold text-green-600">Rp 3.000.000</Text>
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
              {MOCK_ACTIVITY.map((a) => (
                <View
                  key={a.id}
                  className="w-[200px] bg-white p-3 rounded-xl border border-slate-200"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View
                      className={`p-1.5 rounded-lg ${
                        a.type === 'in' ? 'bg-primary/20' : 'bg-red-50'
                      }`}
                    >
                      {a.type === 'in' ? (
                        <Banknote size={18} color="#15803d" />
                      ) : (
                        <ShoppingCart size={18} color="#ef4444" />
                      )}
                    </View>
                    <Text className="text-[10px] text-slate-400">{a.time}</Text>
                  </View>
                  <Text className="text-sm font-bold text-[#111827]">{a.title}</Text>
                  <Text
                    className={`text-xs font-bold mt-1 ${
                      a.type === 'in' ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {a.type === 'in' ? '+' : '-'} Rp {a.amount.toLocaleString('id-ID')}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Spacer */}
        <View className="h-4" />

        {/* Tabs section */}
        <View className="bg-white rounded-t-[32px] border-t border-slate-200">
          <View className="flex-row px-4 pt-2">
            <Pressable
              onPress={() => setTab('paid')}
              className={`flex-1 items-center py-4 border-b-[3px] ${
                tab === 'paid' ? 'border-b-primary' : 'border-b-transparent'
              }`}
            >
              <View className="flex-row items-center gap-1.5">
                <Text
                  className={`text-sm font-bold ${
                    tab === 'paid' ? 'text-[#111827]' : 'text-slate-400'
                  }`}
                >
                  Sudah Bayar
                </Text>
                <View className={`px-1.5 py-0.5 rounded ${tab === 'paid' ? 'bg-primary/20' : 'bg-slate-100'}`}>
                  <Text className={`text-[10px] font-bold ${tab === 'paid' ? 'text-green-700' : 'text-slate-500'}`}>
                    15
                  </Text>
                </View>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setTab('unpaid')}
              className={`flex-1 items-center py-4 border-b-[3px] ${
                tab === 'unpaid' ? 'border-b-primary' : 'border-b-transparent'
              }`}
            >
              <View className="flex-row items-center gap-1.5">
                <Text
                  className={`text-sm font-bold ${
                    tab === 'unpaid' ? 'text-[#111827]' : 'text-slate-400'
                  }`}
                >
                  Belum Bayar
                </Text>
                <View className={`px-1.5 py-0.5 rounded ${tab === 'unpaid' ? 'bg-primary/20' : 'bg-slate-100'}`}>
                  <Text className={`text-[10px] font-bold ${tab === 'unpaid' ? 'text-green-700' : 'text-slate-500'}`}>
                    5
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          <View className="p-4 gap-3">
            {tab === 'paid' &&
              MOCK_PAID.map((p) => (
                <View
                  key={p.id}
                  className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="relative">
                      {p.image ? (
                        <Image
                          source={{ uri: p.image }}
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
                            {p.initial ?? '?'}
                          </Text>
                        </View>
                      )}
                      <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary items-center justify-center" style={{ borderWidth: 2, borderColor: '#fff' }}>
                        <Check size={8} color="#112217" strokeWidth={3} />
                      </View>
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-[#111827]">{p.name}</Text>
                      <Text className="text-xs text-slate-500">Paid on {p.date}</Text>
                    </View>
                  </View>
                  <View className="bg-primary/10 px-2 py-1 rounded">
                    <Text className="text-green-700 text-xs font-bold">Lunas</Text>
                  </View>
                </View>
              ))}

            {tab === 'paid' && (
              <>
                <View className="flex-row items-center gap-4 mt-4 mb-2">
                  <View className="h-px bg-slate-200 flex-1" />
                  <Text className="text-xs text-slate-400 font-medium">Pending Preview</Text>
                  <View className="h-px bg-slate-200 flex-1" />
                </View>

                <View className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200" style={{ opacity: 0.9 }}>
                  <View className="flex-row items-center gap-3">
                    <View className="relative">
                      <Image
                        source={{ uri: 'https://i.pravatar.cc/100?u=doni' }}
                        className="w-10 h-10 rounded-full"
                        style={{ opacity: 0.7, borderWidth: 1, borderColor: '#e2e8f0' }}
                      />
                      <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-300 items-center justify-center" style={{ borderWidth: 2, borderColor: '#fff' }}>
                        <Clock size={8} color="#374151" strokeWidth={3} />
                      </View>
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-slate-700">Doni Pratama</Text>
                      <Text className="text-xs text-red-500" style={{ fontStyle: 'italic' }}>Overdue 2 days</Text>
                    </View>
                  </View>
                  <Pressable className="w-8 h-8 rounded-full bg-white items-center justify-center" style={{ borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Bell size={18} color="#4b5563" />
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <View className="absolute bottom-6 right-4 z-50">
        <Pressable className="flex-row items-center gap-2 bg-primary px-5 py-4 rounded-full" style={{ elevation: 8, shadowColor: 'rgba(19,236,91,0.3)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20 }}>
          <Plus size={20} color="#102216" strokeWidth={2.5} />
          <Text className="font-bold text-sm" style={{ color: '#102216' }}>
            Transaksi
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
