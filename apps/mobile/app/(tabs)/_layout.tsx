import { Tabs, usePathname, useNavigation } from 'expo-router';
import {
  Calendar,
  ClipboardList,
  Image,
  LayoutGrid,
  User,
  Wallet,
} from 'lucide-react-native';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { TabAnimationProvider, useTabAnimation } from '@/lib/animation/TabAnimationContext';

const TAB_ORDER = ['index', 'assignments', 'schedule', 'funds', 'gallery', 'profile'];

function useSwipeNavigation() {
  const pathname = usePathname();
  const navigation = useNavigation();
  const { triggerNavigation } = useTabAnimation();

  const navigateToTab = (direction: 'next' | 'prev') => {
    const currentTab = pathname.split('/').pop() || 'index';
    const currentIndex = TAB_ORDER.indexOf(currentTab);

    if (currentIndex === -1) return;

    const newIndex = direction === 'next'
      ? Math.min(currentIndex + 1, TAB_ORDER.length - 1)
      : Math.max(currentIndex - 1, 0);

    if (newIndex !== currentIndex) {
      const targetTab = TAB_ORDER[newIndex];
      triggerNavigation(direction, () => {
        (navigation as any).navigate('(tabs)', { screen: targetTab });
      });
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .activeOffsetY([-100, 100])
    .onEnd((event) => {
      const { translationX, velocityX } = event;

      // Swipe left (negative X) -> go to NEXT tab
      if (translationX < -50 || velocityX < -500) {
        runOnJS(navigateToTab)('next');
      }
      // Swipe right (positive X) -> go to PREVIOUS tab
      else if (translationX > 50 || velocityX > 500) {
        runOnJS(navigateToTab)('prev');
      }
    });

  return swipeGesture;
}

function TabsLayoutContent() {
  const swipeGesture = useSwipeNavigation();

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={{ flex: 1 }}>
        <Tabs
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#0fae43',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
            },
          }}
        >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Utama',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <LayoutGrid size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Tugas',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <ClipboardList size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="funds"
        options={{
          title: 'Kas',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Image size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <User size={size} color={color} />
          ),
        }}
      />
        </Tabs>
      </View>
    </GestureDetector>
  );
}

export default function TabsLayout() {
  return (
    <TabAnimationProvider>
      <TabsLayoutContent />
    </TabAnimationProvider>
  );
}
