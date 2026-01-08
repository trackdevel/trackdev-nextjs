import { useAuth } from "@trackdev/api-client";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  LogOut,
  Mail,
  Settings,
  User,
} from "lucide-react-native";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="items-center bg-white px-4 py-8">
        <View
          className="h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: user?.color || "#3b82f6" }}
        >
          <Text className="text-3xl font-bold text-white">
            {user?.capitalLetters || user?.username?.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text className="mt-4 text-xl font-bold text-gray-900">
          {user?.username}
        </Text>
        <Text className="mt-1 text-gray-500">{user?.email}</Text>
      </View>

      {/* Account Section */}
      <View className="mt-6 px-4">
        <Text className="mb-2 text-sm font-medium uppercase text-gray-500">
          Account
        </Text>
        <View className="rounded-xl bg-white">
          <Pressable className="flex-row items-center justify-between border-b border-gray-100 p-4 active:bg-gray-50">
            <View className="flex-row items-center gap-3">
              <User size={20} color="#6b7280" />
              <Text className="text-gray-900">Edit Profile</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between border-b border-gray-100 p-4 active:bg-gray-50">
            <View className="flex-row items-center gap-3">
              <Mail size={20} color="#6b7280" />
              <Text className="text-gray-900">Change Email</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4 active:bg-gray-50">
            <View className="flex-row items-center gap-3">
              <Settings size={20} color="#6b7280" />
              <Text className="text-gray-900">Settings</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
        </View>
      </View>

      {/* Info Section */}
      <View className="mt-6 px-4">
        <Text className="mb-2 text-sm font-medium uppercase text-gray-500">
          Information
        </Text>
        <View className="rounded-xl bg-white p-4">
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Roles</Text>
            <Text className="font-medium text-gray-900">
              {user?.roles.join(", ") || "Student"}
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Last Login</Text>
            <Text className="font-medium text-gray-900">
              {user?.lastLogin
                ? new Date(user.lastLogin).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View className="mt-6 px-4 pb-8">
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-red-50 py-4 active:bg-red-100"
        >
          <LogOut size={20} color="#dc2626" />
          <Text className="font-semibold text-red-600">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
