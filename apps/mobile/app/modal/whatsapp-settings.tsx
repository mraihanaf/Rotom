import { Stack, router } from 'expo-router';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Pressable } from '@/tw';
import { Switch } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { ChevronLeft, Clock, Bell, MessageSquare, Wallet, Globe } from 'lucide-react-native';
import { Platform, TextInput, Alert } from 'react-native';
import moment from 'moment-timezone';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label: string;
}

function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [hours, minutes] = value.split(':').map(Number);

  const adjustTime = (type: 'hours' | 'minutes', delta: number) => {
    let newHours = hours;
    let newMinutes = minutes;

    if (type === 'hours') {
      newHours = (hours + delta + 24) % 24;
    } else {
      newMinutes = (minutes + delta + 60) % 60;
    }

    onChange(`${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
  };

  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm font-medium text-gray-600">{label}</Text>
      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={() => adjustTime('hours', -1)}
          className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
        >
          <Text className="text-base font-bold">-</Text>
        </Pressable>
        <View className="w-10 h-8 bg-gray-50 rounded-lg items-center justify-center border border-gray-200">
          <Text className="font-mono text-sm font-semibold">{String(hours).padStart(2, '0')}</Text>
        </View>
        <Pressable
          onPress={() => adjustTime('hours', 1)}
          className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
        >
          <Text className="text-base font-bold">+</Text>
        </Pressable>
        <Text className="text-lg font-bold mx-1">:</Text>
        <Pressable
          onPress={() => adjustTime('minutes', -1)}
          className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
        >
          <Text className="text-base font-bold">-</Text>
        </Pressable>
        <View className="w-10 h-8 bg-gray-50 rounded-lg items-center justify-center border border-gray-200">
          <Text className="font-mono text-sm font-semibold">{String(minutes).padStart(2, '0')}</Text>
        </View>
        <Pressable
          onPress={() => adjustTime('minutes', 1)}
          className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
        >
          <Text className="text-base font-bold">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function WhatsappSettingsModal() {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery(
    orpc.settings.getWhatsappSettings.queryOptions()
  );

  const updateMutation = useMutation(
    orpc.settings.updateWhatsappSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['settings', 'getWhatsappSettings'] });
        Alert.alert('Success', 'Settings saved successfully');
      },
      onError: (error) => {
        Alert.alert('Error', 'Failed to save settings: ' + (error as Error).message);
      },
    })
  );

  // Local state for form
  const [form, setForm] = useState({
    announcementGroupJid: '',
    dutyReminderTime: '07:00',
    scheduleReminderTime: '07:00',
    assignmentReminderTime: '18:00',
    birthdayReminderTime: '09:00',
    fundReportDay: 1,
    fundReportTime: '08:00',
    dutyPersonalizedMessage: 'jangan lupa piket hari ini ya {name}!',
    birthdayMessageTemplate: 'Selamat ulang tahun {name}! Semoga panjang umur dan sehat selalu!',
    timezone: 'system',
    ENABLE_WHATSAPP_BOT_FUND_REPORT: true,
    ENABLE_WHATSAPP_BOT_DUTY_REPORT: true,
    ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: true,
    ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: true,
    ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: true,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setForm({
        announcementGroupJid: settings.announcementGroupJid ?? '',
        dutyReminderTime: settings.dutyReminderTime,
        scheduleReminderTime: settings.scheduleReminderTime,
        assignmentReminderTime: settings.assignmentReminderTime,
        birthdayReminderTime: settings.birthdayReminderTime,
        fundReportDay: settings.fundReportDay,
        fundReportTime: settings.fundReportTime,
        dutyPersonalizedMessage: settings.dutyPersonalizedMessage,
        birthdayMessageTemplate: settings.birthdayMessageTemplate,
        timezone: settings.timezone || 'system',
        ENABLE_WHATSAPP_BOT_FUND_REPORT: settings.ENABLE_WHATSAPP_BOT_FUND_REPORT,
        ENABLE_WHATSAPP_BOT_DUTY_REPORT: settings.ENABLE_WHATSAPP_BOT_DUTY_REPORT,
        ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: settings.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER,
        ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: settings.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER,
        ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: settings.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER,
      });
    }
  }, [settings]);

  const handleSave = useCallback(() => {
    updateMutation.mutate(form);
  }, [form, updateMutation]);

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-lg font-semibold text-red-600">Access Denied</Text>
          <Text className="text-gray-600 text-center mt-2">
            Only admins can access WhatsApp bot settings.
          </Text>
          <Button className="mt-4" onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <View className="flex-1 items-center justify-center">
          <Text>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">WhatsApp Bot Settings</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 16 }}>
        {/* Announcement Group */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-base font-semibold mb-4">📢 Announcement Group</Text>
          <View className="gap-2">
            <Text className="text-sm text-gray-600">Group JID</Text>
            <TextInput
              value={form.announcementGroupJid}
              onChangeText={(text) => setForm({ ...form, announcementGroupJid: text })}
              placeholder="1234567890@g.us"
              className="border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50"
            />
            <Text className="text-xs text-gray-500">
              WhatsApp group JID where announcements will be sent
            </Text>
          </View>
        </View>

        {/* Timezone Settings */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-base font-semibold mb-4">🌍 Timezone</Text>
          <View className="gap-2">
            <View className="flex-row items-center gap-3 mb-2">
              <Globe size={20} color="#0fae43" />
              <Text className="text-sm text-gray-600">Select Timezone</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setForm({ ...form, timezone: 'system' })}
                  className={`px-3 py-2 rounded-lg border ${form.timezone === 'system' ? 'bg-primary/10 border-primary' : 'bg-gray-50 border-gray-200'}`}
                >
                  <Text className={`text-sm ${form.timezone === 'system' ? 'text-primary font-medium' : 'text-gray-600'}`}>
                    System ({moment.tz.guess()})
                  </Text>
                </Pressable>
                {['Asia/Jakarta', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Bangkok', 'Asia/Kolkata', 'UTC'].map((tz) => (
                  <Pressable
                    key={tz}
                    onPress={() => setForm({ ...form, timezone: tz })}
                    className={`px-3 py-2 rounded-lg border ${form.timezone === tz ? 'bg-primary/10 border-primary' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <Text className={`text-sm ${form.timezone === tz ? 'text-primary font-medium' : 'text-gray-600'}`}>
                      {tz} (UTC{moment.tz(tz).format('Z')})
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Text className="text-xs text-gray-500 mt-1">
              Current time in selected timezone: {moment.tz(form.timezone === 'system' ? moment.tz.guess() : form.timezone).format('HH:mm')}
            </Text>
          </View>
        </View>

        {/* Enable/Disable Toggles */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-base font-semibold mb-4">🔔 Enable/Disable Features</Text>

          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Wallet size={20} color="#0fae43" />
                <Text className="text-sm">Monthly Fund Report</Text>
              </View>
              <Switch
                value={form.ENABLE_WHATSAPP_BOT_FUND_REPORT}
                onValueChange={(v: boolean) => setForm({ ...form, ENABLE_WHATSAPP_BOT_FUND_REPORT: v })}
                trackColor={{ true: '#0fae43', false: '#d1d5db' }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Bell size={20} color="#0fae43" />
                <Text className="text-sm">Daily Duty Reminders</Text>
              </View>
              <Switch
                value={form.ENABLE_WHATSAPP_BOT_DUTY_REPORT}
                onValueChange={(v: boolean) => setForm({ ...form, ENABLE_WHATSAPP_BOT_DUTY_REPORT: v })}
                trackColor={{ true: '#0fae43', false: '#d1d5db' }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Clock size={20} color="#0fae43" />
                <Text className="text-sm">Daily Schedule Reminder</Text>
              </View>
              <Switch
                value={form.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER}
                onValueChange={(v: boolean) => setForm({ ...form, ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: v })}
                trackColor={{ true: '#0fae43', false: '#d1d5db' }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <MessageSquare size={20} color="#0fae43" />
                <Text className="text-sm">Assignment Reminders</Text>
              </View>
              <Switch
                value={form.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER}
                onValueChange={(v: boolean) => setForm({ ...form, ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: v })}
                trackColor={{ true: '#0fae43', false: '#d1d5db' }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">🎂</Text>
                <Text className="text-sm">Birthday Reminders</Text>
              </View>
              <Switch
                value={form.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER}
                onValueChange={(v: boolean) => setForm({ ...form, ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: v })}
                trackColor={{ true: '#0fae43', false: '#d1d5db' }}
              />
            </View>
          </View>
        </View>

        {/* Reminder Times */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-base font-semibold mb-4">⏰ Reminder Times</Text>

          <View className="gap-4">
            <TimePicker
              label="Duty"
              value={form.dutyReminderTime}
              onChange={(time) => setForm({ ...form, dutyReminderTime: time })}
            />
            <TimePicker
              label="Schedule"
              value={form.scheduleReminderTime}
              onChange={(time) => setForm({ ...form, scheduleReminderTime: time })}
            />
            <TimePicker
              label="Assignment"
              value={form.assignmentReminderTime}
              onChange={(time) => setForm({ ...form, assignmentReminderTime: time })}
            />
            <TimePicker
              label="Birthday"
              value={form.birthdayReminderTime}
              onChange={(time) => setForm({ ...form, birthdayReminderTime: time })}
            />
          </View>
        </View>

        {/* Fund Report Settings */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-base font-semibold mb-4">💰 Fund Report Settings</Text>

          <View className="flex-row items-center gap-4">
            <Text className="text-sm text-gray-600">Day of month</Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setForm({ ...form, fundReportDay: Math.max(1, form.fundReportDay - 1) })}
                className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center"
              >
                <Text className="text-lg font-bold">-</Text>
              </Pressable>
              <View className="w-12 h-10 bg-gray-50 rounded-lg items-center justify-center border border-gray-200">
                <Text className="font-mono font-semibold">{form.fundReportDay}</Text>
              </View>
              <Pressable
                onPress={() => setForm({ ...form, fundReportDay: Math.min(31, form.fundReportDay + 1) })}
                className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center"
              >
                <Text className="text-lg font-bold">+</Text>
              </Pressable>
            </View>
            <Text className="text-sm text-gray-600">Time</Text>
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={() => setForm({ ...form, fundReportTime: adjustTime(form.fundReportTime, -1, 0) })}
                className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
              >
                <Text className="text-sm font-bold">-</Text>
              </Pressable>
              <View className="w-14 h-8 bg-gray-50 rounded-lg items-center justify-center border border-gray-200">
                <Text className="font-mono text-xs font-semibold">{form.fundReportTime}</Text>
              </View>
              <Pressable
                onPress={() => setForm({ ...form, fundReportTime: adjustTime(form.fundReportTime, 1, 0) })}
                className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
              >
                <Text className="text-sm font-bold">+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Message Templates */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-base font-semibold mb-4">📝 Message Templates</Text>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm text-gray-600">Duty Personalized Message</Text>
              <TextInput
                value={form.dutyPersonalizedMessage}
                onChangeText={(text) => setForm({ ...form, dutyPersonalizedMessage: text })}
                multiline
                numberOfLines={2}
                className="border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-sm"
              />
              <Text className="text-xs text-gray-500">Use {'{name}'} as placeholder for person's name</Text>
            </View>

            <View className="gap-2">
              <Text className="text-sm text-gray-600">Birthday Message Template</Text>
              <TextInput
                value={form.birthdayMessageTemplate}
                onChangeText={(text) => setForm({ ...form, birthdayMessageTemplate: text })}
                multiline
                numberOfLines={2}
                className="border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-sm"
              />
              <Text className="text-xs text-gray-500">Use {'{name}'} as placeholder for birthday person's name</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <Button
          onPress={handleSave}
          disabled={updateMutation.isPending}
          className="w-full h-14 rounded-xl"
        >
          <Text className="text-lg font-bold tracking-tight" style={{ color: '#0a2e16' }}>
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function adjustTime(time: string, hoursDelta: number, minutesDelta: number): string {
  const [hours, minutes] = time.split(':').map(Number);
  const newHours = (hours + hoursDelta + 24) % 24;
  const newMinutes = (minutes + minutesDelta + 60) % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}
