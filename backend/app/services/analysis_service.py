"""라우터와 LLM 사이. 응답 검증과 서버 필드 채우기를 담당한다."""

import uuid

from pydantic import ValidationError

from app.schemas.analysis import AnalysisBody, AnalysisRequest, AnalysisResult
from app.services.llm.base import LlmProvider, LlmProviderError
from app.services.llm.factory import get_llm_provider


def run_analysis(request: AnalysisRequest, provider: LlmProvider | None = None) -> AnalysisResult:
    """영양제 분석을 실행한다.

    외부 LLM 이 계약(docs/LLM_CONTRACT.md)과 다른 모양을 주면 여기서 걸러 502 로 만든다.
    """
    provider = provider or get_llm_provider()
    raw = provider.analyze(request)

    try:
        body = AnalysisBody.model_validate(raw)
    except ValidationError as exc:
        raise LlmProviderError(f"LLM 응답이 계약과 다릅니다: {exc.error_count()}건 불일치") from exc

    return AnalysisResult(request_id=uuid.uuid4().hex[:8], **body.model_dump())
