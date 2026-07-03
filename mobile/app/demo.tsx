import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { api, type Message } from "../src/lib/api";
import { MessageBubble, LoadingDots } from "../src/components/MessageBubble";
import { useTheme } from "../src/theme";

const TYPEWRITER_MS_PER_TICK = 30;
const TYPEWRITER_CHARS_PER_TICK = 4;

export default function DemoScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const convIdRef = useRef(`demo-${Date.now()}`);
  const writeBufRef = useRef("");
  const writeIdxRef = useRef(0);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamMsgIdRef = useRef<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const colors = useTheme();

  function flushTypewriter() {
    const msgId = streamMsgIdRef.current;
    if (!msgId) return;
    const full = writeBufRef.current;
    writeIdxRef.current = full.length;
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, content: full } : m)
    );
  }

  function stopTypewriter(showFull = false) {
    if (typewriterRef.current !== null) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
    if (showFull) flushTypewriter();
  }

  function initTypewriter() {
    stopTypewriter();
    writeIdxRef.current = 0;
    const msgId = "r-" + Date.now();
    streamMsgIdRef.current = msgId;
    setMessages(prev => [
      ...prev,
      {
        id: msgId,
        role: "assistant",
        content: "",
        sources: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setTimeout(() => {
      typewriterRef.current = setInterval(() => {
        const full = writeBufRef.current;
        if (full.length === 0) return;
        const next = Math.min(writeIdxRef.current + TYPEWRITER_CHARS_PER_TICK, full.length);
        if (next >= full.length) {
          stopTypewriter();
          flushTypewriter();
          return;
        }
        writeIdxRef.current = next;
        setMessages(prev =>
          prev.map(m => m.id === msgId ? { ...m, content: full.slice(0, next) } : m)
        );
      }, TYPEWRITER_MS_PER_TICK);
    }, 50);
  }

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    return () => {
      stopTypewriter(true);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setLoading(true);
    Keyboard.dismiss();

    const userMsg: Message = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.demo.send(convIdRef.current, text);
      writeBufRef.current = res.content;
      initTypewriter();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("[Demo] Failed to send message:", errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "Failed to get response. Is the backend running?",
          sources: null,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <View style={[styles.safe, { backgroundColor: colors.background, paddingBottom: 12 }]}>
      <View style={[styles.container, { backgroundColor: colors.background, marginBottom: keyboardHeight }]}>
        <Stack.Screen options={{ title: "Demo Chat" }} />

        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messageList}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="always"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Demo Chat</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Try asking: "What is this?", "How does it work?", or "What technology does it use?"
                </Text>
              </View>
            }
            ListFooterComponent={loading ? <LoadingDots /> : null}
          />
        </View>

        <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about the app..."
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
            multiline
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }, (!input.trim() || loading) && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={[styles.sendText, { color: colors.background }]}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  messageList: { padding: 18, paddingBottom: 16 },
  empty: { alignItems: "center", paddingTop: 72, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  emptyText: { fontSize: 15, textAlign: "center", lineHeight: 22, maxWidth: 360 },
  bar: {
    flexDirection: "row", paddingHorizontal: 14, paddingTop: 14, borderTopWidth: 1,
    alignItems: "flex-end", paddingBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 6,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 15, maxHeight: 110, marginRight: 10, minHeight: 48,
  },
  sendButton: { width: 56, height: 44, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sendText: { fontWeight: "600" },
});
