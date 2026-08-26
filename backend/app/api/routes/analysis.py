import logging

from fastapi import APIRouter, HTTPException

from app.schemas.analysis import AnalysisRequest, AnalysisResult
from app.services.analysis_service import run_analysis
from app.services.llm.base import LlmProviderError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["analysis"])


@router.post("/analyses", response_model=AnalysisResult)
def create_analysis(request: AnalysisRequest) -> AnalysisResult:
    """영양제 + 프로필(+선택: 복용 중인 약)을 분석한다.

    돌려주는 것: 영양소 조합 / 주의점(영양제-약 상호작용 포함) / 복용시기.
    개인 건강정보는 저장하지 않는다. 로그에도 남기지 않는다.
    """
    try:
        return run_analysis(request)
    except LlmProviderError as exc:
        logger.warning("analysis_failed: %s", exc)
        raise HTTPException(status_code=502, detail="analysis_failed")
    except Exception:
        logger.exception("analysis_failed_unexpected")
        raise HTTPException(status_code=502, detail="analysis_failed")
