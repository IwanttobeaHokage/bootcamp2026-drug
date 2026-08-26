"""API Gateway / Lambda Function URL 을 HTTP 로 호출한다.

[빈 칸] .env 에 LLM_API_BASE_URL 만 채우면 동작한다.
요청/응답 형식은 docs/LLM_CONTRACT.md 참고.
"""

import httpx

from app.core.config import (
    LLM_API_BASE_URL,
    LLM_API_KEY,
    LLM_API_PATH,
    LLM_TIMEOUT_SECONDS,
)
from app.schemas.analysis import AnalysisRequest
from app.services.llm.base import LlmProviderError


class HttpProvider:
    def __init__(self, base_url: str | None = None) -> None:
        self._base_url = (base_url or LLM_API_BASE_URL).rstrip("/")
        if not self._base_url:
            raise LlmProviderError(
                "LLM_API_BASE_URL 이 비어 있습니다. .env 에 AWS 엔드포인트를 채우거나 "
                "LLM_PROVIDER=mock 으로 두세요."
            )

    def analyze(self, request: AnalysisRequest) -> dict:
        headers = {"Content-Type": "application/json"}
        if LLM_API_KEY:
            headers["x-api-key"] = LLM_API_KEY

        try:
            response = httpx.post(
                f"{self._base_url}{LLM_API_PATH}",
                json=request.model_dump(mode="json"),
                headers=headers,
                timeout=LLM_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            raise LlmProviderError(f"LLM HTTP 호출 실패: {type(exc).__name__}") from exc
