import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

HF_EMBEDDING_URL = (
    "https://api-inference.huggingface.co/pipeline/feature-extraction/"
    "sentence-transformers/all-MiniLM-L6-v2"
)


def _embed(inputs: str | list[str]) -> list[list[float]]:
    if not settings.hf_api_token:
        raise ValueError(
            "HF_API_TOKEN is required for embeddings via HuggingFace Inference API. "
            "Get a free token at https://huggingface.co/settings/tokens"
        )

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            HF_EMBEDDING_URL,
            headers={"Authorization": f"Bearer {settings.hf_api_token}"},
            json={"inputs": inputs, "options": {"wait_for_model": True}},
        )
        resp.raise_for_status()
        data = resp.json()

    if isinstance(inputs, str):
        return [data]
    return data


def embed_text(text: str) -> list[float]:
    return _embed(text)[0]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if len(texts) == 0:
        return []
    return _embed(texts)
