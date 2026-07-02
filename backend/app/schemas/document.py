from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    title: str
    filename: str
    content_type: str
    file_size: Optional[int] = None
    user_id: Optional[str] = None
    is_demo: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetail(BaseModel):
    id: str
    title: str
    filename: str
    content_type: str
    file_size: Optional[int] = None
    content: Optional[str] = None
    user_id: Optional[str] = None
    is_demo: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentList(BaseModel):
    documents: list[DocumentResponse]
    total: int
