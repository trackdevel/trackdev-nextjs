import { ApiClientError, useAuth } from "@trackdev/api-client";
import { Link, useRouter } from "expo-router";
import { AlertCircle, Layers, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    try {
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.body?.message || "Invalid email or password");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center">
          <Link href="/">
            <View className="flex-row items-center gap-2">
              <Layers size={40} color="#3b82f6" />
              <Text className="text-2xl font-bold text-gray-900">TrackDev</Text>
            </View>
          </Link>
          <Text className="mt-6 text-2xl font-bold text-gray-900">
            Sign in to your account
          </Text>
        </View>

        {/* Form */}
        <View className="mt-8 gap-4">
          {error && (
            <View className="flex-row items-center gap-2 rounded-lg bg-red-50 p-4">
              <AlertCircle size={20} color="#dc2626" />
              <Text className="flex-1 text-sm text-red-700">{error}</Text>
            </View>
          )}

          <View>
            <Text className="mb-1 text-sm font-medium text-gray-700">
              Email address
            </Text>
            <View className="flex-row items-center rounded-lg border border-gray-300 bg-white px-3">
              <Mail size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 pl-2 text-base text-gray-900"
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          <View>
            <Text className="mb-1 text-sm font-medium text-gray-700">
              Password
            </Text>
            <View className="flex-row items-center rounded-lg border border-gray-300 bg-white px-3">
              <Lock size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 pl-2 text-base text-gray-900"
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className="mt-4 items-center justify-center rounded-xl bg-primary-600 py-4 active:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Sign in
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
