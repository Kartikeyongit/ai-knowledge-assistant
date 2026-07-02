import logging
from typing import Optional

from langchain_core.tools import tool
from sqlalchemy.orm import Session

from app.config import settings
from app.models.document import Document
from app.services.llm import get_llm
from app.services.rag import search_docs_raw
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)


def _search_docs(
    query: str,
    db: Session,
    user_id: str,
    document_ids: Optional[list[str]] = None,
    top_k: int = 5,
) -> list[dict]:
    results = search_docs_raw(query, user_id, db, document_ids, top_k)
    return [r for r in results if r["similarity"] >= 0.05]


def _web_search(query: str, num_results: int = 5) -> str:
    """Search the web using DuckDuckGo or Tavily."""
    provider = settings.web_search_provider

    if provider == "tavily" and settings.tavily_api_key:
        try:
            from langchain_community.tools.tavily_search import TavilySearchResults

            tool = TavilySearchResults(max_results=num_results)
            results = tool.invoke({"query": query})
            if not results:
                return "No web results found."
            output = []
            for r in results:
                title = r.get("title", "")
                url = r.get("url", "")
                content = r.get("content", "")
                output.append(f"[{title}]({url})\n{content}")
            return "\n\n".join(output)
        except Exception as e:
            logger.warning("Tavily search failed, falling back to DuckDuckGo: %s", e)

    try:
        from langchain_community.tools.ddg_search import DuckDuckGoSearchRun

        ddg = DuckDuckGoSearchRun()
        raw = ddg.invoke(query)
        if not raw:
            return "No web results found."
        return raw[:3000]
    except Exception as e:
        logger.error("Web search failed: %s", e)
        return f"Web search is currently unavailable: {e}"


def create_tools(db: Session, user_id: str) -> list:
    """Create LangChain tools bound to a database session and user."""

    @tool
    def list_documents() -> str:
        """List all available documents with their IDs and titles."""
        docs = db.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).limit(20).all()
        if not docs:
            return "No documents found."
        result = "\n".join(f"- {d.id}: {d.title} ({d.filename})" for d in docs)
        return f"Available documents:\n{result}"

    @tool
    def search_documents(query: str) -> str:
        """Search documents using semantic vector search. Takes a natural language query and returns relevant passages."""
        results = _search_docs(query, db, user_id)
        if not results:
            return "No relevant results found."
        output = []
        for r in results:
            output.append(f"[{r['title']}] (score: {r['similarity']})\n{r['content']}\n")
        return "\n---\n".join(output)

    @tool
    def summarize_document(document_id: str) -> str:
        """Summarize a document by its ID. Returns a concise summary of the document content."""
        doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
        if not doc:
            return f"Document with ID {document_id} not found."
        text_content = doc.content[:8000] if doc.content else ""
        prompt = f"Summarize the following document concisely:\n\nTitle: {doc.title}\n\n{text_content}"
        response = get_llm().invoke([HumanMessage(content=prompt)])
        return response.content if hasattr(response, "content") else str(response)

    @tool
    def compare_documents(document_id_1: str, document_id_2: str) -> str:
        """Compare two documents by their IDs. Highlights similarities and differences."""
        doc1 = db.query(Document).filter(Document.id == document_id_1, Document.user_id == user_id).first()
        doc2 = db.query(Document).filter(Document.id == document_id_2, Document.user_id == user_id).first()
        if not doc1 or not doc2:
            missing = "doc1" if not doc1 else "doc2"
            return f"Document {missing} not found."
        text1 = doc1.content[:4000] if doc1.content else ""
        text2 = doc2.content[:4000] if doc2.content else ""
        prompt = (
            f"Compare and contrast these two documents:\n\n"
            f"DOCUMENT 1: {doc1.title}\n{text1}\n\n"
            f"DOCUMENT 2: {doc2.title}\n{text2}\n\n"
            "Highlight key similarities, differences, and unique insights from each."
        )
        response = get_llm().invoke([HumanMessage(content=prompt)])
        return response.content if hasattr(response, "content") else str(response)

    @tool
    def web_search(query: str) -> str:
        """Search the web for real-time information, news, or topics not covered in the local documents. Use this when the answer isn't in the user's documents or for current events."""
        return _web_search(query)

    return [list_documents, search_documents, summarize_document, compare_documents, web_search]
