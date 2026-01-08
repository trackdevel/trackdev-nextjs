import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth, projectsApi, useQuery } from '@trackdev/api-client';
import { useRouter } from 'expo-router';
import { FolderKanban, ChevronRight } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import type { Project } from '@trackdev/types';

export default function ProjectsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: projects,
    isLoading,
    refetch,
  } = useQuery(() => projectsApi.getAll(), [], {
    enabled: isAuthenticated,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderProject = ({ item }: { item: Project }) => (
    <Pressable
      onPress={() => {
        // Navigate to project details
        // router.push(`/project/${item.id}`);
      }}
      className="mb-3 rounded-xl bg-white p-4 shadow-sm active:bg-gray-50"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-medium text-gray-900">{item.name}</Text>
          <Text className="mt-1 text-sm text-gray-500">
            {item.course?.subject?.name} - {item.course?.startYear}
          </Text>
        </View>
        <ChevronRight size={20} color="#9ca3af" />
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row -space-x-2">
          {item.members?.slice(0, 4).map((member) => (
            <View
              key={member.id}
              className="h-8 w-8 items-center justify-center rounded-full border-2 border-white"
              style={{ backgroundColor: member.color || '#3b82f6' }}
            >
              <Text className="text-xs font-medium text-white">
                {member.capitalLetters || member.username?.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          ))}
          {(item.members?.length || 0) > 4 && (
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200">
              <Text className="text-xs font-medium text-gray-600">
                +{item.members!.length - 4}
              </Text>
            </View>
          )}
        </View>

        {item.qualification !== undefined && (
          <View className="rounded-lg bg-primary-100 px-2 py-1">
            <Text className="text-sm font-medium text-primary-700">
              {item.qualification}/10
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={projects || []}
        renderItem={renderProject}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <FolderKanban size={64} color="#d1d5db" />
            <Text className="mt-4 text-lg font-medium text-gray-500">
              No projects found
            </Text>
            <Text className="mt-1 text-center text-gray-400">
              You'll see your projects here once you're added to one
            </Text>
          </View>
        }
      />
    </View>
  );
}
