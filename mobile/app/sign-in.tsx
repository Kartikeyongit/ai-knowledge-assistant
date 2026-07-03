import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../src/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();
  const colors = useTheme();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const onSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Authentication failed. Please try again.";
      Alert.alert("Sign In Failed", errMsg);
    }
    setLoading(false);
  }, [startOAuthFlow, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, { paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to access your documents and conversations</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]} onPress={onSignIn} disabled={loading} accessibilityLabel="Continue with Google" accessibilityRole="button">
          {loading ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={[styles.buttonText, { color: colors.background }]}>Continue with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 32, lineHeight: 24, maxWidth: 340 },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
});
