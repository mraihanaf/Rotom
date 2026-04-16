import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { Text } from '@/components/ui/text';
import { ErrorView } from '@/components/ui/error-view';
import { Stack } from 'expo-router';
import { Heart, Play, Plus, Search, Trash2 } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Dimensions, RefreshControl, Alert, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { View, Pressable, ScrollView } from '@/tw';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc, uploadGalleryMedia } from '@/lib/api';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { useGalleryCache } from '@/lib/hooks/useGalleryCache';
import * as ImagePicker from 'expo-image-picker';
import { SkeletonBox } from '@/components/ui/skeleton';
import { VideoView, useVideoPlayer } from 'expo-video';

// Video player component using expo-video API
function VideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  React.useEffect(() => {
    player.loop = true;
    player.muted = true;
    player.play();
  }, [player]);

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: '#111' }}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={true}
        surfaceType='textureView'
      />
    </View>
  );
}

function GallerySkeleton() {
  const leftHeights = [160, 120, 180, 100];
  const rightHeights = [130, 170, 110, 150];
  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 8, flexDirection: 'row', gap: GRID_GAP }}>
      <View style={{ flex: 1, gap: GRID_GAP }}>
        {leftHeights.map((h, i) => (
          <SkeletonBox key={i} height={h} borderRadius={14} />
        ))}
      </View>
      <View style={{ flex: 1, gap: GRID_GAP }}>
        {rightHeights.map((h, i) => (
          <SkeletonBox key={i} height={h} borderRadius={14} />
        ))}
      </View>
    </View>
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 8;
const GRID_PADDING = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

type PostItem = {
  id: string;
  url: string;
  type: string;
  createdAt: string | Date;
  createdBy: { userId: string; name: string; image: string | null };
  reactions: Record<string, number>;
  myReaction: string | null;
};

function useMasonryColumns(posts: PostItem[]) {
  const [heights, setHeights] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    posts.forEach((post) => {
      if (heights[post.id] !== undefined) return;
      RNImage.getSize(
        post.url,
        (w: number, h: number) => {
          const ratio = h / w;
          setHeights((prev) => ({ ...prev, [post.id]: ITEM_WIDTH * ratio }));
        },
        () => {
          setHeights((prev) => ({ ...prev, [post.id]: ITEM_WIDTH * 1.25 }));
        },
      );
    });
  }, [posts]);

  const left: PostItem[] = [];
  const right: PostItem[] = [];
  let leftH = 0;
  let rightH = 0;

  for (const post of posts) {
    if (leftH <= rightH) {
      left.push(post);
      leftH += heights[post.id] ?? ITEM_WIDTH * 1.25;
    } else {
      right.push(post);
      rightH += heights[post.id] ?? ITEM_WIDTH * 1.25;
    }
  }

  return { left, right, heights };
}

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

function MasonryCard({
  post,
  height,
  isAdmin,
  isOwner,
  onReact,
  onDelete,
  getCachedUrl,
}: {
  post: PostItem;
  height: number | undefined;
  isAdmin: boolean;
  isOwner: (userId: string) => boolean;
  onReact: (postId: string, myReaction: string | null, emoji: string) => void;
  onDelete: (id: string) => void;
  getCachedUrl: (id: string, originalUrl: string) => string;
}) {
  const totalReactions = getTotalReactions(post.reactions);
  const displayHeight = height ?? ITEM_WIDTH * 1.25;
  const cachedUrl = getCachedUrl(post.id, post.url);

  return (
    <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
      {/* Media */}
      <View style={{ height: displayHeight, backgroundColor: '#d1d5db', overflow: 'hidden' }}>
        {post.type === 'video' ? (
          <VideoPlayer uri={cachedUrl} />
        ) : (
          <Image
            source={{ uri: cachedUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        )}
        {(isAdmin || isOwner(post.createdBy.userId)) && (
          <Pressable
            style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => onDelete(post.id)}
          >
            <Trash2 size={13} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#fff', gap: 6 }}>
        <Image
          source={{ uri: post.createdBy.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.createdBy.name)}&size=64&background=e5e7eb` }}
          style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#e5e7eb' }}
        />
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: '#374151' }} numberOfLines={1}>
          {post.createdBy.name}
        </Text>
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
          onPress={() => onReact(post.id, post.myReaction, '❤️')}
        >
          <Heart size={13} color="#e11d48" fill={post.myReaction ? '#e11d48' : 'none'} />
          {totalReactions > 0 && (
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6b7280' }}>{totalReactions}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function GalleryScreen() {
  const queryClient = useQueryClient();
  const { isAdmin, isOwner } = useUserRole();
  const { cacheLatestMedia, getCachedUrl, clearCache } = useGalleryCache();

  const queryOpts = orpc.gallery.getAllPosts.queryOptions({ input: { limit: 50 } });
  const { data, isPending, isError, refetch } = useQuery(queryOpts);

  const [refreshing, setRefreshing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Cache latest 10 posts when data loads (only when data changes, not on every render)
  React.useEffect(() => {
    if (data?.items && data.items.length > 0) {
      const postsToCache = data.items.map((item: any) => ({
        id: item.id,
        url: item.url,
        type: item.type,
        createdAt: item.createdAt,
      }));
      cacheLatestMedia(postsToCache);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.items]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Clear cache on manual refresh to force re-download of latest media
    await clearCache();
    await refetch();
    setRefreshing(false);
  }, [refetch, clearCache]);

  const handleAddMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const isVideo = asset.mimeType?.startsWith('video/') || asset.type?.startsWith('video/');
    setUploading(true);
    try {
      await uploadGalleryMedia({
        uri: asset.uri,
        type: asset.mimeType,
        fileName: asset.fileName,
        mediaType: isVideo ? 'video' : 'image',
      });
      queryClient.invalidateQueries({ queryKey: queryOpts.queryKey });
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

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
  const { left, right, heights } = useMasonryColumns(posts);

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
            onPress={handleAddMedia}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#0a2e16" />
            ) : (
              <Plus size={20} color="#0a2e16" />
            )}
          </Pressable>
        </View>
      </View>

      {isPending ? (
        <GallerySkeleton />
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
            <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 8 }}>
            {posts.length === 0 ? (
              <View className="items-center py-16">
                <Text className="text-slate-400 text-sm">No posts yet. Be the first!</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: GRID_GAP }}>
                {/* Left column */}
                <View style={{ flex: 1, gap: GRID_GAP }}>
                  {left.map((post) => (
                    <MasonryCard
                      key={post.id}
                      post={post}
                      height={heights[post.id]}
                      isAdmin={isAdmin}
                      isOwner={isOwner}
                      onReact={handleReact}
                      onDelete={(id: string) => deletePostMutation.mutate({ id })}
                      getCachedUrl={getCachedUrl}
                    />
                  ))}
                </View>
                {/* Right column */}
                <View style={{ flex: 1, gap: GRID_GAP }}>
                  {right.map((post) => (
                    <MasonryCard
                      key={post.id}
                      post={post}
                      height={heights[post.id]}
                      isAdmin={isAdmin}
                      isOwner={isOwner}
                      onReact={handleReact}
                      getCachedUrl={getCachedUrl}
                      onDelete={(id: string) => deletePostMutation.mutate({ id })}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}
      </SafeAreaView>
    </AnimatedTabScreen>
  );
}
