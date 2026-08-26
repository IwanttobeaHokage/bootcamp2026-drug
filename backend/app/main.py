from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analysis
from app.core.config import CORS_ORIGINS, LLM_API_BASE_URL, LLM_PROVIDER

app = FastAPI(title="bootcamp2026-drug", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router)


@app.get("/health")
def health() -> dict[str, str]:
    """현재 어떤 LLM 연결 방식으로 떠 있는지 함께 알려준다.

    .env 를 고쳤는데 반영이 안 될 때 여기부터 확인하면 된다.
    주소는 노출하지 않고 설정 여부만 표시한다.
    """
    return {
        "status": "ok",
        "llm_provider": LLM_PROVIDER,
        "llm_endpoint_configured": "yes" if LLM_API_BASE_URL else "no",
    }
