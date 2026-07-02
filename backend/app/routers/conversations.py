import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import AuthenticatedUser, get_current_user
from app.database import get_db
from app.models.conversation import Conversation, Message
from app.schemas.conversation import (
    ChatRequest,
    ConversationDetail,
    ConversationResponse,
    ConversationUpdate,
)
from app.services.rag import chat_stream

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("/", response_model=ConversationResponse)
def create_conversation(
    title: str = Query("New Conversation"),
    mode: str = Query("rag"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = Conversation(
        id=str(uuid.uuid4()),
        title=title,
        mode=mode,
        user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/", response_model=list[ConversationResponse])
def list_conversations(
    mode: str = Query(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    if mode:
        query = query.filter(Conversation.mode == mode)
    return query.order_by(Conversation.updated_at.desc()).all()


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    if conv.user_id != current_user.id:
        raise HTTPException(403, "You do not have permission to access this conversation")
    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        messages=[msg for msg in conv.messages],
    )


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    if conv.user_id != current_user.id:
        raise HTTPException(403, "You do not have permission to delete this conversation")
    db.delete(conv)
    db.commit()


@router.patch("/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    body: ConversationUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    if conv.user_id != current_user.id:
        raise HTTPException(403, "You do not have permission to update this conversation")
    conv.title = body.title
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conv)
    return conv
