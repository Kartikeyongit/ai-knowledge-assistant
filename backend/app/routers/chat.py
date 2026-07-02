import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse

from app.auth import AuthenticatedUser, get_current_user
from app.database import get_db
from app.models.conversation import Conversation
from app.schemas.conversation import ChatRequest
from app.services.rag import chat_stream
from app.services.agent import agent_chat_stream

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def _verify_conv_ownership(conversation_id: str, user_id: str, db: Session) -> Conversation:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    if conv.user_id != user_id:
        raise HTTPException(403, "You do not have permission to access this conversation")
    return conv


@router.post("/stream")
async def chat(
    request: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_conv_ownership(request.conversation_id, current_user.id, db)
    return StreamingResponse(
        chat_stream(request.conversation_id, request.message, request.document_ids, db),
        media_type="application/x-ndjson",
    )


@router.post("/agent-stream")
async def agent_chat(
    conversation_id: str = Query(...),
    message: str = Query(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_conv_ownership(conversation_id, current_user.id, db)
    return StreamingResponse(
        agent_chat_stream(conversation_id, message, db),
        media_type="application/x-ndjson",
    )
