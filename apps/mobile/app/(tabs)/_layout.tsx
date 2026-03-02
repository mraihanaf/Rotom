import { Tabs } from 'expo-router';
import { LayoutDashboard, Calendar, Wallet, ListTodo, Image as ImageIcon } from 'lucide-react-native';
import { useUniwind } from 'uniwind';
import { NAV_THEME } from '@/lib/theme';
import { Image } from 'react-native';

export default function TabsLayout() {
  const { theme } = useUniwind();
  const colors = NAV_THEME[theme ?? 'light'].colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Utama',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Tugas',
          tabBarIcon: ({ color }) => <ListTodo size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="funds"
        options={{
          title: 'Kas',
          tabBarIcon: ({ color }) => <Wallet size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color }) => <ImageIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={{ uri: 'https://i.pravatar.cc/100?u=profil' }}
              style={{ width: 24, height: 24, borderRadius: 12, borderWidth: focused ? 2 : 0, borderColor: color }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
