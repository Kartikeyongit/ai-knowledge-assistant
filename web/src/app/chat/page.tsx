"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, User, Send, MessageSquare, Plus, Trash2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Markdown } from "@/components/ui/markdown";
import { api, setAuthTokenGetter, type Conversation, type ConversationDetail, type Document } from "@/lib/api";

type Source = {
  title: string;
  document_id: string;
  content: string;
  similarity: number;
};

type ToolEvent = {
  type: "tool_start" | "tool_end";
  tool?: string;
  input?: string;
  output?: string;
};

type Mode = "rag" | "agent";

const modeConfig = {
  rag: { label: "RAG" },
  agent: { label: "Agent" },
};

export default function ChatPage() {
  const { getToken, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [convList, setConvList] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("rag");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const modeRef = useRef<Mode>("rag");
  const TYPEWRITER_MS_PER_TICK = 30;
  const TYPEWRITER_CHARS_PER_TICK = 4;
  const typewriterRef = useRef<number | null>(null);
  const typewriterMsgRef = useRef<string | null>(null);
  const writeBufRef = useRef("");
  const writeIdxRef = useRef(0);
  const isStreamingRef = useRef(false);

  function syncConvList() {
    if (!detail) return;
    setConvList(prev => {
      const idx = prev.findIndex(c => c.id === detail.id);
      const existing = idx >= 0 ? prev[idx] : null;
      const updated: Conversation = {
        id: detail.id,
        title: existing?.title || detail.title,
        user_id: null,
        is_demo: 0,
        mode,
        created_at: detail.messages[0]?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  }

  async function handleNewChat() {
    stopTypewriter();
    try {
      const conv = await api.conversations.create("New Conversation", mode);
      setDetail({ id: conv.id, title: conv.title, messages: [] });
      setConvList(prev => [...prev, conv]);
      setToolEvents([]);
    } catch {
      setPageError("Could not create conversation. Backend may be offline.");
    }
  }

  async function loadConversation(id: string) {
    try {
      const d = await api.conversations.get(id);
      setDetail(d);
    } catch {
      setDetail(null);
      setPageError("Could not load conversation. It may have been deleted.");
    }
  }

  async function deleteConversation(id: string, e: { stopPropagation: () => void }) {
    e.stopPropagation();
    try { await api.conversations.delete(id); } catch {}
    const remaining = convList.filter(c => c.id !== id);
    setConvList(remaining);
    if (detail?.id === id) {
      if (remaining.length > 0) {
        await loadConversation(remaining[0].id);
      } else {
        await handleNewChat();
      }
    }
  }

  async function handleRename(id: string, newTitle: string) {
    const trimmed = newTitle.trim();
    if (!trimmed) { setRenamingConvId(null); return; }
    try {
      const updated = await api.conversations.update(id, trimmed);
      setConvList(prev => prev.map(c => c.id === id ? { ...c, title: updated.title } : c));
      if (detail?.id === id) setDetail(prev => prev ? { ...prev, title: updated.title } : null);
    } catch {}
    setRenamingConvId(null);
  }

  function initMode(m: Mode) {
    if (m === modeRef.current) return;
    setToolEvents([]);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSwitchingMode(true);
    modeRef.current = m;
    setMode(m);
    setSelectedDocIds([]);
  }

  async function loadConversationsForMode(m: Mode) {
    try {
      const convs = await api.conversations.list(m);
      if (m !== modeRef.current) return;
      setConvList(convs);
      if (convs.length > 0) {
        await loadConversation(convs[0].id);
      } else {
        await handleNewChat();
      }
    } catch {
      if (m !== modeRef.current) return;
      await handleNewChat();
    } finally {
      if (m === modeRef.current) {
        setSwitchingMode(false);
        setLoadingConversations(false);
      }
    }
  }

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    document.title = "Chat - AI Knowledge Assistant";
  }, []);

  useEffect(() => {
    api.documents.list().then((res) => setDocuments(res.documents)).catch(() => {});
  }, []);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }

  useEffect(() => {
    if (!detail || detail.messages.length === 0) return;
    scrollToBottom();
  }, [detail?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [toolEvents]);

  useEffect(() => {
    if (!searchParams) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    const urlMode = searchParams.get("mode") as Mode | null;
    if (urlMode && ["rag", "agent"].includes(urlMode) && urlMode !== mode) {
      initMode(urlMode);
    } else if (!urlMode && mode !== "rag") {
      initMode("rag");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!isLoaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversationsForMode(mode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, mode]);

  function flushTypewriter() {
    const msgId = typewriterMsgRef.current;
    if (!msgId) return;
    const full = writeBufRef.current;
    writeIdxRef.current = full.length;
    setDetail((prev) => prev ? {
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === msgId ? { ...m, content: full } : m
      )
    } : null);
  }

  function stopTypewriter(showFull = false) {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
    if (showFull) flushTypewriter();
  }

  useEffect(() => {
    return () => stopTypewriter(true);
  }, []);

  function startTypewriter(msgId: string) {
    stopTypewriter();
    typewriterMsgRef.current = msgId;
    typewriterRef.current = window.setInterval(() => {
      const full = writeBufRef.current;
      if (full.length === 0) return;
      const next = Math.min(writeIdxRef.current + TYPEWRITER_CHARS_PER_TICK, full.length);
      if (next >= full.length) {
        stopTypewriter();
        flushTypewriter();
        return;
      }
      writeIdxRef.current = next;
      setDetail((prev) => prev ? {
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === msgId ? { ...m, content: full.slice(0, next) } : m
        )
      } : null);
    }, TYPEWRITER_MS_PER_TICK);
  }

  function handleStopStream() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    stopTypewriter(true);
    setLoading(false);
  }

  const sendMessage = async () => {
    if (!input.trim() || !detail) return;
    isStreamingRef.current = true;
    try {
      const msg = input.trim();
      const convId = detail.id;
      setInput("");
      setLoading(true);
      setToolEvents([]);
      let currentAssistantMsgId: string | null = null;

      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      const userMsg = { id: "user-" + Date.now(), role: "user" as const, content: msg, sources: null, created_at: new Date().toISOString() };
      setDetail((prev) => prev ? { ...prev, messages: [...prev.messages, userMsg] } : null);

      const currentMode = modeRef.current;
      if (currentMode === "agent") {
        try {
          const response = await api.chat.agentStream(detail.id, msg, signal);
          if (!response.body) throw new Error("No response body");

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (modeRef.current !== currentMode) return;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.type === "content") {
                  if (!currentAssistantMsgId) {
                    const id = "resp-" + Date.now();
                    currentAssistantMsgId = id;
                    writeBufRef.current = "";
                    writeIdxRef.current = 0;
                    setLoading(false);
                    setDetail((prev) => prev ? {
                      ...prev,
                      messages: [...prev.messages, { id, role: "assistant", content: "", sources: null, created_at: new Date().toISOString() }]
                    } : null);
                    startTypewriter(id);
                  }
                writeBufRef.current += parsed.data;
                scrollToBottom();
              } else if (parsed.type === "tool_start") {
                setToolEvents((prev) => [...prev, { type: "tool_start", tool: parsed.data.tool, input: parsed.data.input }]);
              } else if (parsed.type === "tool_end") {
                setToolEvents((prev) => [...prev, { type: "tool_end", output: parsed.data.output }]);
              } else if (parsed.type === "title") {
                  const newTitle = parsed.data;
                  setDetail((prev) => prev ? { ...prev, title: newTitle } : null);
                  setConvList((prev) => prev.map((c) => c.id === convId ? { ...c, title: newTitle } : c));
                }
              } catch { /* skip partial */ }
            }
          }
          if (modeRef.current !== currentMode) return;
          syncConvList();
        } catch (e) {
          if (modeRef.current !== currentMode) return;
          if (e instanceof DOMException && e.name === "AbortError") { setLoading(false); return; }
          const errMsg = e instanceof Error ? e.message : "Unknown error";
          setDetail((prev) => prev ? { ...prev, messages: [...prev.messages, { id: "err-" + Date.now(), role: "assistant" as const, content: "Agent mode error: " + errMsg, sources: null, created_at: new Date().toISOString() }] } : null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.chat.stream(detail.id, msg, selectedDocIds.length > 0 ? selectedDocIds : undefined, signal);
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let sources: Source[] = [];
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (modeRef.current !== currentMode) return;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "content") {
                if (!currentAssistantMsgId) {
                  const id = "resp-" + Date.now();
                  currentAssistantMsgId = id;
                  writeBufRef.current = "";
                  writeIdxRef.current = 0;
                  setLoading(false);
                  setDetail((prev) => prev ? {
                    ...prev,
                    messages: [...prev.messages, { id, role: "assistant", content: "", sources: null, created_at: new Date().toISOString() }]
                  } : null);
                  startTypewriter(id);
                }
                writeBufRef.current += parsed.data;
                scrollToBottom();
              } else if (parsed.type === "no_sources") {
                if (!currentAssistantMsgId) {
                  const id = "resp-" + Date.now();
                  currentAssistantMsgId = id;
                  writeBufRef.current = "";
                  writeIdxRef.current = 0;
                  setLoading(false);
                  setDetail((prev) => prev ? {
                    ...prev,
                    messages: [...prev.messages, { id, role: "assistant", content: "", sources: null, created_at: new Date().toISOString() }]
                  } : null);
                  startTypewriter(id);
                }
                writeBufRef.current += `\n\n_${parsed.data}_`;
              } else if (parsed.type === "sources") {
                sources = parsed.data;
              } else if (parsed.type === "title") {
                const newTitle = parsed.data;
                setDetail((prev) => prev ? { ...prev, title: newTitle } : null);
                setConvList((prev) => prev.map((c) => c.id === convId ? { ...c, title: newTitle } : c));
              }
            } catch { /* skip partial JSON */ }
          }
        }
        if (modeRef.current !== currentMode) return;
        syncConvList();

        if (currentAssistantMsgId && sources.length > 0) {
          setDetail((prev) => prev ? {
            ...prev,
            messages: prev.messages.map((m) => m.id === currentAssistantMsgId ? { ...m, sources: JSON.stringify(sources) } : m)
          } : null);
        }
      } catch (e) {
        if (modeRef.current !== currentMode) return;
        if (e instanceof DOMException && e.name === "AbortError") { setLoading(false); return; }
        const errMsg = e instanceof Error ? e.message : "Unknown error";
        setDetail((prev) => prev ? { ...prev, messages: [...prev.messages, { id: "err-" + Date.now(), role: "assistant" as const, content: "RAG mode error: " + errMsg, sources: null, created_at: new Date().toISOString() }] } : null);
        setLoading(false);
      }
    } finally {
      isStreamingRef.current = false;
    }
  };

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) => prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]);
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col h-screen">
        <header className="border-b border-neutral-200/70 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div className="h-5 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div className="h-7 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-9 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div className="h-9 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div className="size-9 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div className="size-8 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-t-neutral-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        rightContent={
          <>

            {(Object.keys(modeConfig) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { initMode(m); router.push(`/chat?mode=${m}`, { scroll: false }); }}
                className={`text-xs px-3 h-7 flex items-center rounded-full border transition-all ${
                  mode === m
                    ? "bg-neutral-800 text-white border-transparent shadow-sm dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {modeConfig[m].label}
              </button>
            ))}
            {switchingMode && (
              <span className="size-1.5 rounded-full bg-neutral-400 animate-pulse shrink-0" />
            )}
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
            <Link href="/documents"><Button variant="ghost" size="sm">Documents</Button></Link>
            <Button variant="ghost" size="sm" onClick={handleNewChat}>New Chat</Button>
          </>
        }
      />



      {pageError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800 flex items-center justify-between gap-2">
          <p className="text-xs text-red-700 dark:text-red-300">{pageError}</p>
          <button onClick={() => setPageError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-sm font-bold leading-none">&times;</button>
        </div>
      )}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`md:hidden absolute top-2 left-2 z-40 size-8 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-xs font-medium shadow-sm ${showFilter ? 'opacity-100' : ''}`}
          aria-label="Toggle sidebar"
        >
          {showFilter ? "✕" : "☰"}
        </button>
        {showFilter && (
          <div
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setShowFilter(false)}
          />
        )}
        <aside className={`w-72 border-r border-neutral-200/70 dark:border-neutral-800/50 flex flex-col min-h-0 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl ${showFilter ? "fixed left-0 top-14 bottom-0 z-30 bg-white dark:bg-neutral-950 shadow-xl" : "hidden md:flex"}`}>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 border-b border-neutral-200/70 dark:border-neutral-800/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">History</h3>
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2 gap-1" onClick={() => { handleNewChat(); setShowFilter(false); }}>
                  <Plus className="size-3" /> New
                </Button>
              </div>
              <div className="space-y-0.5">
                {switchingMode ? (
                  <div className="space-y-1.5 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : !loadingConversations && convList.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-3">No conversations yet</p>
                ) : (
                  convList.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => { if (renamingConvId !== conv.id) { loadConversation(conv.id); setShowFilter(false); } }}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 group ${
                        detail?.id === conv.id
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      <MessageSquare className="size-3 shrink-0" />
                      {renamingConvId === conv.id ? (
                        <input
                          autoFocus
                          defaultValue={conv.title}
                          className="flex-1 text-xs px-1 py-0.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 outline-none min-w-0"
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => handleRename(conv.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(conv.id, (e.target as HTMLInputElement).value);
                            if (e.key === "Escape") setRenamingConvId(null);
                          }}
                        />
                      ) : (
                        <span
                          className="truncate flex-1"
                          onDoubleClick={(e) => { e.stopPropagation(); setRenamingConvId(conv.id); }}
                        >
                          {conv.title}
                        </span>
                      )}
                      {convList.length > 1 && (
                        <span
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="size-5 rounded flex items-center justify-center opacity-40 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer shrink-0"
                          aria-label="Delete conversation"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter") deleteConversation(conv.id, e); }}
                        >
                          <Trash2 className="size-2.5 text-neutral-400 hover:text-red-500" />
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            {mode === "rag" && documents.length > 0 && (
              <div className="p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Filter Documents</h3>
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg mb-1 transition-colors ${
                      selectedDocIds.includes(doc.id)
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <div className="truncate font-medium">{doc.title}</div>
                    <div className="text-xs text-neutral-500 truncate">{doc.filename}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-0">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {(!detail || detail.messages.length === 0) ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-md mx-auto text-center space-y-4">
                  <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                    <Sparkles className="size-7 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      {mode === "agent" ? "AI Agent Mode" : "RAG Search Mode"}
                    </h2>
                    <p className="text-sm text-neutral-500">
                      {mode === "agent"
                        ? "Ask me to search, summarize, or compare documents. I have tools to help."
                        : "Upload documents first, then ask questions. The AI will search their content for answers."}
                    </p>
                  </div>
                  {mode === "agent" && (
                    <div className="text-sm text-neutral-400 space-y-1 bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 text-left">
                      <p className="text-xs font-medium text-neutral-500 mb-2">Try these prompts:</p>
                      <p><span className="text-neutral-700 dark:text-neutral-300">&ldquo;List my documents&rdquo;</span></p>
                      <p><span className="text-neutral-700 dark:text-neutral-300">&ldquo;Search for deployment instructions&rdquo;</span></p>
                      <p><span className="text-neutral-700 dark:text-neutral-300">&ldquo;Summarize a document&rdquo;</span></p>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto w-full px-4 py-6 space-y-4">

                  {detail?.messages.map((msg) => {
                  const isError = msg.id.startsWith("err-");
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="size-8 rounded-xl bg-neutral-700 dark:bg-neutral-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Sparkles className="size-4 text-white dark:text-neutral-800" />
                        </div>
                      )}
                      <div className={`${
                        msg.role === "user"
                          ? "max-w-[80%] md:max-w-[65%] lg:max-w-[55%] rounded-2xl px-3 py-2 bg-neutral-700 text-white dark:bg-white dark:text-neutral-900"
                          : isError
                          ? "rounded-2xl px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                          : "flex-1 min-w-0 relative"
                      }`}>
                        {isError && <span className="text-red-500 font-bold mr-1">!</span>}
                        {msg.role === "assistant" && !isError ? (
                          <Markdown content={msg.content} />
                        ) : (
                          <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                        )}
                        {(() => {
                          let parsedSources: Source[] = [];
                          if (msg.sources && msg.role === "assistant") {
                            try {
                              parsedSources = typeof msg.sources === "string" ? JSON.parse(msg.sources) : msg.sources;
                            } catch {}
                          }
                          return parsedSources.length > 0 ? (
                            <details className="mt-3 text-xs text-neutral-500 relative">
                              <summary className="cursor-pointer hover:text-neutral-700 font-medium">Sources ({parsedSources.length})</summary>
                              <div className="absolute left-0 right-0 z-20 mt-2 space-y-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 shadow-lg max-h-60 overflow-y-auto">
                                {parsedSources.map((s, i) => (
                                  <div key={i} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700">
                                    <div className="font-medium text-neutral-700 dark:text-neutral-300 text-xs">{s.title}</div>
                                    <div className="truncate opacity-70 mt-0.5">{s.content}</div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : null;
                        })()}
                      </div>
                      {msg.role === "user" && (
                        <div className="size-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="size-4 text-neutral-600 dark:text-neutral-400" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="size-8 rounded-xl bg-neutral-700 dark:bg-neutral-200 flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="size-4 text-white dark:text-neutral-800" />
                    </div>
                    <div className="rounded-xl px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50">
                      <div className="flex gap-1 items-center h-4">
                        <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                        <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                        <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200/70 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl p-4">
            {mode === "rag" && selectedDocIds.length > 0 && (
              <div className="max-w-6xl mx-auto flex items-center gap-2 mb-2">
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  Filtering by {selectedDocIds.length} document{selectedDocIds.length > 1 ? "s" : ""}
                  <button onClick={() => setSelectedDocIds([])} className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold leading-none ml-0.5">&times;</button>
                </span>
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="max-w-6xl mx-auto flex gap-3 items-stretch"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    autoResize(e.target);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    mode === "agent"
                      ? "Ask me to search, summarize, or compare documents..."
                      : "Ask a question about your documents..."
                  }
                  disabled={loading || !detail}
                  rows={1}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400/50 dark:focus:ring-neutral-500/50 focus:border-neutral-400 dark:focus:border-neutral-500 disabled:opacity-50 min-h-[40px] max-h-[200px] transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                />
              </div>
                {loading ? (
                  <Button
                    type="button"
                    onClick={handleStopStream}
                    variant="destructive"
                    size="icon"
                    className="size-10 shrink-0 rounded-xl"
                    aria-label="Stop streaming"
                  >
                    <Square className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!input.trim() || !detail}
                    variant="default"
                    size="icon"
                    className="size-10 shrink-0 rounded-xl"
                  >
                    <Send className="size-4" />
                  </Button>
                )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
