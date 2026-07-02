from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    title: str
    user_id: Optional[str] = None
    is_demo: int = 0
    mode: str = "demo"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(BaseModel):
    id: str
    title: str
    messages: list[MessageResponse]

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    document_ids: Optional[list[str]] = None


class ChatResponse(BaseModel):
    message_id: str
    content: str
    sources: Optional[list[dict]] = None
