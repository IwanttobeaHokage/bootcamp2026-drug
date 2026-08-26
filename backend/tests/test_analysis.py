"""용어(필드명)가 GLOSSARY 와 어긋나면 여기서 깨진다."""

import pytest
from pydantic import ValidationError

from app.schemas.analysis import AnalysisRequest
from app.services.analysis_service import run_analysis
from app.services.llm.mock_provider import MockProvider

VALID_REQUEST = {
    "user_profile": {"age": 30, "sex": "female", "weight_kg": 55.0},
    "supplements": [
        {
            "supplement_name": "비타민 D 1000IU",
            "nutrient": "비타민 D",
            "dose_amount": 1000,
            "dose_unit": "iu",
            "dose_frequency": 1,
            "intake_time": "with_meal",
        }
    ],
    "medications": [{"medication_name": "와파린"}],
}


def test_request_uses_glossary_field_names():
    request = AnalysisRequest.model_validate(VALID_REQUEST)
    assert request.supplements[0].dose_amount == 1000
    assert request.medications[0].medication_name == "와파린"


def test_medications_are_optional():
    payload = {**VALID_REQUEST}
    payload.pop("medications")
    request = AnalysisRequest.model_validate(payload)
    assert request.medications == []


def test_rejects_non_glossary_field_name():
    # 사전에 없는 필드명은 거부된다. GLOSSARY 7절의 금지어 표 참고.  glossary-ok
    with pytest.raises(ValidationError):
        AnalysisRequest.model_validate(
            {**VALID_REQUEST, "drugs": [{"name": "와파린"}]}
        )


def test_supplement_medication_interaction_is_reported():
    request = AnalysisRequest.model_validate(VALID_REQUEST)
    result = run_analysis(request, provider=MockProvider())

    types = [caution.interaction_type.value for caution in result.cautions]
    assert "supplement_medication" in types
    assert result.disclaimer
    assert result.request_id


def test_nutrient_category_is_required():
    """추천 유형(부족/시너지/유지/감량)이 빠지면 계약 위반으로 걸러진다."""
    from app.schemas.analysis import AnalysisBody

    with pytest.raises(ValidationError):
        AnalysisBody.model_validate(
            {
                "nutrient_stack": [
                    {
                        "nutrient": "비타민 D",
                        "recommended_dose": "1000IU / 1일 1회",
                        "rationale": "설명",
                    }
                ],
                "cautions": [],
                "intake_schedule": [],
            }
        )


def test_schedule_reports_what_not_to_take_together():
    request = AnalysisRequest.model_validate(VALID_REQUEST)
    result = run_analysis(request, provider=MockProvider())

    assert result.nutrient_stack[0].nutrient_category.value in {
        "deficient",
        "synergy",
        "maintain",
        "reduce",
    }
    # 약을 같이 입력했으므로 그 약이 avoid_with 에 들어가야 한다.
    assert "와파린" in result.intake_schedule[0].avoid_with


def test_health_reports_current_llm_provider():
    """/health 로 지금 어떤 연결 방식으로 떠 있는지 확인할 수 있어야 한다.

    .env 를 고쳤는데 반영이 안 될 때 가장 먼저 보는 곳이다.
    """
    from fastapi.testclient import TestClient

    from app.main import app

    response = TestClient(app).get("/health")
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "ok"
    assert body["llm_provider"] in {"mock", "http", "lambda"}
    assert body["llm_endpoint_configured"] in {"yes", "no"}
