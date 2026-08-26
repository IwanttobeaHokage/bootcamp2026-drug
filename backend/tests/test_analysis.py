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
