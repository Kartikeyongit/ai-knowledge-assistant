import logging
from typing import AsyncGenerator

from langchain_groq import ChatGroq
from langchain_core.messages import AIMessage, HumanMessage

from app.config import settings

logger = logging.getLogger(__name__)

_llm = None
_title_llm = None


def get_llm():
    global _llm
    if _llm is None:
        logger.info("Initializing LLM: %s", settings.llm_model)
        _llm = ChatGroq(
            model=settings.llm_model,
            temperature=0.3,
            max_tokens=4096,
            api_key=settings.groq_api_key,
        )
    return _llm


def get_title_llm():
    global _title_llm
    if _title_llm is None:
        logger.info("Initializing title LLM: %s", settings.title_model)
        _title_llm = ChatGroq(
            model=settings.title_model,
            temperature=0.3,
            max_tokens=100,
            api_key=settings.groq_api_key,
        )
    return _title_llm


def build_rag_prompt(context: str, question: str) -> list:
    system_prompt = (
        "You are an AI knowledge assistant. Answer the user's question based solely on the provided context. "
        "If the context doesn't contain enough information, say so clearly. "
        "Cite the source document names when referencing specific information. "
        "Format your response using Markdown — use headings, bullet lists, numbered lists, bold text, and tables where appropriate to make your answer clear and scannable.\n\n"
        f"Context:\n{context}"
    )
    return [
        HumanMessage(content=f"{system_prompt}\n\nQuestion: {question}"),
    ]


async def stream_chat(messages: list) -> AsyncGenerator[str, None]:
    llm = get_llm()
    async for chunk in llm.astream(messages):
        if hasattr(chunk, "content") and chunk.content:
            yield chunk.content


TITLE_PROMPT = """You are a conversation titling assistant. Generate a very short, concise title (maximum 6 words) for a conversation that starts with the user message below. The title should describe the core topic or question. Return ONLY the title — no quotes, no punctuation, no explanation.

User message: {message}

Title:"""


async def generate_conversation_title(first_message: str) -> str:
    try:
        llm = get_title_llm()
        response = await llm.ainvoke([
            HumanMessage(content=TITLE_PROMPT.format(message=first_message[:500])),
        ])
        title = response.content.strip().strip('"').strip("'").strip('.')
        if not title or len(title) > 100:
            return "New Conversation"
        return title
    except Exception as e:
        logger.warning("Failed to generate conversation title: %s", e)
        return "New Conversation"
