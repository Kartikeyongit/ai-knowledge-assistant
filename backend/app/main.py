import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine, get_db
from app.routers import chat, conversations, demo, documents

logger = logging.getLogger(__name__)
start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        db.commit()
        logger.info("pgvector extension ready")
    except Exception as e:
        logger.warning("pgvector check failed: %s", e)
    finally:
        db.close()
    yield


app = FastAPI(
    title="AI Knowledge Assistant",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in settings.cors_origins else settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex if "*" not in settings.cors_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(demo.router)


@app.get("/health")
def health():
    db_ok = False
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
        db_ok = True
    except Exception:
        pass
    return {
        "status": "ok",
        "uptime_s": round(time.time() - start_time),
        "database": "connected" if db_ok else "error",
        "groq_api_key": "configured" if settings.groq_api_key else "missing",
        "model": settings.llm_model,
    }
