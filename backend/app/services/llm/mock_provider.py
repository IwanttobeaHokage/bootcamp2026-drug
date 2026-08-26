"""AWS 없이 프론트/백 개발을 계속할 수 있게 하는 고정 응답.

LLM_PROVIDER=mock (기본값) 일 때 쓰인다.
담당자의 엔드포인트가 나오면 .env 의 LLM_PROVIDER 만 바꾸면 된다.
"""

from app.schemas.analysis import AnalysisRequest


class MockProvider:
    def analyze(self, request: AnalysisRequest) -> dict:
        first = request.supplements[0]
        medication_name = (
            request.medications[0].medication_name if request.medications else None
        )

        cautions = [
            {
                "caution": f"{first.supplement_name} 은 지용성이라 공복 섭취 시 흡수율이 떨어질 수 있습니다.",
                "interaction_type": "supplement_food",
                "related_supplement": first.supplement_name,
                "related_medication": None,
                "risk_level": "low",
            }
        ]
        if medication_name:
            cautions.append(
                {
                    "caution": (
                        f"{first.supplement_name} 과 {medication_name} 을 함께 복용하면 "
                        "약효에 영향을 줄 수 있습니다. 복용 전 약사와 상담하세요."
                    ),
                    "interaction_type": "supplement_medication",
                    "related_supplement": first.supplement_name,
                    "related_medication": medication_name,
                    "risk_level": "moderate",
                }
            )

        return {
            "nutrient_stack": [
                {
                    "nutrient": first.nutrient or first.supplement_name,
                    "nutrient_category": "maintain",
                    "recommended_dose": (
                        f"{first.dose_amount}{first.dose_unit.value} / "
                        f"1일 {first.dose_frequency}회"
                    ),
                    "rationale": "[mock] 실제 분석이 아닙니다. LLM_PROVIDER 를 http 또는 lambda 로 바꾸세요.",
                    "evidence": None,
                }
            ],
            "cautions": cautions,
            "intake_schedule": [
                {
                    "time_slot": "morning",
                    "intake_timing": "after_meal",
                    "supplement_name": first.supplement_name,
                    "spacing_hours": 2 if medication_name else None,
                    "avoid_with": [medication_name] if medication_name else [],
                }
            ],
        }
