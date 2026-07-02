import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { type ReactNode, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from "react-native";
import { useTheme } from "../theme";
import { setAuthTokenGetter } from "./api";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <AuthGate>{children}</AuthGate>
    </ClerkProvider>
  );
}

function SplashScreen() {
  const colors = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: colors.background }]}>
      <Text style={[styles.splashTitle, { color: colors.text }]}>AI Knowledge Assistant</Text>
      <ActivityIndicator size="large" color={colors.textSecondary} style={{ marginTop: 20 }} />
    </View>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [isLoaded, getToken]);

  if (!isLoaded) return <SplashScreen />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, alignItems: "center", justifyContent: "center",
  },
  splashTitle: {
    fontSize: 24, fontWeight: "700",
  },
});
