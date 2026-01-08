import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@trackdev/api-client';
import * as SecureStore from 'expo-secure-store';
import { useCallback } from 'react';

const TOKEN_KEY = 'trackdev_token';

export default function RootLayout() {
  const getStoredToken = useCallback(async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  }, []);

  const setStoredToken = useCallback(async (token: string | null) => {
    try {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      // Handle error silently
    }
  }, []);

  return (
    <AuthProvider
      baseUrl={process.env.EXPO_PUBLIC_API_URL}
      getStoredToken={getStoredToken}
      setStoredToken={setStoredToken}
    >
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign In', headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Create Account', headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
