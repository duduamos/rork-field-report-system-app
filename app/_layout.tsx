import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ReportsProvider } from "@/contexts/ReportsContext";

SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('[Splash] preventAutoHideAsync failed');
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string;
    const inLogin = firstSegment === 'login';

    if (!user && !inLogin) {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        console.log('[AuthGate] No user, redirecting to login');
        router.replace('/login' as any);
      }
    } else if (user && inLogin) {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        console.log('[AuthGate] User found, redirecting to tabs');
        router.replace('/(tabs)/(reports)' as any);
      }
    } else {
      hasNavigated.current = false;
    }
  }, [user, isLoading]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerBackTitle: "חזור" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ReportsProvider>
          <RootLayoutNav />
        </ReportsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
