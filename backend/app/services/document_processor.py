import os

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader

from app.config import settings


def extract_text(file_path: str, content_type: str) -> str:
    if content_type == "application/pdf":
        loader = PyMuPDFLoader(file_path)
        docs = loader.load()
        return "\n".join(d.page_content for d in docs)
    elif content_type in ("text/plain", "text/markdown"):
        loader = TextLoader(file_path, encoding="utf-8")
        docs = loader.load()
        return docs[0].page_content if docs else ""
    else:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()


def chunk_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    chunks = splitter.split_text(text)
    return [c.strip() for c in chunks if c.strip()]
