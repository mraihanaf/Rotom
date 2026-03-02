import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import {
  ArrowLeft,
  Badge,
  Calendar,
  Check,
  Edit,
  LogOut,
  Mail,
  Save,
  School,
} from 'lucide-react-native';
import * as React from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';

export default function ProfileScreen() {
  const [username, setUsername] = React.useState('@alexrivera_99');
  const [birthday, setBirthday] = React.useState('2005-11-15');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <Pressable className="h-10 w-10 items-center justify-center rounded-full">
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">My Profile</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full">
          <Check size={24} color="#13ec5b" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-6">
          <View className="mb-8 items-center">
            <Pressable className="relative mb-4">
              <Image
                source={{ uri: 'https://i.pravatar.cc/200?u=alex' }}
                className="h-28 w-28 rounded-full border-4 border-white bg-gray-200 shadow-xl"
              />
              <View className="absolute bottom-0 right-0 items-center justify-center rounded-full border-[3px] border-[#f6f8f6] bg-primary p-2">
                <Edit size={14} color="#000" />
              </View>
            </Pressable>
            <Text className="text-2xl font-bold tracking-tight text-foreground">Alex Rivera</Text>
            <View className="mt-2 rounded-full border border-primary/30 bg-primary/20 px-3 py-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-primary">
                Class President
              </Text>
            </View>
          </View>

          <View className="mb-8">
            <Text className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Edit Profile
            </Text>
            <View className="gap-4">
              <View>
                <Text className="mb-2 ml-1 text-sm font-medium text-foreground">Username</Text>
                <View className="h-14 flex-row items-center rounded-xl border border-gray-200 bg-white px-4">
                  <TextInput
                    className="flex-1 text-base text-foreground"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="@username"
                    placeholderTextColor="#9ca3af"
                  />
                  <Edit size={20} color="#13ec5b" />
                </View>
              </View>
              <View>
                <Text className="mb-2 ml-1 text-sm font-medium text-foreground">Birthday</Text>
                <View className="h-14 flex-row items-center rounded-xl border border-gray-200 bg-white px-4">
                  <TextInput
                    className="flex-1 text-base text-foreground"
                    value={birthday}
                    onChangeText={setBirthday}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                  <Calendar size={20} color="#13ec5b" />
                </View>
              </View>
            </View>
          </View>

          <View className="mb-8">
            <Text className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Student Info
            </Text>
            <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                    <Badge size={18} color="#3b82f6" />
                  </View>
                  <Text className="text-sm font-medium text-foreground">Student ID</Text>
                </View>
                <Text className="font-mono text-sm font-semibold text-gray-500">2023001</Text>
              </View>
              <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                    <School size={18} color="#a855f7" />
                  </View>
                  <Text className="text-sm font-medium text-foreground">Class Section</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-500">3-A</Text>
              </View>
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                    <Mail size={18} color="#f97316" />
                  </View>
                  <Text className="text-sm font-medium text-foreground">Email</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-500">alex.r@school.edu</Text>
              </View>
            </View>
          </View>

          <View className="gap-4">
            <Button className="h-14 w-full rounded-xl">
              <Save size={20} color="#000" />
              <Text className="font-bold text-black">Save Changes</Text>
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full rounded-xl border-red-200 bg-transparent"
            >
              <LogOut size={20} color="#ef4444" />
              <Text className="font-bold text-red-500">Sign Out</Text>
            </Button>
            <Text className="pt-4 text-center text-xs text-gray-400">Rotom App v2.4.1</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
