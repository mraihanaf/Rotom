import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Text } from '@/components/ui/text';
import { ErrorView } from '@/components/ui/error-view';
import { Stack, router } from 'expo-router';
import {
  Heart,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Smile,
  ThumbsUp,
  Trash2,
  Video,
} from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Dimensions, Image, Pressable, RefreshControl, ScrollView, View, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { useUserRole } from '@/lib/hooks/useUserRole';
import * as ImagePicker from 'expo-image-picker';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 12;
const GRID_PADDING = 16;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

function formatTimeAgo(dateStr: string | Date) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getTotalReactions(reactions: Record<string, number>) {
  return Object.values(reactions).reduce((s, n) => s + n, 0);
}

export default function GalleryScreen() {
  const queryClient = useQueryClient();
  const { isAdmin, isOwner } = useUserRole();

  const queryOpts = orpc.gallery.getAllPosts.queryOptions({ input: { limit: 50 } });
  const { data, isPending, isError, refetch } = useQuery(queryOpts);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const reactMutation = useMutation({
    ...orpc.gallery.reactPostById.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryOpts.queryKey }),
  });

  const deleteReactionMutation = useMutation({
    ...orpc.gallery.deleteReactionByPostId.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryOpts.queryKey }),
  });

  const deletePostMutation = useMutation({
    ...orpc.gallery.deletePostById.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryOpts.queryKey }),
  });

  const posts = data?.items ?? [];
  const newestPost = posts[0];
  const gridPosts = posts.slice(1);

  const handleReact = (postId: string, myReaction: string | null, emoji: string) => {
    if (myReaction) {
      deleteReactionMutation.mutate({ postId });
    } else {
      reactMutation.mutate({ postId, emoji });
    }
  };

  return (
    <AnimatedTabScreen>
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" style={{ flex: 1 }} edges={['top']}>
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
            onPress={() => router.push('/modal/new-post')}
          >
            <Plus size={20} color="#0a2e16" />
          </Pressable>
        </View>
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#13ec5b" />
        </View>
      ) : isError ? (
        <ErrorView onRetry={() => refetch()} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#13ec5b']}
              tintColor="#13ec5b"
            />
          }
        >
          <View className="px-4 gap-6 pt-2">
            {/* Newest Memory */}
            {newestPost && (
              <View>
                <View className="mb-3 flex-row items-center justify-between px-1">
                  <Text className="text-lg font-bold text-[#111827]">Newest Memory</Text>
                  <View className="rounded-full bg-primary/10 px-2.5 py-1">
                    <Text className="text-xs font-medium text-primary">{formatTimeAgo(newestPost.createdAt)}</Text>
                  </View>
                </View>

                <View className="overflow-hidden rounded-2xl bg-white" style={{ borderWidth: 1, borderColor: '#e5e7eb', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
                  {/* User row */}
                  <View className="flex-row items-center gap-3 p-3">
                    <Image
                      source={{ uri: newestPost.createdBy.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(newestPost.createdBy.name)}&size=100` }}
                      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb' }}
                    />
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-[#111827]">{newestPost.createdBy.name}</Text>
                      <Text className="text-xs text-gray-500">{formatTimeAgo(newestPost.createdAt)}</Text>
                    </View>
                    {(isAdmin || isOwner(newestPost.createdBy.userId)) && (
                      <Pressable
                        className="h-10 w-10 items-center justify-center"
                        onPress={() => deletePostMutation.mutate({ id: newestPost.id })}
                      >
                        <Trash2 size={20} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>

                  {/* Hero image */}
                  <View style={{ aspectRatio: 4 / 3, backgroundColor: '#111827' }}>
                    <Image
                      source={{ uri: newestPost.url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    {newestPost.type === 'video' && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={24} color="#fff" fill="#fff" />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Reactions */}
                  <View className="flex-row items-center px-2 py-1.5" style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                    <Pressable
                      className="flex-row items-center gap-1.5 px-3 py-2"
                      onPress={() => handleReact(newestPost.id, newestPost.myReaction, '❤️')}
                    >
                      <Heart size={18} color="#e11d48" fill={newestPost.myReaction ? '#e11d48' : 'none'} />
                      <Text className="text-sm font-bold text-gray-600">{getTotalReactions(newestPost.reactions)}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Grid */}
            {gridPosts.length > 0 && (
              <View>
                <View className="mb-3 flex-row items-center justify-between px-1 mt-2">
                  <Text className="text-lg font-bold text-[#111827]">All Posts</Text>
                </View>
                <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
                  {gridPosts.map((post) => {
                    const totalReactions = getTotalReactions(post.reactions);
                    return (
                      <View
                        key={post.id}
                        style={{ width: ITEM_WIDTH, borderRadius: 12, overflow: 'hidden' }}
                        className="bg-white"
                      >
                        <View style={{ aspectRatio: post.type === 'video' ? 1 : 3 / 4, backgroundColor: '#e5e7eb' }}>
                          <Image
                            source={{ uri: post.url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />

                          {post.type === 'video' && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                                <Play size={20} color="#fff" fill="#fff" />
                              </View>
                            </View>
                          )}

                          {totalReactions > 0 && (
                            <View style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                              <Heart size={14} color="#f43f5e" fill="#f43f5e" />
                              <Text className="text-[10px] font-bold text-white">{totalReactions}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {posts.length === 0 && (
              <View className="items-center py-16">
                <Text className="text-slate-400 text-sm">No posts yet. Be the first!</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
      </SafeAreaView>
    </AnimatedTabScreen>
  );
}
