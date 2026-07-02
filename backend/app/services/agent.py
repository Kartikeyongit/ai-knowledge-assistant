import json
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, Message
from app.services.llm import generate_conversation_title, get_llm
from app.services.tools import create_tools

AGENT_PROMPT = """You are an AI Knowledge Assistant with access to tools that can search, summarize, and compare documents, as well as search the web.

Follow these guidelines:
1. When asked a question, first try to find relevant information using search_documents.
2. If the user asks about specific documents, use list_documents first to find them.
3. Use web_search for real-time information, current events, or topics not covered in the local documents.
4. Use summarize_document when the user wants a summary of a specific document.
5. Use compare_documents when the user wants to compare two documents.
6. Always cite which document(s) or web source(s) your information comes from.
7. If you need more information, ask the user clarifying questions.
 8. Be concise but thorough in your responses.
9. Format your responses using Markdown — use headings, bullet lists, numbered lists, bold text, code blocks, and tables where appropriate to make answers clear and scannable."""


async def agent_chat_stream(
    conversation_id: str,
    question: str,
    db: Session,
) -> AsyncGenerator[str, None]:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise ValueError("Conversation not found")

    past_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()

    msg_list = [SystemMessage(content=AGENT_PROMPT)]
    for msg in past_messages:
        if msg.role == "user":
            msg_list.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            msg_list.append(AIMessage(content=msg.content))

    msg_list.append(HumanMessage(content=question))

    tools = create_tools(db, conv.user_id)
    llm = get_llm()
    agent = create_react_agent(llm, tools, version="v2")

    full_response = ""
    async for event in agent.astream_events(
        {"messages": msg_list},
        version="v2",
    ):
        kind = event.get("event")
        if kind == "on_chat_model_stream":
            chunk = event.get("data", {}).get("chunk", "")
            if hasattr(chunk, "content") and chunk.content:
                full_response += chunk.content
                yield json.dumps({"type": "content", "data": chunk.content}) + "\n"
        elif kind == "on_tool_start":
            tool_input = event.get("data", {}).get("input", "")
            tool_name = event.get("name", "")
            yield json.dumps({
                "type": "tool_start",
                "data": {"tool": tool_name, "input": str(tool_input)[:300]},
            }) + "\n"
        elif kind == "on_tool_end":
            tool_output = event.get("data", {}).get("output", "")
            yield json.dumps({
                "type": "tool_end",
                "data": {"output": str(tool_output)[:500]},
            }) + "\n"

    yield json.dumps({"type": "done", "data": {}}) + "\n"

    now = datetime.now(timezone.utc)
    conv.updated_at = now

    existing_msg_count = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).count()

    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=question,
        created_at=now,
    )
    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=full_response,
        created_at=now,
    )
    db.add(user_msg)
    db.add(assistant_msg)

    if conv.title == "New Conversation" and existing_msg_count == 0 and not conv.is_demo:
        title = await generate_conversation_title(question)
        if title and title != "New Conversation":
            conv.title = title
            yield json.dumps({"type": "title", "data": title}) + "\n"

    db.commit()
