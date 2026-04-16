import * as React from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = FileSystem.cacheDirectory + 'gallery/';
const CACHE_METADATA_KEY = 'gallery_cache_metadata';
const MAX_CACHED_ITEMS = 10;
const MIN_VIDEO_SIZE = 1024 * 10; // 10KB minimum for videos
const MIN_IMAGE_SIZE = 1024; // 1KB minimum for images

export type CachedMedia = {
  id: string;
  originalUrl: string;
  localUri: string;
  type: 'image' | 'video';
  createdAt: string;
};

export type CacheMetadata = {
  items: CachedMedia[];
  lastUpdated: number;
};

export function useGalleryCache() {
  const [cachedItems, setCachedItems] = React.useState<CachedMedia[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const cachedItemsRef = React.useRef<CachedMedia[]>([]);

  // Keep ref in sync with state
  React.useEffect(() => {
    cachedItemsRef.current = cachedItems;
  }, [cachedItems]);

  // Load cached metadata on mount
  React.useEffect(() => {
    loadCacheMetadata();
  }, []);

  const isFileValid = (fileInfo: FileSystem.FileInfo, type: 'image' | 'video'): boolean => {
    if (!fileInfo.exists) return false;
    const size = (fileInfo as any).size || 0;
    const minSize = type === 'video' ? MIN_VIDEO_SIZE : MIN_IMAGE_SIZE;
    return size >= minSize;
  };

  const loadCacheMetadata = async () => {
    try {
      const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (metadataJson) {
        const metadata: CacheMetadata = JSON.parse(metadataJson);
        // Verify files exist AND are valid (not partial downloads)
        const validItems = await Promise.all(
          metadata.items.map(async (item) => {
            const fileInfo = await FileSystem.getInfoAsync(item.localUri);
            if (isFileValid(fileInfo, item.type)) {
              return item;
            } else {
              // Delete invalid/partial file
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(item.localUri, { idempotent: true }).catch(() => {});
              }
              return null;
            }
          })
        );
        setCachedItems(validItems.filter(Boolean) as CachedMedia[]);
      }
    } catch (error) {
      console.error('[GalleryCache] Error loading metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCacheMetadata = async (items: CachedMedia[]) => {
    try {
      const metadata: CacheMetadata = {
        items,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('[GalleryCache] Error saving metadata:', error);
    }
  };

  const ensureCacheDir = async () => {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  };

  const downloadMedia = async (id: string, url: string, type: 'image' | 'video'): Promise<string | null> => {
    const extension = type === 'video' ? 'mp4' : 'jpg';
    const localUri = CACHE_DIR + `${id}.${extension}`;
    const tempUri = localUri + '.tmp';

    try {
      await ensureCacheDir();

      // Check if already cached and valid
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (isFileValid(fileInfo, type)) {
        return localUri;
      }

      // Delete partial/invalid file if exists
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});
      }

      // Download to temp file first
      const downloadResult = await FileSystem.downloadAsync(url, tempUri);
      if (downloadResult.status === 200) {
        // Verify temp file is valid before moving
        const tempInfo = await FileSystem.getInfoAsync(tempUri);
        if (isFileValid(tempInfo, type)) {
          // Move from temp to final location
          await FileSystem.moveAsync({ from: tempUri, to: localUri });
          return localUri;
        } else {
          // Delete incomplete download
          await FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('[GalleryCache] Error downloading media:', error);
      // Clean up temp file on error
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch {}
      // Clean up partial main file on error
      try {
        const info = await FileSystem.getInfoAsync(localUri);
        if (info.exists && !isFileValid(info, type)) {
          await FileSystem.deleteAsync(localUri, { idempotent: true });
        }
      } catch {}
      return null;
    }
  };

  const cacheLatestMedia = React.useCallback(async (posts: { id: string; url: string; type: string; createdAt: string }[]) => {
    if (!posts || posts.length === 0) return;

    // Take latest 10
    const latestPosts = posts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_CACHED_ITEMS);

    const newCachedItems: CachedMedia[] = [];
    const currentCached = cachedItemsRef.current;

    for (const post of latestPosts) {
      // Check if already cached
      const existingCache = currentCached.find(item => item.id === post.id);
      if (existingCache) {
        newCachedItems.push(existingCache);
        continue;
      }

      // Download and cache
      const mediaType = post.type === 'video' ? 'video' : 'image';
      const localUri = await downloadMedia(post.id, post.url, mediaType);

      if (localUri) {
        newCachedItems.push({
          id: post.id,
          originalUrl: post.url,
          localUri,
          type: mediaType,
          createdAt: post.createdAt,
        });
      }
    }

    // Clean up old cached files not in new list
    const oldItems = currentCached.filter(
      old => !newCachedItems.find(newItem => newItem.id === old.id)
    );
    for (const oldItem of oldItems) {
      try {
        await FileSystem.deleteAsync(oldItem.localUri, { idempotent: true });
      } catch {
        // Ignore errors
      }
    }

    setCachedItems(newCachedItems);
    await saveCacheMetadata(newCachedItems);
  }, []);

  const getCachedUrl = (id: string, originalUrl: string): string => {
    const cached = cachedItems.find(item => item.id === id);
    return cached ? cached.localUri : originalUrl;
  };

  const isCached = (id: string): boolean => {
    return cachedItems.some(item => item.id === id);
  };

  const clearCache = async () => {
    try {
      for (const item of cachedItems) {
        await FileSystem.deleteAsync(item.localUri, { idempotent: true });
      }
      setCachedItems([]);
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
    } catch (error) {
      console.error('[GalleryCache] Error clearing cache:', error);
    }
  };

  return {
    cachedItems,
    isLoading,
    cacheLatestMedia,
    getCachedUrl,
    isCached,
    clearCache,
  };
}
