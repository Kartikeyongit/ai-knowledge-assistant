import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Stack, useFocusEffect, useNavigation } from "expo-router";
import { api, type Conversation, type Document, type Message } from "../src/lib/api";
import { InputBar } from "../src/components/InputBar";
import { MessageBubble, LoadingDots } from "../src/components/MessageBubble";
import { ModeSelector } from "../src/components/ModeSelector";
import { Sidebar } from "../src/components/Sidebar";
import { useTheme } from "../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Mode = "rag" | "agent";

const TYPEWRITER_MS_PER_TICK = 40;
const TYPEWRITER_CHARS_PER_TICK = 5;

/** Shared SSE streaming logic for both RAG and Agent modes */
async function handleStreamingResponse(
  response: Response,
  callbacks: {
    onFirstContent: () => string;
    onContent: (data: string) => void;
    onTitle: (title: string) => void;
    onToolStart?: (tool: string) => void;
    onToolEnd?: () => void;
    onNoSources?: (msg: string) => void;
    scrollToEnd: () => void;
  }
) {
  if (!response.body) throw new Error("No body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assistantMsgId: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === "content") {
          if (!assistantMsgId) {
            assistantMsgId = callbacks.onFirstContent();
          }
          callbacks.onContent(parsed.data);
          callbacks.scrollToEnd();
        } else if (parsed.type === "title") {
          callbacks.onTitle(parsed.data);
        } else if (parsed.type === "tool_start" && callbacks.onToolStart) {
          callbacks.onToolStart(parsed.data.tool);
        } else if (parsed.type === "tool_end" && callbacks.onToolEnd) {
          callbacks.onToolEnd();
        } else if (parsed.type === "no_sources" && callbacks.onNoSources) {
          callbacks.onNoSources(parsed.data);
        }
      } catch {
        // Skip malformed lines
      }
    }
  }
}

export default function ChatScreen() {
  const [conv, setConv] = useState<Conversation | null>(null);
  const [convList, setConvList] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [mode, setMode] = useState<Mode>("rag");
  const [toolEvent, setToolEvent] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const writeBufRef = useRef("");
  const writeIdxRef = useRef(0);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamMsgIdRef = useRef<string | null>(null);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const isNearBottomRef = useRef(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 0);
  }, []);

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

  function startTypewriter(msgId: string) {
    stopTypewriter();
    streamMsgIdRef.current = msgId;
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
  }

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    stopTypewriter(true);
    setLoading(false);
    setStreamActive(false);
    streamMsgIdRef.current = null;
  }, []);

  const toggleSidebar = useCallback(() => {
    Keyboard.dismiss();
    InteractionManager.runAfterInteractions(() => {
      setShowSidebar(prev => !prev);
    });
  }, []);

  // Load documents on focus
  useFocusEffect(
    useCallback(() => {
      api.documents.list()
        .then(res => setDocuments(res.documents))
        .catch(err => console.warn("[Chat] Failed to load documents:", err));
    }, [])
  );

  const createConversation = useCallback(async () => {
    try {
      const newConv = await api.conversations.create("New Conversation", mode);
      setConv(newConv);
      setConvList(prev => {
        const exists = prev.some(c => c.id === newConv.id);
        return exists ? prev : [newConv, ...prev];
      });
      setMessages([]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("[Chat] Failed to create conversation:", errorMessage);
      Alert.alert("Error", "Failed to create conversation. Is the backend running?");
    }
  }, [mode]);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const detail = await api.conversations.get(id);
      setConv({ id: detail.id, title: detail.title, is_demo: 0, mode, created_at: "", updated_at: "" });
      setMessages(detail.messages);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error(`[Chat] Failed to load conversation ${id}:`, errorMessage);
      Alert.alert("Error", "Failed to load conversation");
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await api.conversations.list(mode);
      setConvList(convs);
      await createConversation();
    } catch (e: unknown) {
      const apiError = e as { status?: number };
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("[Chat] Failed to load conversations:", errorMessage);
      if (apiError.status === 401) {
        Alert.alert("Sign In Required", "Please sign in to use the chat feature.");
        return;
      }
      try {
        await createConversation();
      } catch (createErr) {
        console.error("[Chat] Failed to create fallback conversation:", createErr);
        Alert.alert("Error", "Unable to load or create conversations. Please check your connection.");
      }
    } finally {
      setInitialLoading(false);
    }
  }, [mode, loadConversation, createConversation]);

  const refreshConversations = useCallback(async () => {
    try {
      const convs = await api.conversations.list(mode);
      setConvList(convs);
    } catch (e: unknown) {
      const apiError = e as { status?: number };
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("[Chat] Failed to refresh conversations:", errorMessage);
      if (apiError.status === 401) {
        Alert.alert("Sign In Required", "Please sign in to use the chat feature.");
      }
    }
  }, [mode]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    return () => {
      stopTypewriter(true);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  // Reset when mode changes
  const handleModeChange = useCallback((newMode: Mode) => {
    if (newMode === mode) return;
    const switchMode = () => {
      cancelStream();
      setMode(newMode);
      setMessages([]);
      setConv(null);
      setConvList([]);
      setSelectedDocIds([]);
      setInitialLoading(true);
    };
    if (messages.length > 0) {
      Alert.alert(
        "Switch Mode?",
        "Switching modes will clear the current conversation. Unsaved messages will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Switch", style: "destructive", onPress: switchMode },
        ]
      );
    } else {
      switchMode();
    }
  }, [mode, cancelStream, messages.length]);

  const switchConversation = useCallback((c: Conversation) => {
    cancelStream();
    setConv(c);
    setShowSidebar(false);
    loadConversation(c.id);
  }, [cancelStream, loadConversation]);

  const confirmDeleteConversation = useCallback((id: string, title: string) => {
    Alert.alert(
      "Delete Conversation",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteConversation(id) },
      ]
    );
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.conversations.delete(id);
      setConvList(prev => {
        const updated = prev.filter(c => c.id !== id);
        if (conv?.id === id) {
          if (updated.length > 0) {
            switchConversation(updated[0]);
          } else {
            setConv(null);
            setMessages([]);
            createConversation();
          }
        }
        return updated;
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error(`[Chat] Failed to delete conversation ${id}:`, errorMessage);
      Alert.alert("Error", "Failed to delete conversation");
    }
  }, [conv, switchConversation, createConversation]);

  const toggleDocFilter = useCallback((docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !conv) return;

    // Cancel any previous stream before starting a new one
    cancelStream();
    await new Promise(resolve => setTimeout(resolve, 0));

    const text = input.trim();
    setInput("");
    setLoading(true);
    setStreamActive(false);
    setToolEvent(null);
    streamMsgIdRef.current = null;
    writeBufRef.current = "";
    writeIdxRef.current = 0;

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const userMsg: Message = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = mode === "agent"
        ? await api.chat.agentStream(conv.id, text, signal)
        : await api.chat.stream(conv.id, text, selectedDocIds.length > 0 ? selectedDocIds : undefined, signal);

      await handleStreamingResponse(response, {
        onFirstContent: () => {
          const msgId = "r-" + Date.now();
          writeBufRef.current = "";
          writeIdxRef.current = 0;
          setLoading(false);
          setStreamActive(true);
          setMessages(prev => [
            ...prev,
            { id: msgId, role: "assistant", content: "", sources: null, created_at: new Date().toISOString() },
          ]);
          startTypewriter(msgId);
          return msgId;
        },
        onContent: (data: string) => {
          writeBufRef.current += data;
        },
        onTitle: (title: string) => {
          setConv((prev) => prev ? { ...prev, title } : prev);
        },
        onToolStart: (tool: string) => {
          setToolEvent(`Using ${tool}...`);
        },
        onToolEnd: () => {
          setToolEvent(null);
        },
        onNoSources: (msg: string) => {
          writeBufRef.current += `\n\n_${msg}_`;
        },
        scrollToEnd,
      });
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // Normal cancellation — preserve any partial content
        setLoading(false);
        setStreamActive(false);
        streamMsgIdRef.current = null;
        return;
      }
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      console.error("[Chat] Stream error:", errMsg);
      // Replace last assistant message with error, or append if none exists
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && prev[lastIdx].role === "assistant" && !prev[lastIdx].id.startsWith("err-")) {
          const updated = [...prev];
          updated[lastIdx] = { ...updated[lastIdx], content: updated[lastIdx].content + "\n\n*Error: " + errMsg + "*" };
          return updated;
        }
        return [
          ...prev,
          { id: "err-" + Date.now(), role: "assistant", content: "Failed: " + errMsg, sources: null, created_at: new Date().toISOString() },
        ];
      });
    }
    stopTypewriter(true);
    setLoading(false);
    setStreamActive(false);
    streamMsgIdRef.current = null;
  }, [input, conv, mode, selectedDocIds, cancelStream, scrollToEnd]);

  const handleRenameSave = useCallback(async () => {
    const trimmed = renameText.trim();
    if (!trimmed || !conv) return;
    try {
      const updated = await api.conversations.update(conv.id, trimmed);
      setConv(updated);
    } catch {
      // silently fail
    }
    setRenaming(false);
  }, [renameText, conv]);

  // Dynamically update header options when theme or state changes
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => renaming ? (
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }}>Rename Conversation</Text>
      ) : (
        <TouchableOpacity onPress={() => { if (conv) { setRenameText(conv.title); setRenaming(true); } }} style={{ padding: 4, maxWidth: 200 }} accessibilityLabel="Tap to rename conversation" accessibilityRole="button">
          <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }} numberOfLines={1}>{conv?.title || "Chat"}</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => renaming ? (
        <TouchableOpacity onPress={() => setRenaming(false)} style={styles.headerBtn} accessibilityLabel="Cancel rename" accessibilityRole="button" accessibilityHint="Double tap to cancel renaming conversation">
          <Text style={{ fontSize: 16, color: colors.accent }}>Cancel</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={toggleSidebar} style={styles.headerBtn} accessibilityLabel="Open menu" accessibilityRole="button" accessibilityHint="Double tap to open sidebar with conversations and settings">
          <Text style={{ fontSize: 20, color: colors.text }}>☰</Text>
        </TouchableOpacity>
      ),
      headerRight: () => renaming ? (
        <TouchableOpacity
          onPress={handleRenameSave}
          style={styles.headerBtn}
          accessibilityLabel="Save rename"
          accessibilityRole="button"
          accessibilityHint="Double tap to save the new conversation name"
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>Save</Text>
        </TouchableOpacity>
      ) : (
        <ModeSelector current={mode} onChange={handleModeChange} />
      ),
    });
  }, [navigation, colors, renaming, conv, mode, selectedDocIds, toggleSidebar, handleRenameSave, handleModeChange]);

  if (initialLoading) {
    return (
    <View style={[styles.safe, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <View style={styles.initialLoading}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Loading conversations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding" keyboardVerticalOffset={44}>
        <Stack.Screen
          options={{
            headerTitle: () => renaming ? (
              <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }}>Rename Conversation</Text>
            ) : (
              <TouchableOpacity onPress={() => { if (conv) { setRenameText(conv.title); setRenaming(true); } }} style={{ padding: 4, maxWidth: 200 }} accessibilityLabel="Tap to rename conversation" accessibilityRole="button">
                <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }} numberOfLines={1}>{conv?.title || "Chat"}</Text>
              </TouchableOpacity>
            ),
            headerLeft: () => renaming ? (
              <TouchableOpacity onPress={() => setRenaming(false)} style={styles.headerBtn} accessibilityLabel="Cancel rename" accessibilityRole="button" accessibilityHint="Double tap to cancel renaming conversation">
                <Text style={{ fontSize: 16, color: colors.accent }}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={toggleSidebar} style={styles.headerBtn} accessibilityLabel="Open menu" accessibilityRole="button" accessibilityHint="Double tap to open sidebar with conversations and settings">
                <Text style={{ fontSize: 20, color: colors.text }}>☰</Text>
              </TouchableOpacity>
            ),
            headerRight: () => renaming ? (
              <TouchableOpacity
                onPress={handleRenameSave}
                style={styles.headerBtn}
                accessibilityLabel="Save rename"
                accessibilityRole="button"
                accessibilityHint="Double tap to save the new conversation name"
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>Save</Text>
              </TouchableOpacity>
            ) : (
              <ModeSelector current={mode} onChange={handleModeChange} />
            ),
          }}
        />

        {renaming && (
          <View style={[styles.renameBar, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.renameInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              placeholder="Conversation name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        )}

        {selectedDocIds.length > 0 && mode === "rag" && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.warningLight }}>
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.warningText }}>Filtering by {selectedDocIds.length} document{selectedDocIds.length > 1 ? "s" : ""}</Text>
            <TouchableOpacity onPress={() => setSelectedDocIds([])} style={{ padding: 8, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }} accessibilityLabel="Clear document filters" accessibilityRole="button">
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

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
            onContentSizeChange={() => {
              if (isNearBottomRef.current) {
                flatListRef.current?.scrollToEnd();
              }
            }}
            onScroll={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              const contentHeight = e.nativeEvent.contentSize.height;
              const viewHeight = e.nativeEvent.layoutMeasurement.height;
              const nearBottom = offsetY >= contentHeight - viewHeight - 300;
              isNearBottomRef.current = nearBottom;
              setShowScrollFab(!nearBottom);
            }}
            scrollEventThrottle={16}
            windowSize={10}
            maxToRenderPerBatch={15}
            initialNumToRender={15}
            removeClippedSubviews={true}
            onRefresh={refreshConversations}
            refreshing={initialLoading}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {mode === "agent" ? "Agent Mode" : "RAG Mode"}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {mode === "agent"
                    ? "Ask me to search, summarize, or compare documents"
                    : "Upload documents and ask questions"}
                </Text>
              </View>
            }
            ListFooterComponent={
              loading && !streamActive ? (
                <LoadingDots />
              ) : toolEvent && !loading ? (
                <View style={[styles.toolBar, { backgroundColor: colors.warningLight }]}>
                  <Text style={[styles.toolText, { color: colors.warningText }]}>{toolEvent}</Text>
                </View>
              ) : null
            }
          />
        </View>

        {showScrollFab && (
          <TouchableOpacity
            style={[styles.scrollFab, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
            accessibilityLabel="Scroll to bottom"
            accessibilityRole="button"
            accessibilityHint="Double tap to scroll to the most recent message"
          >
            <Text style={{ fontSize: 20, color: colors.text }}>↓</Text>
          </TouchableOpacity>
        )}

        <InputBar
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          onStop={cancelStream}
          loading={loading && !streamActive}
          streaming={streamActive}
          placeholder={mode === "agent" ? "Search, summarize, compare..." : "Ask about your documents..."}
          insets={insets}
        />

        <Sidebar
          visible={showSidebar}
          onClose={() => setShowSidebar(false)}
          convList={convList}
          currentConvId={conv?.id}
          onSwitchConv={switchConversation}
          onDeleteConv={confirmDeleteConversation}
          onNewConv={createConversation}
          documents={documents}
          selectedDocIds={selectedDocIds}
          onToggleDoc={toggleDocFilter}
          onClearDocs={() => setSelectedDocIds([])}
          mode={mode}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  initialLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  messageList: { padding: 18, paddingBottom: 16 },
  empty: { alignItems: "center", paddingTop: 72, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  emptyText: { fontSize: 15, textAlign: "center", lineHeight: 22, maxWidth: 360 },
  renameBar: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  renameInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15,
  },
  scrollFab: {
    position: "absolute", bottom: 120, right: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  toolBar: { padding: 10, marginHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  toolText: { fontSize: 13, textAlign: "center", fontWeight: "500" },
  headerBtn: { padding: 8, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" },
});