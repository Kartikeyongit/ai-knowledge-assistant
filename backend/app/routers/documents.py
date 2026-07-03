import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.auth import AuthenticatedUser, get_current_user
from app.config import settings
from app.database import get_db
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentDetail, DocumentList, DocumentResponse
from app.services.document_processor import chunk_text, extract_text
from app.services.embedding import embed_texts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    original_filename: str = Form(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    effective_filename = original_filename or file.filename
    if not effective_filename:
        raise HTTPException(400, "No file provided")

    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, f"{uuid.uuid4()}_{effective_filename}")
    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    content_type = file.content_type or "text/plain"
    text_content = extract_text(file_path, content_type)

    doc = Document(
        id=str(uuid.uuid4()),
        title=os.path.splitext(effective_filename)[0],
        filename=effective_filename,
        content_type=content_type,
        content=text_content,
        file_size=len(content),
        user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(doc)
    db.flush()

    chunks = chunk_text(text_content)
    chunk_embeddings = embed_texts(chunks) if chunks else []

    for i, (chunk_text_content, embedding) in enumerate(zip(chunks, chunk_embeddings)):
        chunk = DocumentChunk(
            id=str(uuid.uuid4()),
            document_id=doc.id,
            chunk_index=i,
            content=chunk_text_content,
            embedding=embedding,
        )
        db.add(chunk)

    os.remove(file_path)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/", response_model=DocumentList)
def list_documents(
    current_user: AuthenticatedUser = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    total = query.count()
    documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return DocumentList(documents=documents, total=total)


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.user_id != current_user.id:
        raise HTTPException(403, "You do not have permission to access this document")
    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.user_id != current_user.id:
        raise HTTPException(403, "You do not have permission to delete this document")
    db.delete(doc)
    db.commit()
