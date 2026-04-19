import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import { Stack, router } from 'expo-router';
import { ArrowRight, Smartphone } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { View, ScrollView, TextInput } from '@/tw';
import { Image } from 'expo-image';

export default function LoginScreen() {
  const [countryCode, setCountryCode] = React.useState('+62');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
  const isValid = phoneNumber.replace(/\D/g, '').length >= 9;

  const handleGetCode = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    const { error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: fullPhone,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message ?? 'Failed to send OTP. Please try again.');
      return;
    }

    router.push({
      pathname: '/auth/otp',
      params: { phone: fullPhone },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Login', headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="min-h-full justify-center items-center p-4"
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full max-w-[400px]">
              <View className="items-center justify-center py-2">
                <View className="w-48 h-48 rounded-2xl overflow-hidden bg-white">
                  <Image
                    source={require('../../assets/hero.jpg')}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
                  />
                </View>
              </View>

              <View className="gap-2 px-2">
                <Text className="text-4xl font-extrabold tracking-tight text-center text-[#111827]">
                  Welcome to Rotom
                </Text>
                <Text className="text-base font-medium text-[#6b7280] text-center px-4 leading-relaxed">
                  Enter your WhatsApp number to manage your class schedules, cash,
                  and tasks.
                </Text>
              </View>

              <View className="gap-5 pt-4">
                <View className="gap-1">
                  <Text className="text-sm font-semibold text-[#111827] ml-1">
                    WhatsApp Number
                  </Text>
                  <View className="flex-row gap-3">
                    <TextInput
                      className="w-[88px] h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] text-[#111827] text-lg font-medium text-center"
                      placeholder="+62"
                      placeholderTextColor="#9ca3af"
                      value={countryCode}
                      onChangeText={setCountryCode}
                      keyboardType="phone-pad"
                    />
                    <View className="flex-1 relative">
                      <TextInput
                        className="w-full h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] text-[#111827] text-lg font-medium px-4"
                        placeholder="(555) 000-0000"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                      />
                      <View className="absolute right-4 top-0 bottom-0 justify-center pointer-events-none">
                        <Smartphone size={20} color="#0ea340" />
                      </View>
                    </View>
                  </View>
                </View>

                <Button
                  onPress={handleGetCode}
                  disabled={!isValid || loading}
                  className="w-full h-14 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Text className="text-white text-lg font-bold tracking-wide">
                    {loading ? 'Sending...' : 'Get Login Code'}
                  </Text>
                  {!loading && <ArrowRight size={20} color="white" />}
                </Button>
              </View>

              <View className="pt-8 pb-6">
      
                <View className="mt-8 flex-row justify-center gap-4 opacity-30">
                  <View className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <View className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <View className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
