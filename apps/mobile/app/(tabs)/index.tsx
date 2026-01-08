import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth, projectsApi, useQuery } from '@trackdev/api-client';
import { FolderKanban, Users, Calendar, Layers } from 'lucide-react-native';
import { useState, useCallback } from 'react';

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuth();
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

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome */}
      <View className="bg-primary-600 px-4 pb-8 pt-4">
        <Text className="text-lg text-primary-100">Welcome back,</Text>
        <Text className="text-2xl font-bold text-white">{user?.username}</Text>
      </View>

      {/* Stats */}
      <View className="flex-row flex-wrap gap-4 p-4">
        <View className="flex-1 min-w-[45%] rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <FolderKanban size={20} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-sm text-gray-600">Projects</Text>
              <Text className="text-xl font-bold text-gray-900">
                {isLoading ? '-' : projects?.length || 0}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1 min-w-[45%] rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Users size={20} color="#22c55e" />
            </View>
            <View>
              <Text className="text-sm text-gray-600">Teams</Text>
              <Text className="text-xl font-bold text-gray-900">
                {isLoading ? '-' : projects?.length || 0}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1 min-w-[45%] rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Calendar size={20} color="#a855f7" />
            </View>
            <View>
              <Text className="text-sm text-gray-600">Sprints</Text>
              <Text className="text-xl font-bold text-gray-900">-</Text>
            </View>
          </View>
        </View>

        <View className="flex-1 min-w-[45%] rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Layers size={20} color="#f97316" />
            </View>
            <View>
              <Text className="text-sm text-gray-600">Tasks</Text>
              <Text className="text-xl font-bold text-gray-900">-</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View className="p-4">
        <Text className="mb-4 text-lg font-semibold text-gray-900">
          Recent Projects
        </Text>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : projects && projects.length > 0 ? (
          <View className="gap-3">
            {projects.slice(0, 5).map((project) => (
              <View
                key={project.id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <Text className="font-medium text-gray-900">{project.name}</Text>
                <Text className="mt-1 text-sm text-gray-500">
                  {project.course?.subject?.name} - {project.course?.startYear}
                </Text>
                <View className="mt-3 flex-row -space-x-2">
                  {project.members?.slice(0, 4).map((member) => (
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
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center rounded-xl bg-white py-8">
            <FolderKanban size={48} color="#d1d5db" />
            <Text className="mt-4 text-gray-500">No projects found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
