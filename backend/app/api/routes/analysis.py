import logging

from fastapi import APIRouter, HTTPException

from app.schemas.analysis import AnalysisRequest, AnalysisResult
from app.services.llm_client import LlmClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["analysis"])


@router.post("/analyses", response_model=AnalysisResult)
def create_analysis(request: AnalysisRequest) -> AnalysisResult:
    """복용약 + 프로필을 분석해 영양소 조합 / 주의점 / 복용시기를 돌려준다.

    개인정보는 저장하지 않는다. 로그에도 남기지 않는다.
    """
    try:
        return LlmClient().analyze(request)
    except Exception:
        logger.exception("analysis_failed")
        raise HTTPException(status_code=502, detail="analysis_failed")
