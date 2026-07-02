export const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

let _getToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

export async function authHeaders(): Promise<Record<string, string>> {
  if (!_getToken) return {};
  try {
    const token = await _getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  content_type: string;
  file_size: number | null;
  is_demo: number;
  created_at: string;
}

export interface DocumentDetail extends Document {
  content?: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  is_demo: number;
  mode: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  sources: string | null;
  created_at: string;
}

class ApiError extends Error {
  status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const extra = await authHeaders();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
    ...(options?.headers as Record<string, string>),
  };
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      ...options,
    });
    if (!res.ok) throw new ApiError(`Error: ${res.status}`, res.status);
    return res.json();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Network error: Unable to connect to server. Is the backend running?");
  }
}

export const api = {
  documents: {
    list: () => request<{ documents: Document[]; total: number }>("/documents/"),
    get: (id: string) => request<DocumentDetail>(`/documents/${id}`),
    delete: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  },
  conversations: {
    create: (title?: string, mode?: string) => {
      const params = new URLSearchParams();
      if (title) params.set("title", title);
      if (mode) params.set("mode", mode);
      return request<Conversation>(`/conversations/?${params.toString()}`, { method: "POST" });
    },
    list: (mode?: string) => {
      const params = new URLSearchParams();
      if (mode) params.set("mode", mode);
      return request<Conversation[]>(`/conversations/?${params.toString()}`);
    },
    get: (id: string) =>
      request<{ id: string; title: string; messages: Message[] }>(`/conversations/${id}`),
    update: (id: string, title: string) =>
      request<Conversation>(`/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
    delete: (id: string) => request<void>(`/conversations/${id}`, { method: "DELETE" }),
  },
  demo: {
    send: async (conversationId: string, message: string) => {
      return request<{ message_id: string; content: string; sources: string | null }>(
        `/demo/chat?conversation_id=${conversationId}&message=${encodeURIComponent(message)}`,
        { method: "POST" }
      );
    },
  },
  chat: {
    stream: async (conversationId: string, message: string, documentIds?: string[], signal?: AbortSignal) => {
      const extra = await authHeaders();
      return fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...extra },
        body: JSON.stringify({ conversation_id: conversationId, message, document_ids: documentIds }),
        signal,
      });
    },
    agentStream: async (conversationId: string, message: string, signal?: AbortSignal) => {
      const extra = await authHeaders();
      const params = new URLSearchParams({ conversation_id: conversationId, message });
      return fetch(`${API_BASE}/chat/agent-stream?${params.toString()}`, {
        method: "POST",
        headers: { ...extra },
        signal,
      });
    },
  },
};