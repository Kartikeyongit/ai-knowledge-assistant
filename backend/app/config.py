import logging

from pydantic_settings import BaseSettings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/knowledge_assistant"
    groq_api_key: str = ""
    hf_api_token: str = ""
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    llm_model: str = "llama-3.3-70b-versatile"
    title_model: str = "llama-3.1-8b-instant"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    max_demo_docs: int = 5
    upload_dir: str = "uploads"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8081"]
    cors_origin_regex: str = r"https://.*\.vercel\.app"
    clerk_jwks_url: str = "https://api.clerk.com/v1/jwks"
    clerk_jwt_authorized_party: str = ""
    web_search_provider: str = "duckduckgo"
    tavily_api_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
