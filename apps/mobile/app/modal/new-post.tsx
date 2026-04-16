import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { orpc, uploadGalleryMedia } from '@/lib/api';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Image as ImageIcon, Upload, Video, X } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, ActivityIndicator } from 'react-native';
import { View, Pressable } from '@/tw';
import { useQueryClient } from '@tanstack/react-query';

const MAX_VIDEO_DURATION = 30; // seconds

export default function NewPostScreen() {
  const queryClient = useQueryClient();
  const [selectedUri, setSelectedUri] = React.useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = React.useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [mediaType, setMediaType] = React.useState<'image' | 'video'>('image');
  const [processing, setProcessing] = React.useState(false);

  const pickMedia = async (type: 'image' | 'video') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    setProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' ? ['videos'] : ['images'],
        allowsEditing: type === 'image',
        aspect: type === 'image' ? [4, 3] : undefined,
        quality: type === 'image' ? 0.8 : undefined,
        videoMaxDuration: MAX_VIDEO_DURATION,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        if (type === 'video' && asset.duration) {
          if (asset.duration > MAX_VIDEO_DURATION) {
            Alert.alert(
              'Video too long',
              `Please select a video that is ${MAX_VIDEO_DURATION} seconds or shorter.`
            );
            setProcessing(false);
            return;
          }
        }

        setMediaType(type);
        setSelectedUri(asset.uri);
        setSelectedAsset(asset);
      }
    } finally {
      setProcessing(false);
    }
  };

  const clearSelection = () => {
    setSelectedUri(null);
    setSelectedAsset(null);
    setMediaType('image');
  };

  const handleSubmit = async () => {
    if (!selectedAsset) {
      Alert.alert('Error', 'Please select a photo or video first.');
      return;
    }

    setUploading(true);
    try {
      await uploadGalleryMedia({
        uri: selectedAsset.uri,
        type: selectedAsset.mimeType,
        fileName: selectedAsset.fileName,
        mediaType,
      });
      queryClient.invalidateQueries({ queryKey: orpc.gallery.getAllPosts.queryOptions({ input: { limit: 50 } }).queryKey });
      router.back();
      Alert.alert('Success', `${mediaType === 'video' ? 'Video' : 'Photo'} uploaded successfully!`);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? `Failed to upload ${mediaType}.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">New Post</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="flex-1 px-4 pt-6 gap-6">
        {/* Media Selection Buttons */}
        {!selectedUri && (
          <View className="flex-row gap-4">
            <Pressable
              onPress={() => pickMedia('image')}
              disabled={processing}
              className="flex-1 aspect-square rounded-2xl bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300"
            >
              <View className="items-center gap-3">
                <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                  <ImageIcon size={32} color="#13ec5b" />
                </View>
                <Text className="text-gray-500 font-medium">Photo</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => pickMedia('video')}
              disabled={processing}
              className="flex-1 aspect-square rounded-2xl bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300"
            >
              <View className="items-center gap-3">
                <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                  <Video size={32} color="#13ec5b" />
                </View>
                <Text className="text-gray-500 font-medium">Video (30s)</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Selected Preview */}
        {selectedUri && (
          <View className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black">
            <Image source={{ uri: selectedUri }} className="w-full h-full" resizeMode="contain" />
            <Pressable
              onPress={clearSelection}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
            >
              <X size={18} color="#fff" />
            </Pressable>
            {mediaType === 'video' && (
              <View className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-medium">Video</Text>
              </View>
            )}
          </View>
        )}

        {/* Info */}
        <View className="bg-blue-50 rounded-xl p-4">
          <Text className="text-sm text-blue-700">
            {mediaType === 'video'
              ? 'Videos up to 30 seconds at 1080p quality are supported.'
              : 'Photos will be uploaded and converted to WebP format for better compression.'}
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <View className="px-4 pb-8 pt-4 border-t border-gray-200">
        <Button
          onPress={handleSubmit}
          disabled={!selectedAsset || uploading}
          className="w-full h-14 rounded-xl flex-row items-center justify-center gap-2"
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#0a2e16" />
          ) : (
            <Upload size={20} color="#0a2e16" />
          )}
          <Text className="text-lg font-bold tracking-tight" style={{ color: '#0a2e16' }}>
            {uploading ? 'Uploading...' : `Upload ${mediaType === 'video' ? 'Video' : 'Photo'}`}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
