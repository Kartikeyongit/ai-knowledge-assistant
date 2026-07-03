import logging

import numpy as np
from huggingface_hub import InferenceClient

from app.config import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> InferenceClient:
    global _client
    if _client is None:
        if not settings.hf_api_token:
            raise ValueError(
                "HF_API_TOKEN is required for embeddings via HuggingFace Inference API. "
                "Get a free token at https://huggingface.co/settings/tokens"
            )
        _client = InferenceClient(token=settings.hf_api_token)
    return _client


def embed_text(text: str) -> list[float]:
    client = _get_client()
    result = client.feature_extraction(
        text,
        model="sentence-transformers/all-MiniLM-L6-v2",
    )
    result = np.atleast_2d(result)
    return result.mean(axis=0).tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    if len(texts) == 0:
        return []
    return [embed_text(t) for t in texts]
