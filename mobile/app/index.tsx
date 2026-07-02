import { useAuth } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../src/theme";

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}>
        <View style={styles.hero}>
          <Text style={[styles.title, { color: colors.text }]}>AI Knowledge Assistant</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Upload documents and chat with them using AI-powered semantic search
          </Text>
        </View>

        <View style={styles.actions}>
          {isSignedIn ? (
            <>
              <Link href="/chat" asChild>
                <TouchableOpacity
                  style={StyleSheet.flatten([styles.primaryButton, { backgroundColor: colors.primary }])}
                  accessibilityLabel="Start chatting"
                  accessibilityRole="button"
                >
                  <Text style={StyleSheet.flatten([styles.primaryButtonText, { color: colors.background }])}>Start Chatting</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/documents" asChild>
                <TouchableOpacity
                  style={StyleSheet.flatten([styles.secondaryButton, { borderColor: colors.border }])}
                  accessibilityLabel="View documents"
                  accessibilityRole="button"
                >
                  <Text style={StyleSheet.flatten([styles.secondaryButtonText, { color: colors.text }])}>Documents</Text>
                </TouchableOpacity>
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" asChild>
                <TouchableOpacity
                  style={StyleSheet.flatten([styles.primaryButton, { backgroundColor: colors.primary }])}
                  accessibilityLabel="Sign in"
                  accessibilityRole="button"
                >
                  <Text style={StyleSheet.flatten([styles.primaryButtonText, { color: colors.background }])}>Sign In</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/demo" asChild>
                <TouchableOpacity
                  style={StyleSheet.flatten([styles.secondaryButton, { borderColor: colors.border }])}
                  accessibilityLabel="Try demo"
                  accessibilityRole="button"
                >
                  <Text style={StyleSheet.flatten([styles.secondaryButtonText, { color: colors.text }])}>Try Demo</Text>
                </TouchableOpacity>
              </Link>
            </>
          )}
        </View>

        <View style={styles.features}>
          <FeatureItem colors={colors} title="Upload Documents" description="PDF, TXT, Markdown support" />
          <FeatureItem colors={colors} title="Semantic Search" description="Vector embeddings find relevant content" />
          <FeatureItem colors={colors} title="AI Answers" description="Powered by Llama 3 with source citations" />
        </View>
      </ScrollView>
    </View>
  );
}

const FEATURE_ICONS: Record<string, string> = {
  "Upload Documents": "\uD83D\uDCC4",
  "Semantic Search": "\uD83D\uDD0D",
  "AI Answers": "\uD83E\uDD16",
};

function FeatureItem({ colors, title, description }: { colors: ReturnType<typeof useTheme>; title: string; description: string }) {
  return (
    <View style={[styles.feature, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}>
      <Text style={styles.featureIcon}>{FEATURE_ICONS[title] || "\u2728"}</Text>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  hero: { paddingTop: 40, paddingBottom: 32, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "700", textAlign: "center", marginBottom: 12, letterSpacing: -0.5, maxWidth: 360 },
  subtitle: { fontSize: 16, textAlign: "center", lineHeight: 22, paddingHorizontal: 8, maxWidth: 360 },
  actions: { marginBottom: 32, width: "100%" },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    minHeight: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
    minHeight: 52,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: "600" },
  features: { paddingBottom: 16 },
  feature: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  featureIcon: { fontSize: 28, marginBottom: 8 },
  featureTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  featureDesc: { fontSize: 13 },
});