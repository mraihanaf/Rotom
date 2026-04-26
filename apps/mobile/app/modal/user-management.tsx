import { Stack, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Pressable } from '@/tw';
import { ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/api';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { authClient } from '@/lib/auth-client';
import { ChevronLeft, Users, Shield, User, Wrench, GraduationCap, Check, Clock, X } from 'lucide-react-native';
import { Image } from 'expo-image';

const ROLES = [
  { value: 'admin', label: 'Admin', icon: Shield, color: '#dc2626' },
  { value: 'maintainer', label: 'Maintainer', icon: Wrench, color: '#ea580c' },
  { value: 'mentor', label: 'Mentor', icon: GraduationCap, color: '#0891b2' },
  { value: 'user', label: 'User', icon: User, color: '#16a34a' },
] as const;

type RoleValue = typeof ROLES[number]['value'];

interface UserItem {
  id: string;
  name: string;
  image: string | null;
  role: string;
}

function RoleBadge({ role }: { role: string }) {
  const roleConfig = ROLES.find(r => r.value === role) || ROLES[3];
  const Icon = roleConfig.icon;
  
  return (
    <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: `${roleConfig.color}20` }}>
      <Icon size={12} color={roleConfig.color} />
      <Text className="text-xs font-semibold" style={{ color: roleConfig.color }}>
        {roleConfig.label}
      </Text>
    </View>
  );
}

function UserCard({
  user,
  currentUserId,
  onRoleChange,
  isUpdating,
}: {
  user: UserItem;
  currentUserId: string;
  onRoleChange: (userId: string, role: RoleValue) => void;
  isUpdating: boolean;
}) {
  const isSelf = user.id === currentUserId;
  const [selectedRole, setSelectedRole] = useState<RoleValue>(user.role as RoleValue);
  const hasChanges = selectedRole !== user.role;

  return (
    <View className="bg-white rounded-xl p-4 border border-gray-100">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden">
          {user.image ? (
            <Image
              source={{ uri: user.image }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-gray-200">
              <User size={20} color="#6b7280" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{user.name}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <RoleBadge role={user.role} />
            {isSelf && (
              <View className="px-2 py-0.5 rounded-full bg-blue-100">
                <Text className="text-xs font-medium text-blue-600">You</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Role Selector */}
      <View className="mt-4">
        <Text className="text-sm font-medium text-gray-600 mb-2">Change Role</Text>
        <View className="flex-row flex-wrap gap-2">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            const isDisabled = isSelf || isUpdating;

            return (
              <Pressable
                key={role.value}
                onPress={() => {
                  if (!isDisabled) {
                    setSelectedRole(role.value);
                  }
                }}
                disabled={isDisabled}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 bg-gray-50'
                } ${isDisabled ? 'opacity-50' : ''}`}
              >
                <Icon size={14} color={isSelected ? '#0fae43' : role.color} />
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  {role.label}
                </Text>
                {isSelected && <Check size={14} color="#0fae43" />}
              </Pressable>
            );
          })}
        </View>
        {isSelf && (
          <Text className="text-xs text-gray-500 mt-2 italic">
            You cannot change your own role
          </Text>
        )}
      </View>

      {/* Save Button */}
      {hasChanges && !isSelf && (
        <Button
          onPress={() => onRoleChange(user.id, selectedRole)}
          disabled={isUpdating}
          className="mt-3 w-full"
          size="sm"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-medium">Save Changes</Text>
          )}
        </Button>
      )}
    </View>
  );
}

export default function UserManagementModal() {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'name-requests'>('users');

  const { data, isLoading, error } = useQuery(
    orpc.users.getAll.queryOptions({ input: { limit: 50 } })
  );

  const { data: nameRequests, isLoading: isLoadingNameRequests, refetch: refetchNameRequests } = useQuery(
    orpc.profiles.getPendingNameChangeRequests.queryOptions()
  );

  const updateMutation = useMutation({
    ...orpc.users.updateRole.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.users.getAll.key() });
      setUpdatingUserId(null);
      Alert.alert('Success', 'User role updated successfully');
    },
    onError: (error: any) => {
      setUpdatingUserId(null);
      Alert.alert('Error', error?.message || 'Failed to update user role');
    },
  });

  const approveNameMutation = useMutation({
    ...orpc.profiles.approveNameChangeRequest.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.profiles.getPendingNameChangeRequests.key() });
      Alert.alert('Success', 'Name change request approved');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to approve name change');
    },
  });

  const rejectNameMutation = useMutation({
    ...orpc.profiles.rejectNameChangeRequest.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.profiles.getPendingNameChangeRequests.key() });
      Alert.alert('Success', 'Name change request rejected');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to reject name change');
    },
  });

  const handleRoleChange = useCallback(
    (userId: string, role: RoleValue) => {
      setUpdatingUserId(userId);
      updateMutation.mutate({ id: userId, role });
    },
    [updateMutation]
  );

  const handleApproveName = (requestId: string) => {
    Alert.alert(
      'Approve Name Change',
      'Are you sure you want to approve this name change request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', style: 'default', onPress: () => approveNameMutation.mutate({ requestId }) },
      ]
    );
  };

  const handleRejectName = (requestId: string) => {
    Alert.alert(
      'Reject Name Change',
      'Are you sure you want to reject this name change request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectNameMutation.mutate({ requestId }) },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-lg font-semibold text-red-600">Access Denied</Text>
          <Text className="text-gray-600 text-center mt-2">
            Only admins can manage user roles.
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
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0fae43" />
          <Text className="mt-4 text-gray-600">Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#f6f8f6]" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-lg font-semibold text-red-600">Error</Text>
          <Text className="text-gray-600 text-center mt-2">
            Failed to load users. Please try again.
          </Text>
          <Button className="mt-4" onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const users = data?.items || [];

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8f6]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <Pressable
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-100"
        >
          <ChevronLeft size={20} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold">User Management</Text>
        <View className="w-10" />
      </View>

      {/* Tab Switcher */}
      <View className="flex-row bg-white border-b border-gray-200">
        <Pressable
          onPress={() => setActiveTab('users')}
          className={`flex-1 py-3 ${activeTab === 'users' ? 'border-b-2 border-primary' : ''}`}
        >
          <Text className={`text-center font-medium ${activeTab === 'users' ? 'text-primary' : 'text-gray-500'}`}>
            Users
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('name-requests')}
          className={`flex-1 py-3 ${activeTab === 'name-requests' ? 'border-b-2 border-primary' : ''}`}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Text className={`text-center font-medium ${activeTab === 'name-requests' ? 'text-primary' : 'text-gray-500'}`}>
              Name Requests
            </Text>
            {nameRequests && nameRequests.length > 0 && (
              <View className="bg-red-500 rounded-full px-2 py-0.5">
                <Text className="text-white text-xs font-bold">{nameRequests.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {activeTab === 'users' ? (
          <>
            {/* Info Card */}
            <View className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <View className="flex-row items-center gap-2 mb-1">
                <Users size={18} color="#2563eb" />
                <Text className="font-semibold text-blue-700">Manage User Roles</Text>
              </View>
              <Text className="text-sm text-blue-600">
                Click on a role to change it, then tap Save Changes. You cannot change your own role.
              </Text>
            </View>

            {/* User List */}
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user as UserItem}
                currentUserId={currentUserId || ''}
                onRoleChange={handleRoleChange}
                isUpdating={updatingUserId === user.id}
              />
            ))}
          </>
        ) : (
          <>
            {/* Name Requests Info Card */}
            <View className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <View className="flex-row items-center gap-2 mb-1">
                <Clock size={18} color="#d97706" />
                <Text className="font-semibold text-amber-700">Pending Name Changes</Text>
              </View>
              <Text className="text-sm text-amber-600">
                Review and approve or reject name change requests from users.
              </Text>
            </View>

            {/* Name Request List */}
            {isLoadingNameRequests ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#0fae43" />
                <Text className="mt-4 text-gray-600">Loading name requests...</Text>
              </View>
            ) : nameRequests && nameRequests.length > 0 ? (
              nameRequests.map((request) => (
                <View key={request.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden">
                      {request.user.image ? (
                        <Image
                          source={{ uri: request.user.image }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center bg-gray-200">
                          <User size={20} color="#6b7280" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{request.user.name}</Text>
                      <Text className="text-sm text-gray-500">{request.user.email}</Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <Text className="text-xs text-gray-400">Requested:</Text>
                        <Text className="text-xs font-medium text-primary">{request.requestedName}</Text>
                      </View>
                      <Text className="text-xs text-gray-400 mt-1">
                        {new Date(request.requestedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2 mt-4">
                    <Button
                      onPress={() => handleApproveName(request.id)}
                      disabled={approveNameMutation.isPending || rejectNameMutation.isPending}
                      className="flex-1 bg-primary"
                      size="sm"
                    >
                      {approveNameMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Check size={16} color="#fff" />
                          <Text className="text-white font-medium ml-1">Approve</Text>
                        </>
                      )}
                    </Button>
                    <Button
                      onPress={() => handleRejectName(request.id)}
                      disabled={approveNameMutation.isPending || rejectNameMutation.isPending}
                      variant="outline"
                      className="flex-1 border-red-200"
                      size="sm"
                    >
                      {rejectNameMutation.isPending ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <>
                          <X size={16} color="#ef4444" />
                          <Text className="text-red-500 font-medium ml-1">Reject</Text>
                        </>
                      )}
                    </Button>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-8">
                <Text className="text-gray-500">No pending name change requests</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
