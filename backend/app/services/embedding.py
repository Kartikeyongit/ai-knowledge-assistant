import logging
import os

from langchain_huggingface import HuggingFaceEmbeddings

from app.config import settings

logger = logging.getLogger(__name__)

_embeddings = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        logger.info("Loading embedding model '%s'", settings.embedding_model)
        if settings.hf_api_token:
            os.environ["HF_TOKEN"] = settings.hf_api_token
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def embed_text(text: str) -> list[float]:
    emb = get_embeddings()
    return emb.embed_query(text)


def embed_texts(texts: list[str]) -> list[list[float]]:
    emb = get_embeddings()
    return emb.embed_documents(texts)
