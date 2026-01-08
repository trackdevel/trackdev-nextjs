import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { usersApi, ApiClientError } from '@trackdev/api-client';
import { Layers, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await usersApi.register({ username, email, password });
      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.body?.message || 'Registration failed');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <CheckCircle size={64} color="#22c55e" />
        <Text className="mt-4 text-2xl font-bold text-gray-900">
          Registration Successful!
        </Text>
        <Text className="mt-2 text-center text-gray-600">
          Redirecting you to the login page...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            Create your account
          </Text>
          <View className="mt-2 flex-row">
            <Text className="text-sm text-gray-600">Already have an account? </Text>
            <Link href="/login">
              <Text className="text-sm font-medium text-primary-600">
                Sign in
              </Text>
            </Link>
          </View>
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
              Username
            </Text>
            <View className="flex-row items-center rounded-lg border border-gray-300 bg-white px-3">
              <User size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 pl-2 text-base text-gray-900"
                placeholder="johndoe"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
              />
            </View>
          </View>

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
                autoComplete="new-password"
              />
            </View>
          </View>

          <View>
            <Text className="mb-1 text-sm font-medium text-gray-700">
              Confirm Password
            </Text>
            <View className="flex-row items-center rounded-lg border border-gray-300 bg-white px-3">
              <Lock size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 pl-2 text-base text-gray-900"
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={isLoading}
            className="mt-4 items-center justify-center rounded-xl bg-primary-600 py-4 active:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Create account
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
