"""LLM 이 지켜야 하는 응답 스키마.

docs/LLM_CONTRACT.md 2절 = backend/app/schemas/analysis.py 의 AnalysisBody 와 같아야 한다.
셋 중 하나가 바뀌면 나머지도 같이 바꾼다. 여기 없는 키를 넣으면 백엔드가 422 로 거절한다.
"""

# 하루 8개 시점. 시간대와 식사 전후가 한 값에 들어 있다. GLOSSARY 4-3.
TIME_SLOTS = [
    "wake_up",
    "morning_before_meal", "morning_after_meal",
    "noon_before_meal", "noon_after_meal",
    "evening_before_meal", "evening_after_meal",
    "bedtime",
]

NUTRIENT_ITEM = {
    "type": "object",
    "properties": {
        "nutrient": {"type": "string"},
        "nutrient_category": {
            "type": "string",
            "enum": ["deficient", "synergy", "maintain", "reduce"],
        },
        "recommended_dose": {"type": "string"},
        "rationale": {"type": "string"},
        "evidence": {"type": ["string", "null"]},
    },
    "required": ["nutrient", "nutrient_category", "recommended_dose", "rationale", "evidence"],
    "additionalProperties": False,
}

CAUTION_ITEM = {
    "type": "object",
    "properties": {
        "caution": {"type": "string"},
        "interaction_type": {
            "type": "string",
            "enum": [
                "supplement_medication",
                "supplement_supplement",
                "supplement_food",
                "dose_limit",
                "condition",
            ],
        },
        "related_supplement": {"type": ["string", "null"]},
        "related_medication": {"type": ["string", "null"]},
        "risk_level": {"type": "string", "enum": ["low", "moderate", "high"]},
    },
    "required": [
        "caution", "interaction_type", "related_supplement",
        "related_medication", "risk_level",
    ],
    "additionalProperties": False,
}

INTAKE_SCHEDULE_ITEM = {
    "type": "object",
    "properties": {
        "time_slot": {"type": "string", "enum": TIME_SLOTS},
        "supplement_name": {"type": "string"},
        "spacing_hours": {"type": ["integer", "null"], "minimum": 0, "maximum": 24},
        "avoid_with": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["time_slot", "supplement_name", "spacing_hours", "avoid_with"],
    "additionalProperties": False,
}

ANALYSIS_BODY = {
    "type": "object",
    "properties": {
        "nutrient_stack": {"type": "array", "items": NUTRIENT_ITEM},
        "cautions": {"type": "array", "items": CAUTION_ITEM},
        "intake_schedule": {"type": "array", "items": INTAKE_SCHEDULE_ITEM},
    },
    "required": ["nutrient_stack", "cautions", "intake_schedule"],
    "additionalProperties": False,
}
