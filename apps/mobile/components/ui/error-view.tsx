import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';

interface ErrorViewProps {
  /** Optional error detail to show below the heading */
  message?: string;
  /** Called when the user taps "Coba Lagi" (Retry) */
  onRetry: () => void;
}

/**
 * Full-screen centered error state with a retry button.
 * Designed to replace the loading/content area when a query fails.
 */
export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
        <AlertTriangle size={28} color="#ef4444" />
      </View>
      <Text className="text-lg font-bold text-foreground mb-1">
        Terjadi Kesalahan
      </Text>
      <Text className="text-sm text-slate-500 text-center mb-6">
        {message ?? 'Gagal memuat data. Silakan coba lagi.'}
      </Text>
      <Pressable
        onPress={onRetry}
        className="flex-row items-center gap-2 rounded-xl bg-primary px-6 py-3"
        style={{
          elevation: 4,
          shadowColor: 'rgba(19,236,91,0.3)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
        }}
      >
        <RefreshCw size={18} color="#0a2e16" />
        <Text className="text-sm font-bold" style={{ color: '#0a2e16' }}>
          Coba Lagi
        </Text>
      </Pressable>
    </View>
  );
}
