import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const inputRefs = React.useRef<(TextInput | null)[]>([]);
  const [timer, setTimer] = React.useState(30);
  const [canResend, setCanResend] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [resending, setResending] = React.useState(false);

  React.useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6 || verifying || !phone) return;

    setVerifying(true);
    const { error } = await authClient.phoneNumber.verify({
      phoneNumber: phone,
      code,
    });

    if (error) {
      setVerifying(false);
      Alert.alert('Verification Failed', error.message ?? 'Invalid code. Please try again.');
      return;
    }

    setVerifying(false);

    // Allow Better Auth's expo client to persist the session cookie
    // to SecureStore before navigating away.
    setTimeout(() => {
      router.dismissAll();
      router.replace('/' as import('expo-router').Href);
    }, 300);
  };

  const handleResend = async () => {
    if (!canResend || resending || !phone) return;

    setResending(true);
    const { error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: phone,
    });
    setResending(false);

    if (error) {
      Alert.alert('Error', error.message ?? 'Failed to resend code.');
      return;
    }

    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
  };

  const displayPhone = phone ?? '+62 812-3456-7890';
  const timerStr = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <>
      <Stack.Screen options={{ title: 'Verify', headerShown: false }} />
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="flex-grow"
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 w-full max-w-md self-center">
              <View className="flex-row items-center p-4 pb-2">
                <Pressable
                  onPress={() => router.back()}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <ArrowLeft size={24} color="#111827" />
                </Pressable>
              </View>

              <View className="px-6 pt-6">
                <Text className="text-3xl font-extrabold tracking-tight leading-tight text-[#111827] mb-3">
                  Verify it's you
                </Text>
                <Text className="text-base font-medium text-slate-500 leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <Text className="font-semibold text-[#111827]">
                    {displayPhone}
                  </Text>{' '}
                  via WhatsApp.
                </Text>
                <View className="flex-row items-center gap-2 mt-4">
                  <MessageCircle size={18} color="#25D366" />
                  <Text
                    className="text-sm font-medium"
                    style={{ color: '#25D366' }}
                  >
                    Check your WhatsApp messages
                  </Text>
                </View>
              </View>

              <View className="px-6 pt-8">
                <View className="flex-row justify-between gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <TextInput
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      className="flex-1 max-w-14 aspect-3/4 rounded-lg border border-slate-200 bg-white text-center text-2xl font-bold text-[#111827]"
                      keyboardType="number-pad"
                      maxLength={1}
                      value={otp[i]}
                      onChangeText={(t) => handleChange(t, i)}
                      onKeyPress={(e) => handleKeyPress(e, i)}
                      placeholder="-"
                      placeholderTextColor="#9ca3af"
                      selectTextOnFocus
                      editable={!verifying}
                    />
                  ))}
                </View>
              </View>

              <View className="items-center gap-4 pt-8">
                <View className="flex-row items-center bg-slate-100 rounded-full px-4 py-2">
                  <Text className="text-sm font-medium text-[#6b7280]">
                    Resend code in{' '}
                    <Text className="font-bold text-[#111827] tabular-nums">
                      {timerStr}
                    </Text>
                  </Text>
                </View>
                <Pressable onPress={handleResend} disabled={!canResend || resending}>
                  <Text
                    className={`text-sm font-semibold ${canResend && !resending ? 'text-[#13ec5b]' : 'text-slate-400'}`}
                  >
                    {resending ? 'Sending...' : "Didn't receive it? "}
                    {!resending && (
                      <Text className="underline decoration-2 underline-offset-2">
                        Resend Code
                      </Text>
                    )}
                  </Text>
                </Pressable>
              </View>

              <View className="px-6 pb-8 pt-auto mt-auto">
                <Button
                  onPress={handleVerify}
                  disabled={otp.join('').length < 6 || verifying}
                  className="w-full h-14 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Text
                    className="text-lg font-bold tracking-tight"
                    style={{ color: '#0a2e16' }}
                  >
                    {verifying ? 'Verifying...' : 'Verify Account'}
                  </Text>
                  {!verifying && <ArrowRight size={20} color="#0a2e16" />}
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
