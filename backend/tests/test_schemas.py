"""용어(필드명)가 GLOSSARY 와 어긋나면 여기서 깨진다."""

import pytest
from pydantic import ValidationError

from app.schemas.analysis import AnalysisRequest


def test_analysis_request_uses_glossary_field_names():
    request = AnalysisRequest.model_validate(
        {
            "user_profile": {"age": 34, "sex": "male", "weight_kg": 72.5},
            "medications": [
                {
                    "medication_name": "메트포르민",
                    "dose_amount": 500,
                    "dose_unit": "mg",
                    "dose_frequency": 2,
                    "intake_time": "after_meal",
                }
            ],
        }
    )
    assert request.medications[0].dose_amount == 500


def test_rejects_non_glossary_alias():
    # gender / dosage 는 금지어. GLOSSARY §7 참고.
    with pytest.raises(ValidationError):
        AnalysisRequest.model_validate(
            {
                "user_profile": {"age": 34, "gender": "male", "weight_kg": 72.5},
                "medications": [],
            }
        )
