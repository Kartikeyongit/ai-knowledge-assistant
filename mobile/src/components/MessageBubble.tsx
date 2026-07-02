import { memo, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Message } from "../lib/api";
import { Markdown } from "./Markdown";
import { useTheme } from "../theme";

type Source = { title: string; document_id: string; content: string; similarity: number };

export const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const colors = useTheme();
  const parsedSources: Source[] = message.sources
    ? (() => { try { return typeof message.sources === "string" ? JSON.parse(message.sources) : message.sources; } catch { return []; } })()
    : [];

  const isError = message.id.startsWith("err-");
  const isUser = message.role === "user";

  const timeStr = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isUser) {
    return (
      <View style={styles.rowRight} accessibilityRole="text" accessibilityLabel={`You: ${message.content}`}>
        <View style={[styles.userBubble, { backgroundColor: colors.userBubble }]}>
          <Text style={[styles.userText, { color: "#fff" }]}>{message.content}</Text>
          <Text style={[styles.timestamp, { color: "rgba(255,255,255,0.5)" }]}>{timeStr}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowLeft} accessibilityRole="text" accessibilityLabel={`Assistant: ${message.content.substring(0, 100)}${message.content.length > 100 ? "..." : ""}`}>
      <View style={[styles.aiBubble, isError && { borderWidth: 1, borderColor: colors.dangerLight }]}>
        {isError && <Text style={{ fontWeight: "700", color: colors.danger, marginRight: 4 }}>!</Text>}
        {isError ? (
          <Text style={{ color: colors.danger, fontSize: 15, lineHeight: 21 }}>{message.content}</Text>
        ) : (
          <Markdown content={message.content} colors={colors} />
        )}
        {parsedSources.length > 0 && !isError && (
          <TouchableOpacity onPress={() => setSourcesOpen(!sourcesOpen)} style={[styles.sourcesToggle, { borderTopColor: colors.border }]} accessibilityLabel={sourcesOpen ? "Hide sources" : `Show sources (${parsedSources.length})`} accessibilityRole="button">
            <Text style={[styles.sourcesToggleText, { color: colors.textTertiary }]}>
              {sourcesOpen ? "\u25BC" : "\u25B6"} Sources ({parsedSources.length})
            </Text>
          </TouchableOpacity>
        )}
        {sourcesOpen && parsedSources.length > 0 && (
          <View style={styles.sourcesList}>
            {parsedSources.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.sourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => Alert.alert(s.title, s.content)} accessibilityLabel={`Source: ${s.title}`} accessibilityRole="button">
                <Text style={[styles.sourceTitle, { color: colors.text }]} numberOfLines={1}>{s.title}</Text>
                <Text style={[styles.sourceContent, { color: colors.textSecondary }]} numberOfLines={2}>{s.content}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{timeStr}</Text>
      </View>
    </View>
  );
});

export function LoadingDots() {
  const [step, setStep] = useState(0);
  const colors = useTheme();
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 4), 300);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <View style={[styles.loadingBubble, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: colors.textTertiary }, { opacity: step >= 1 ? 1 : 0.3 }]} />
          <View style={[styles.dot, { backgroundColor: colors.textTertiary }, { opacity: step >= 2 ? 1 : 0.3 }]} />
          <View style={[styles.dot, { backgroundColor: colors.textTertiary }, { opacity: step >= 3 ? 1 : 0.3 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowRight: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 },
  rowLeft: { marginBottom: 10, paddingHorizontal: 18 },
  userBubble: {
    borderRadius: 18, borderBottomRightRadius: 6,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: "80%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  userText: { fontSize: 15, lineHeight: 21 },
  aiBubble: {
    paddingVertical: 4,
  },
  sourcesToggle: { marginTop: 8, paddingTop: 6, borderTopWidth: 1 },
  sourcesToggleText: { fontSize: 12, fontWeight: "600" },
  sourcesList: { marginTop: 6 },
  sourceCard: {
    borderRadius: 8, padding: 8, borderWidth: 1, marginBottom: 6,
  },
  timestamp: { fontSize: 11, marginTop: 4, textAlign: "right" },
  sourceTitle: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  sourceContent: { fontSize: 11 },
  loadingContainer: { paddingHorizontal: 18, marginBottom: 10 },
  loadingBubble: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, alignSelf: "flex-start",
  },
  dotsRow: { flexDirection: "row", alignItems: "center", height: 8 },
  dot: {
    width: 10, height: 10, borderRadius: 99, marginRight: 4,
  },
});
