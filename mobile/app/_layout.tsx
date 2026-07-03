import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/lib/auth";
import { useTheme } from "../src/theme";

function RootNavigator() {
  const colors = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", color: colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: "AI Knowledge Assistant" }} />
      <Stack.Screen name="sign-in" options={{ title: "Sign In", presentation: "modal" }} />
      <Stack.Screen name="demo" options={{ title: "Demo Chat" }} />
      <Stack.Screen name="chat" options={{ title: "Chat" }} />
      <Stack.Screen name="documents" options={{ title: "Documents" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
    </SafeAreaProvider>
  );
}
