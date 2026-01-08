import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@trackdev/api-client';
import { useEffect } from 'react';
import { Layers, ArrowRight } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      {/* Logo */}
      <View className="flex-row items-center justify-center gap-2 pt-12">
        <Layers size={48} color="#3b82f6" />
        <Text className="text-3xl font-bold text-gray-900">TrackDev</Text>
      </View>

      {/* Hero */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-center text-2xl font-bold text-gray-900">
          Agile Project Management
        </Text>
        <Text className="mt-2 text-center text-xl text-primary-600">
          for Education
        </Text>
        <Text className="mt-6 px-4 text-center text-base text-gray-600">
          Learn agile methodologies by working together on real projects. 
          Manage sprints, tasks, and track your team's progress.
        </Text>
      </View>

      {/* Buttons */}
      <View className="gap-3 pb-12">
        <Link href="/register" asChild>
          <Pressable className="flex-row items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-4 active:bg-primary-700">
            <Text className="text-base font-semibold text-white">Get Started</Text>
            <ArrowRight size={20} color="white" />
          </Pressable>
        </Link>

        <Link href="/login" asChild>
          <Pressable className="flex-row items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-4 active:bg-gray-50">
            <Text className="text-base font-semibold text-gray-700">Sign In</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
