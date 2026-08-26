"""LLM 연결 방식이 바뀌어도 라우터는 안 바뀌도록 하는 경계."""

from typing import Protocol

from app.schemas.analysis import AnalysisRequest


class LlmProvider(Protocol):
    """구현체는 analyze() 하나만 채우면 된다.

    반환값은 docs/LLM_CONTRACT.md 의 응답 본문(dict).
    검증은 analysis_service 에서 AnalysisBody 로 한다.
    """

    def analyze(self, request: AnalysisRequest) -> dict: ...


class LlmProviderError(RuntimeError):
    """외부 LLM 호출 실패. 라우터에서 502 로 바꾼다."""
