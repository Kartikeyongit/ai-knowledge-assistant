import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ChatResponse

router = APIRouter(prefix="/demo", tags=["demo"])


DEMO_RESPONSES = {
    "what is this": "This is the **AI Knowledge Assistant** — a full-stack RAG application. You can upload documents (PDF, TXT, MD) and then ask questions about their content. The system uses vector search to find relevant chunks and an LLM to generate answers with citations.",
    "how does it work": "1. **Upload** documents via the document library\n2. The system extracts text, splits it into chunks, and generates embeddings\n3. When you ask a question, it finds the most relevant chunks using vector similarity search\n4. The LLM generates an answer based on those chunks\n5. Sources are cited so you can verify the information",
    "what technology": "**Backend:** FastAPI (Python), LangChain, pgvector, Groq API (Llama 3)\n**Frontend:** Next.js (Web) + React Native / Expo (Mobile)\n**Database:** PostgreSQL with pgvector extension\n**Embeddings:** sentence-transformers via HuggingFace\n**Deployment:** Vercel + Render + Neon",
}


@router.post("/chat", response_model=ChatResponse)
def demo_chat(conversation_id: str, message: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        conv = Conversation(
            id=str(uuid.uuid4()),
            title="Demo Conversation",
            is_demo=1,
            mode="demo",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(conv)
        db.flush()

    lower_msg = message.lower().strip()
    response = "I can answer questions about this application. Try asking: 'What is this?', 'How does it work?', or 'What technology does it use?'"

    for key, val in DEMO_RESPONSES.items():
        if key in lower_msg:
            response = val
            break

    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        role="user",
        content=message,
        created_at=datetime.now(timezone.utc),
    )
    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        role="assistant",
        content=response,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(message_id=assistant_msg.id, content=response, sources=None)
