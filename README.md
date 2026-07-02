# AI Knowledge Assistant

A full-stack RAG (Retrieval-Augmented Generation) application that lets you upload documents and chat with them using AI-powered semantic search. Built with **FastAPI + LangChain + pgvector + Next.js + React Native**.

## Architecture

```
┌──────────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
│  Web (Next)  │────▶│ FastAPI  │────▶│ PostgreSQL │────▶│  Groq AI │
│  Mobile (RN) │     │ LangChain│     │ + pgvector │     │  Llama 3 │
└──────────────┘     └──────────┘     └────────────┘     └──────────┘
```

## Features

- **Multi-format upload** — PDF, TXT, Markdown
- **Semantic search** — vector embeddings via pgvector (cosine similarity)
- **AI-powered answers** — Llama 3 70B via Groq (free tier, no CC needed)
- **Source citations** — every answer links back to source documents
- **Demo mode** — pre-loaded documents, works without any API key
- **Cross-platform** — Web (Next.js) + Mobile (React Native / Expo)
- **Streaming responses** — real-time token-by-token output

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Python 3.12, FastAPI, LangChain | Modern async AI backend |
| Database | PostgreSQL 17 + pgvector | Vector + relational in one DB |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) via HuggingFace | 384-dim vectors, CPU-friendly |
| LLM | Llama 3 70B via Groq | Fast inference, generous free tier |
| Frontend (Web) | Next.js 16 + Tailwind CSS | SSR, fast dev experience |
| Frontend (Mobile) | React Native + Expo | Cross-platform mobile |
| Container | Docker Compose | Local dev in one command |

## Quick Start (Local Development)

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker (for PostgreSQL + Ollama)
- Groq API key (optional — demo mode works without it)

### 1. Clone & Setup

```bash
cd ai-knowledge-assistant
docker compose up -d    # Starts PostgreSQL + Ollama
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # Add your GROQ_API_KEY (optional)
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger)
```

### 3. Seed Demo Documents

```bash
python -m seed.seed_demo
```

### 4. Web Frontend

```bash
cd web
npm install
npm run dev
# → http://localhost:3000
```

### 5. Mobile App

```bash
cd mobile
npm install
npx expo start --tunnel
# Scan QR code with Expo Go app
```

## Deploy (Free Tier, $0)

| Service | What | Free Tier |
|---|---|---|
| [Vercel](https://vercel.com) | Web frontend | Hobby — 100GB bandwidth |
| [Render](https://render.com) | FastAPI backend | Free — 512MB RAM, spins down after 15min |
| [Neon](https://neon.tech) | PostgreSQL + pgvector | Free — 0.5GB, auto-wake |
| [Groq](https://groq.com) | Llama 3 API | Free — 30 req/min, no CC |
| [Upstash](https://upstash.com) | Redis (optional) | Free — 10MB |

### Deploy Steps

1. **Neon**: Create project, copy `DATABASE_URL`, enable pgvector (`CREATE EXTENSION vector;`)
2. **Render**: Connect GitHub → set root to `backend` → build: `pip install -r requirements.txt` → start: `uvicorn app.main:app --host 0.0.0.0 --port 8000` → add env vars
3. **Vercel**: Import `web/` → add `NEXT_PUBLIC_API_URL` → deploy
4. **Groq**: Sign up at console.groq.com → get free API key → add to Render env

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/documents/upload` | Upload a document |
| `GET` | `/documents/` | List documents |
| `DELETE` | `/documents/{id}` | Delete a document |
| `POST` | `/conversations/` | Create a conversation |
| `GET` | `/conversations/` | List conversations |
| `GET` | `/conversations/{id}` | Get conversation with messages |
| `POST` | `/chat/stream` | Chat (streaming SSE) |
| `POST` | `/demo/chat` | Demo chat (no API key) |
| `GET` | `/health` | Health check |

## Project Structure

```
ai-knowledge-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── config.py          # Settings / env vars
│   │   ├── database.py        # SQLAlchemy + pgvector setup
│   │   ├── models/            # DB models (Document, Chunk, Conversation, Message)
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── routers/           # API routes
│   │   └── services/          # RAG, embedding, LLM, document processing
│   ├── seed/                  # Demo data seed script
│   └── requirements.txt
├── web/                       # Next.js frontend
├── mobile/                    # React Native / Expo mobile app
├── docker-compose.yml         # PostgreSQL + Ollama + backend
└── README.md
```

## Demo Mode

The app includes a demo mode that works **without any API keys**. Just:

1. Start the backend (`uvicorn app.main:app --reload`)
2. Run the seed script (`python -m seed.seed_demo`)
3. Open the web app in demo mode (click "Demo Mode" toggle)

Pre-loaded documents cover the app's own architecture, tech stack, deployment guide, and more. Demo responses are pre-defined so the app is fully functional without LLM API access.

## Coming Soon

- [ ] LangGraph AI agents (multi-step research, document comparison)
- [ ] Web search augmentation
- [ ] Document chat with multiple simultaneous documents
- [ ] Admin dashboard with usage analytics
- [ ] Collaborative workspaces

## License

MIT
