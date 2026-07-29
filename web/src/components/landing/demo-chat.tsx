"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, User, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { FloatingBackground } from "./floating-background";

const SUGGESTIONS = [
  "What is this app?",
  "How does it work?",
  "What technology does it use?",
];

const DEMO_RESPONSES: Record<string, string> = {
  "what is this": "This is the **AI Knowledge Assistant** — a full-stack RAG application. You can upload documents (PDF, TXT, MD) and then ask questions about their content. The system uses vector search to find relevant chunks and an LLM to generate answers with citations.",
  "how does it work": "1. **Upload** documents via the document library\n2. The system extracts text, splits it into chunks, and generates embeddings\n3. When you ask a question, it finds the most relevant chunks using vector similarity search\n4. The LLM generates an answer based on those chunks\n5. Sources are cited so you can verify the information",
  "what technology": "**Backend:** FastAPI (Python), LangChain, pgvector, Groq API (Llama 3)\n**Frontend:** Next.js (Web) + React Native / Expo (Mobile)\n**Database:** PostgreSQL with pgvector extension\n**Embeddings:** sentence-transformers via HuggingFace\n**Deployment:** Vercel + Render + Neon",
};

export function DemoChatSection() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    const lowerMsg = msg.toLowerCase();
    let response = "I can answer questions about this application. Try asking: 'What is this?', 'How does it work?', or 'What technology does it use?'";
    for (const [key, val] of Object.entries(DEMO_RESPONSES)) {
      if (lowerMsg.includes(key)) {
        response = val;
        break;
      }
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 600);
  };

  return (
    <section id="demo" className="py-20 relative">
      <FloatingBackground
        icons={[
          { icon: Search, className: "text-indigo-300/30 dark:text-indigo-400/20", position: "top-20 left-[10%]" },
          { icon: FileText, className: "text-teal-300/30 dark:text-teal-400/20", position: "top-32 right-[12%]" },
          { icon: Sparkles, className: "text-amber-300/30 dark:text-amber-400/20", position: "bottom-28 left-[15%]" },
        ]}
      />
      <div className="max-w-6xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Try It Out
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            Ask a question below to see how the AI responds. Sign in for full access.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl overflow-hidden">
            <div ref={messagesContainerRef} className="h-72 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-sm text-neutral-400">
                    Try asking one of these:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="inline-flex items-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="size-8 rounded-xl bg-neutral-700 dark:bg-neutral-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Sparkles className="size-4 text-white dark:text-neutral-800" />
                      </div>
                    )}
                    <div
                      className={
                        msg.role === "user"
                          ? "max-w-[80%] rounded-2xl px-3 py-2 bg-neutral-700 text-white dark:bg-white dark:text-neutral-900"
                          : "flex-1 min-w-0 text-left"
                      }
                    >
                      {msg.role === "assistant" ? (
                        <Markdown content={msg.content} />
                      ) : (
                        <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="size-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="size-4 text-neutral-600 dark:text-neutral-400" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="size-7 rounded-lg bg-neutral-700 dark:bg-neutral-200 flex items-center justify-center shrink-0">
                    <Sparkles className="size-3.5 text-white dark:text-neutral-800" />
                  </div>
                  <div className="rounded-xl px-4 py-2 bg-neutral-100 dark:bg-neutral-800">
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="border-t border-neutral-200/70 dark:border-neutral-800/50 p-3 flex gap-2"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask a question about this app..."
                disabled={loading}
                className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400/50 dark:focus:ring-neutral-500/50 disabled:opacity-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                variant="default"
                size="icon"
                className="size-9 shrink-0 rounded-xl"
              >
                <Send className="size-3.5" />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
