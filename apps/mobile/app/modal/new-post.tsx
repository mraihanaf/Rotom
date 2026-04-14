import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/api';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Image,
  Pressable,
  View,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function NewPostScreen() {
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<any>(null);
  const [uploading, setUploading] = React.useState(false);

  const createMutation = useMutation({
    ...orpc.gallery.createPost.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.gallery.getAllPosts.queryOptions({ input: { limit: 50 } }).queryKey });
      router.back();
      Alert.alert('Success', 'Photo uploaded successfully!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Failed to upload photo.');
    },
  });

  const pickImage = async () => {
    // Request permissions first
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      // Create a file-like object for upload
      const fileInfo = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      };
      setSelectedFile(fileInfo);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a photo first.');
      return;
    }

    setUploading(true);
    createMutation.mutate(selectedFile as any);
    setUploading(false);
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
        {/* Image Preview */}
        <Pressable
          onPress={pickImage}
          className="aspect-[4/3] rounded-2xl bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300"
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} className="w-full h-full rounded-2xl" resizeMode="cover" />
          ) : (
            <View className="items-center gap-3">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                <ImageIcon size={32} color="#13ec5b" />
              </View>
              <Text className="text-gray-500 font-medium">Tap to select a photo</Text>
            </View>
          )}
        </Pressable>

        {/* Info */}
        <View className="bg-blue-50 rounded-xl p-4">
          <Text className="text-sm text-blue-700">
            Photos will be uploaded and converted to WebP format for better compression.
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <View className="px-4 pb-8 pt-4 border-t border-gray-200">
        <Button
          onPress={handleSubmit}
          disabled={!selectedFile || uploading || createMutation.isPending}
          className="w-full h-14 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Upload size={20} color="#0a2e16" />
          <Text className="text-lg font-bold tracking-tight" style={{ color: '#0a2e16' }}>
            {uploading || createMutation.isPending ? 'Uploading...' : 'Upload Photo'}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
