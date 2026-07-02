const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let _getToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const REQUEST_TIMEOUT = 30_000;

async function authHeaders(): Promise<Record<string, string>> {
  if (!_getToken) return {};
  const token = await _getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };
    const extra = await authHeaders();
    Object.assign(headers, extra);

    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ApiError(body || `API error: ${res.status}`, res.status);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  content_type: string;
  file_size: number | null;
  user_id: string | null;
  is_demo: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string | null;
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

export interface ConversationDetail {
  id: string;
  title: string;
  messages: Message[];
}

export const api = {
  documents: {
    list: () =>
      request<{ documents: Document[]; total: number }>("/documents/"),
    upload: async (file: File, onProgress?: (pct: number) => void) => {
      const extra = await authHeaders();
      return new Promise<Document>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/documents/upload`);
        if (extra.Authorization) xhr.setRequestHeader("Authorization", extra.Authorization);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new ApiError("Upload failed", xhr.status));
          }
        };
        xhr.onerror = () => reject(new ApiError("Upload failed", 0));
        const form = new FormData();
        form.append("file", file);
        xhr.send(form);
      });
    },
    delete: (id: string) =>
      request<void>(`/documents/${id}`, { method: "DELETE" }),
  },

  conversations: {
    create: (title?: string, mode?: string) => {
      const params = new URLSearchParams();
      if (title) params.set("title", title);
      if (mode) params.set("mode", mode);
      return request<Conversation>(
        `/conversations/?${params.toString()}`,
        { method: "POST" }
      );
    },
    list: (mode?: string) => {
      const params = new URLSearchParams();
      if (mode) params.set("mode", mode);
      return request<Conversation[]>(`/conversations/?${params.toString()}`);
    },
    get: (id: string) =>
      request<ConversationDetail>(`/conversations/${id}`),
    delete: (id: string) =>
      request<void>(`/conversations/${id}`, { method: "DELETE" }),
    update: (id: string, title: string) =>
      request<Conversation>(`/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
  },

  chat: {
    stream: (conversationId: string, message: string, documentIds?: string[], signal?: AbortSignal) => {
      const url = `${API_BASE}/chat/stream`;
      return sendAuthenticatedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message,
          document_ids: documentIds,
        }),
        signal,
      });
    },
    agentStream: (conversationId: string, message: string, signal?: AbortSignal) => {
      const params = new URLSearchParams({ conversation_id: conversationId, message });
      return sendAuthenticatedFetch(`${API_BASE}/chat/agent-stream?${params.toString()}`, {
        method: "POST",
        signal,
      });
    },
  },

  demo: {
    chat: (conversationId: string, message: string) =>
      request<{ message_id: string; content: string; sources: Record<string, unknown>[] | null }>(
        `/demo/chat?conversation_id=${conversationId}&message=${encodeURIComponent(message)}`,
        { method: "POST" }
      ),
  },
};

async function sendAuthenticatedFetch(url: string, options: RequestInit): Promise<Response> {
  const extra = await authHeaders();
  const headers = {
    ...(options.headers as Record<string, string>),
    ...extra,
  };
  return fetch(url, { ...options, headers });
}
