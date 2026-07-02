import json
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, Message
from app.services.embedding import embed_text
from app.services.llm import build_rag_prompt, generate_conversation_title, stream_chat


def search_docs_raw(
    query: str,
    user_id: str,
    db: Session,
    document_ids: Optional[list[str]] = None,
    top_k: int = 5,
) -> list[dict]:
    query_embedding = embed_text(query)
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    conditions = ""
    params: dict = {"top_k": top_k, "user_id": user_id, "embedding": embedding_str}

    if document_ids:
        placeholders = ",".join(f":doc_id_{i}" for i in range(len(document_ids)))
        conditions = f" AND d.id IN ({placeholders})"
        for i, doc_id in enumerate(document_ids):
            params[f"doc_id_{i}"] = doc_id

    sql = text("""
        SELECT dc.content, d.title as doc_title, d.id as doc_id,
               1 - (dc.embedding <=> CAST(:embedding AS vector)) as similarity
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE dc.embedding IS NOT NULL AND d.user_id = :user_id""" + conditions + """
        ORDER BY dc.embedding <=> CAST(:embedding AS vector)
        LIMIT :top_k
    """)

    rows = db.execute(sql, params).fetchall()
    return [
        {
            "title": row.doc_title,
            "document_id": row.doc_id,
            "content": row.content,
            "similarity": round(float(getattr(row, "similarity", 0)), 3),
        }
        for row in rows
    ]


async def query_documents(
    question: str,
    document_ids: Optional[list[str]],
    user_id: str,
    db: Session,
    top_k: int = 5,
    similarity_threshold: float = 0.05,
) -> tuple[str, list[dict]]:
    rows = search_docs_raw(question, user_id, db, document_ids, top_k)

    if not rows:
        return "", []

    sources = []
    context_parts = []
    for row in rows:
        similarity = row["similarity"]
        if similarity >= similarity_threshold:
            context_parts.append(row["content"])
            sources.append({
                "title": row["title"],
                "document_id": row["document_id"],
                "content": row["content"][:200],
                "similarity": similarity,
            })

    context = "\n\n---\n\n".join(context_parts) if context_parts else ""
    return context, sources


async def chat_stream(
    conversation_id: str,
    question: str,
    document_ids: Optional[list[str]],
    db: Session,
) -> AsyncGenerator[str, None]:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise ValueError("Conversation not found")

    context, sources = await query_documents(question, document_ids, conv.user_id, db)

    rag_messages = build_rag_prompt(context, question)

    full_response = ""
    async for chunk in stream_chat(rag_messages):
        full_response += chunk
        yield json.dumps({"type": "content", "data": chunk}) + "\n"

    if not context and not sources:
        yield json.dumps({"type": "no_sources", "data": "No relevant content found in your documents for this question."}) + "\n"
    elif sources:
        yield json.dumps({"type": "sources", "data": sources}) + "\n"

    existing_msg_count = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).count()

    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=question,
        created_at=datetime.now(timezone.utc),
    )
    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=full_response,
        sources=json.dumps(sources) if sources else None,
        created_at=datetime.now(timezone.utc),
    )
    conv.updated_at = datetime.now(timezone.utc)
    db.add(user_msg)
    db.add(assistant_msg)

    if conv.title == "New Conversation" and existing_msg_count == 0 and not conv.is_demo:
        title = await generate_conversation_title(question)
        if title and title != "New Conversation":
            conv.title = title
            yield json.dumps({"type": "title", "data": title}) + "\n"

    db.commit()
