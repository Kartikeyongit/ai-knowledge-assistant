"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, MessageSquare, ArrowRight, LogIn, Send, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Markdown } from "@/components/ui/markdown";
import { setAuthTokenGetter } from "@/lib/api";

const features = [
  {
    icon: FileText,
    title: "Upload Documents",
    description: "Support for PDF, TXT, and Markdown files. Your data stays private and secure.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Vector embeddings find the most relevant content across all your documents instantly.",
  },
  {
    icon: MessageSquare,
    title: "AI-Powered Answers",
    description: "Get precise answers with source citations powered by Llama 3 via Groq.",
  },
];

const DEMO_RESPONSES: Record<string, string> = {
  "what is this": "This is the **AI Knowledge Assistant** — a full-stack RAG application. You can upload documents (PDF, TXT, MD) and then ask questions about their content. The system uses vector search to find relevant chunks and an LLM to generate answers with citations.",
  "how does it work": "1. **Upload** documents via the document library\n2. The system extracts text, splits it into chunks, and generates embeddings\n3. When you ask a question, it finds the most relevant chunks using vector similarity search\n4. The LLM generates an answer based on those chunks\n5. Sources are cited so you can verify the information",
  "what technology": "**Backend:** FastAPI (Python), LangChain, pgvector, Groq API (Llama 3)\n**Frontend:** Next.js (Web) + React Native / Expo (Mobile)\n**Database:** PostgreSQL with pgvector extension\n**Embeddings:** sentence-transformers via HuggingFace\n**Deployment:** Vercel + Render + Neon",
};

export default function HomePage() {
  const { getToken, isSignedIn } = useAuth();
  const [demoInput, setDemoInput] = useState("");
  const [demoMessages, setDemoMessages] = useState<{ role: string; content: string }[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [demoMessages]);

  const sendDemoMessage = async () => {
    if (!demoInput.trim()) return;
    const msg = demoInput.trim();
    setDemoInput("");
    setDemoLoading(true);
    setDemoMessages((prev) => [...prev, { role: "user", content: msg }]);

    const lowerMsg = msg.toLowerCase();
    let response = "I can answer questions about this application. Try asking: 'What is this?', 'How does it work?', or 'What technology does it use?'";
    for (const [key, val] of Object.entries(DEMO_RESPONSES)) {
      if (lowerMsg.includes(key)) {
        response = val;
        break;
      }
    }

    setTimeout(() => {
      setDemoMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setDemoLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        rightContent={
          isSignedIn ? (
            <>
              <Link href="/documents"><Button variant="ghost" size="sm">Documents</Button></Link>
              <Link href="/chat"><Button variant="default" size="sm">Start Chatting</Button></Link>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign In</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button variant="default" size="sm">
                  <LogIn className="size-3.5 mr-1.5" />
                  Get Started
                </Button>
              </SignInButton>
            </>
          )
        }
      />

      <main className="flex-1 flex flex-col items-center py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 size-96 rounded-full bg-neutral-500/10 dark:bg-neutral-500/5 blur-3xl animate-gradient-1" />
          <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-neutral-400/10 dark:bg-neutral-400/5 blur-3xl animate-gradient-2" />
        </div>

        <div className="max-w-6xl mx-auto px-4 space-y-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Chat with Your Documents
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Upload PDFs, text files, or markdown. Ask questions and get precise answers with AI-powered semantic search and source citations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isSignedIn ? (
              <>
                <Link href="/chat">
                  <Button variant="default" size="lg" className="text-base px-8 group">
                    Start Chatting
                    <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/documents">
                  <Button variant="outline" size="lg" className="text-base px-8">
                    View Documents
                  </Button>
                </Link>
              </>
            ) : (
              <SignInButton mode="modal">
                <Button variant="default" size="lg" className="text-base px-8 group">
                  Sign In to Get Started
                  <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </SignInButton>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12"
          >
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-neutral-200/70 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl p-6 text-left hover:shadow-lg hover:shadow-neutral-500/5 hover:border-neutral-300/50 dark:hover:border-neutral-700/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="size-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="size-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          {!isSignedIn && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="border-t border-neutral-200/70 dark:border-neutral-800/50 pt-12"
            >
              <h2 className="text-3xl font-bold mb-2">Try It Out</h2>
              <p className="text-neutral-500 mb-8 max-w-lg mx-auto">
                Ask a question below to see how the AI responds. Sign in for full access.
              </p>

              <div className="max-w-2xl mx-auto">
                <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl overflow-hidden">
                  <div className="h-72 overflow-y-auto p-4 space-y-3">
                    {demoMessages.length === 0 ? (
                      <p className="text-sm text-neutral-400 text-center py-12">
                        Try asking: "What is this app?", "How does it work?", or "What technology does it use?"
                      </p>
                    ) : (
                      demoMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          {msg.role === "assistant" && (
                            <div className="size-8 rounded-xl bg-neutral-700 dark:bg-neutral-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                              <Sparkles className="size-4 text-white dark:text-neutral-800" />
                            </div>
                          )}
                          <div className={`${
                            msg.role === "user"
                              ? "max-w-[80%] rounded-2xl px-3 py-2 bg-neutral-700 text-white dark:bg-white dark:text-neutral-900"
                              : "flex-1 min-w-0 text-left"
                          }`}>
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
                    {demoLoading && (
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
                    onSubmit={(e) => { e.preventDefault(); sendDemoMessage(); }}
                    className="border-t border-neutral-200/70 dark:border-neutral-800/50 p-3 flex gap-2"
                  >
                    <textarea
                      rows={1}
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDemoMessage(); } }}
                      placeholder="Ask a question about this app..."
                      disabled={demoLoading}
                      className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400/50 dark:focus:ring-neutral-500/50 disabled:opacity-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    />
                    <Button type="submit" disabled={demoLoading || !demoInput.trim()} variant="default" size="icon" className="size-9 shrink-0 rounded-xl">
                      <Send className="size-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
