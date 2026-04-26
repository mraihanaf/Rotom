import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { orpc, uploadProfilePicture } from '@/lib/api';
import { Stack, router } from 'expo-router';
import { ArrowRight, Calendar, ChevronDown, User, Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
} from 'react-native';
import { View, Pressable, ScrollView, TextInput } from '@/tw';
import { useQueryClient } from '@tanstack/react-query';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function generateYears() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1950; y--) {
    years.push(y);
  }
  return years;
}

type PickerField = 'month' | 'day' | 'year';

export default function CompleteProfileScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [month, setMonth] = React.useState<number | null>(null);
  const [day, setDay] = React.useState<number | null>(null);
  const [year, setYear] = React.useState<number | null>(null);
  const [activePicker, setActivePicker] = React.useState<PickerField | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);

  const maxDay = month && year ? getDaysInMonth(month, year) : 31;
  const adjustedDay = day && day > maxDay ? maxDay : day;

  const birthday = month && adjustedDay && year
    ? new Date(year, month - 1, adjustedDay)
    : null;

  const isValid = name.trim().length >= 1 && birthday !== null;

  const getPickerData = (): { label: string; value: number }[] => {
    if (activePicker === 'month') {
      return MONTHS.map((m, i) => ({ label: m, value: i + 1 }));
    }
    if (activePicker === 'day') {
      return Array.from({ length: maxDay }, (_, i) => ({
        label: String(i + 1),
        value: i + 1,
      }));
    }
    if (activePicker === 'year') {
      return generateYears().map((y) => ({ label: String(y), value: y }));
    }
    return [];
  };

  const handlePickerSelect = (value: number) => {
    if (activePicker === 'month') setMonth(value);
    if (activePicker === 'day') setDay(value);
    if (activePicker === 'year') setYear(value);
    setActivePicker(null);
  };

  const handleSelectProfilePicture = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;
    setProfileImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!isValid || submitting || !birthday) return;

    setSubmitting(true);
    try {
      // Complete profile first
      await orpc.profiles.completeProfile.call({
        name: name.trim(),
        birthday: birthday.toISOString(),
      });

      // Upload profile picture if selected (optional)
      if (profileImage) {
        try {
          await uploadProfilePicture({
            uri: profileImage,
            type: 'image/jpeg',
            fileName: 'profile.jpg',
          });
        } catch (uploadError: any) {
          // Don't block on upload error, just log it
          console.log('Profile picture upload failed:', uploadError?.message);
        }
      }

      // Invalidate dashboard to reflect profile changes
      queryClient.invalidateQueries({ queryKey: orpc.dashboard.getDashboardSummary.queryOptions().queryKey });

      router.replace('/(tabs)' as import('expo-router').Href);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message ?? 'Failed to complete profile. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Complete Profile', headerShown: false }} />
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-md self-center">
            <View className="px-6 pt-8">
              <Text className="text-3xl font-extrabold tracking-tight leading-tight text-[#111827] mb-3">
                Almost there!
              </Text>
              <Text className="text-base font-medium text-slate-500 leading-relaxed">
                Tell us a bit about yourself to complete your account setup.
              </Text>
            </View>

            <View className="px-6 pt-8 gap-6">
              {/* Profile Picture - Optional */}
              <View className="items-center gap-2">
                <Pressable
                  onPress={handleSelectProfilePicture}
                  disabled={submitting}
                  className="relative"
                >
                  <Image
                    source={{ uri: profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&size=200&background=13ec5b&color=112217` }}
                    style={{ width: 120, height: 120, borderRadius: 60 }}
                    contentFit="cover"
                    transition={200}
                  />
                  <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-2 border-white">
                    <Camera size={20} color="#000" />
                  </View>
                </Pressable>
                <Text className="text-xs text-slate-500">Tap to add profile picture (optional)</Text>
              </View>

              <View className="gap-1">
                <Text className="text-sm font-semibold text-[#111827] ml-1">
                  Full Name
                </Text>
                <View className="flex-row items-center h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-4">
                  <TextInput
                    className="flex-1 text-lg font-medium text-[#111827]"
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!submitting}
                  />
                  <User size={20} color="#0ea340" />
                </View>
                <Text className="text-xs text-slate-500 ml-1">
                  Name requires admin approval before it appears on your profile.
                </Text>
              </View>

              <View className="gap-1">
                <Text className="text-sm font-semibold text-[#111827] ml-1">
                  Birthday
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setActivePicker('month')}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <View className="h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-3 flex-row items-center justify-between">
                      <Text className={`text-base font-medium ${month ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                        {month ? MONTHS[month - 1]?.slice(0, 3) : 'Month'}
                      </Text>
                      <ChevronDown size={16} color="#9ca3af" />
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setActivePicker('day')}
                    disabled={submitting}
                    className="w-20"
                  >
                    <View className="h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-3 flex-row items-center justify-between">
                      <Text className={`text-base font-medium ${adjustedDay ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                        {adjustedDay ?? 'Day'}
                      </Text>
                      <ChevronDown size={16} color="#9ca3af" />
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setActivePicker('year')}
                    disabled={submitting}
                    className="w-24"
                  >
                    <View className="h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] px-3 flex-row items-center justify-between">
                      <Text className={`text-base font-medium ${year ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                        {year ?? 'Year'}
                      </Text>
                      <ChevronDown size={16} color="#9ca3af" />
                    </View>
                  </Pressable>
                </View>

                {birthday && (
                  <View className="flex-row items-center gap-2 mt-2 ml-1">
                    <Calendar size={14} color="#0ea340" />
                    <Text className="text-sm font-medium text-[#0ea340]">
                      {birthday.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

          </View>
        </ScrollView>
        <View className="px-6 pb-6 pt-4 w-full max-w-md self-center">
          <Button
            onPress={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full h-14 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Text
              className="text-lg font-bold tracking-tight"
              style={{ color: '#0a2e16' }}
            >
              {submitting ? 'Saving...' : 'Complete Setup'}
            </Text>
            {!submitting && <ArrowRight size={20} color="#0a2e16" />}
          </Button>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Picker Modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setActivePicker(null)}
        />
        <View className="bg-white rounded-t-2xl max-h-[50%] pb-8">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
            <Text className="text-lg font-bold text-[#111827]">
              Select {activePicker === 'month' ? 'Month' : activePicker === 'day' ? 'Day' : 'Year'}
            </Text>
            <Pressable onPress={() => setActivePicker(null)}>
              <Text className="text-base font-semibold text-[#0ea340]">Done</Text>
            </Pressable>
          </View>
          <FlatList
            data={getPickerData()}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlePickerSelect(item.value)}
                className="px-6 py-3"
              >
                <Text className="text-base text-[#111827]">{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}
