import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import {
  Calendar,
  Grid3x3,
  Heart,
  Image as ImageIcon,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Smile,
  ThumbsUp,
  Video,
} from 'lucide-react-native';
import * as React from 'react';
import { Dimensions, Image, Pressable, ScrollView, View } from 'react-native';

const FILTERS = [
  { key: 'all', label: 'All', icon: Grid3x3 },
  { key: 'photos', label: 'Photos', icon: ImageIcon },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'week', label: 'This Week', icon: Calendar },
] as const;

const YESTERDAY_ITEMS: {
  id: string;
  type: 'image' | 'video';
  uri: string;
  reactions?: string;
  duration?: string;
  caption?: string;
}[] = [
  { id: '1', type: 'image', uri: 'https://picsum.photos/400/500?r=1', reactions: '8' },
  { id: '2', type: 'video', uri: 'https://picsum.photos/400/400?r=2', duration: '0:28', caption: 'Math Quiz Prep 📚' },
  { id: '3', type: 'image', uri: 'https://picsum.photos/400/500?r=3', reactions: '3' },
  { id: '4', type: 'video', uri: 'https://picsum.photos/400/500?r=4', duration: '0:15' },
  { id: '5', type: 'image', uri: 'https://picsum.photos/400/400?r=5', reactions: '14' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 12;
const GRID_PADDING = 16;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const REACTION_ICONS: Record<string, { icon: typeof Heart; color: string; fill?: boolean }> = {
  '1': { icon: Heart, color: '#f43f5e', fill: true },
  '3': { icon: Smile, color: '#f59e0b' },
  '5': { icon: ThumbsUp, color: '#13ec5b' },
};

export default function GalleryScreen() {
  const [filter, setFilter] = React.useState('all');

  return (
    <View className="flex-1 bg-[#f6f8f6]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-[#f6f8f6]">
        <Text className="flex-1 text-xl font-extrabold tracking-tight text-[#111827]">
          Class Memories
        </Text>
        <View className="flex-row gap-3">
          <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white">
            <Search size={20} color="#6b7280" />
          </Pressable>
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-primary"
            style={{ elevation: 4, shadowColor: 'rgba(19,236,91,0.3)', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15 }}
          >
            <Plus size={20} color="#0a2e16" />
          </Pressable>
        </View>
      </View>

  

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 gap-6 pt-2">
          {/* Newest Memory */}
          <View>
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="text-lg font-bold text-[#111827]">Newest Memory</Text>
              <View className="rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-medium text-primary">Just now</Text>
              </View>
            </View>

            <View className="overflow-hidden rounded-2xl bg-white" style={{ borderWidth: 1, borderColor: '#e5e7eb', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              {/* User row */}
              <View className="flex-row items-center gap-3 p-3">
                <Image
                  source={{ uri: 'https://i.pravatar.cc/100?u=sarah' }}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb' }}
                />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-[#111827]">Sarah Jenkins</Text>
                  <Text className="text-xs text-gray-500">Class 3-B • 2 hours ago</Text>
                </View>
                <Pressable className="h-10 w-10 items-center justify-center">
                  <MoreHorizontal size={20} color="#9ca3af" />
                </Pressable>
              </View>

              {/* Hero image */}
              <View style={{ aspectRatio: 4 / 3, backgroundColor: '#111827' }}>
                <Image
                  source={{ uri: 'https://picsum.photos/800/600?r=hero' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.4)' }} />
                <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                  <Text className="text-lg font-bold text-white">Science Fair Winners! 🏆</Text>
                </View>
              </View>

              {/* Reactions */}
              <View className="flex-row items-center px-2 py-1.5" style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                <Pressable className="flex-row items-center gap-1.5 px-3 py-2">
                  <Heart size={18} color="#e11d48" fill="#e11d48" />
                  <Text className="text-sm font-bold text-gray-600">24</Text>
                </Pressable>
                <Pressable className="flex-row items-center gap-1.5 px-3 py-2">
                  <Smile size={18} color="#f59e0b" />
                  <Text className="text-sm font-bold text-gray-600">5</Text>
                </Pressable>
                <Pressable className="flex-row items-center gap-1.5 px-3 py-2">
                  <ThumbsUp size={18} color="#13ec5b" />
                  <Text className="text-sm font-bold text-gray-600">12</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Yesterday */}
          <View>
            <View className="mb-3 flex-row items-center justify-between px-1 mt-2">
              <Text className="text-lg font-bold text-[#111827]">Yesterday</Text>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
              {YESTERDAY_ITEMS.map((item) => {
                const reactionMeta = REACTION_ICONS[item.id];
                return (
                  <View
                    key={item.id}
                    style={{ width: ITEM_WIDTH, borderRadius: 12, overflow: 'hidden' }}
                    className="bg-white"
                  >
                    <View style={{ aspectRatio: item.type === 'video' ? 1 : (item.id === '1' || item.id === '3') ? 3 / 4 : 1, backgroundColor: '#e5e7eb' }}>
                      <Image
                        source={{ uri: item.uri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />

                      {item.type === 'video' && (
                        <>
                          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                              <Play size={20} color="#fff" fill="#fff" />
                            </View>
                          </View>
                          {item.duration && (
                            <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Video size={10} color="#13ec5b" />
                              <Text className="text-[10px] font-bold text-white">{item.duration}</Text>
                            </View>
                          )}
                          {item.caption && (
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 6 }}>
                              <Text className="text-xs font-semibold text-white" numberOfLines={1}>{item.caption}</Text>
                            </View>
                          )}
                        </>
                      )}

                      {item.type === 'image' && item.reactions && (
                        <View style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                          {reactionMeta ? (
                            <reactionMeta.icon
                              size={14}
                              color={reactionMeta.color}
                              fill={reactionMeta.fill ? reactionMeta.color : 'none'}
                            />
                          ) : (
                            <Heart size={14} color="#f43f5e" fill="#f43f5e" />
                          )}
                          <Text className="text-[10px] font-bold text-white">{item.reactions}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
