"""API 계약. 필드명은 docs/GLOSSARY.md 의 표준 용어만 사용한다.

새 필드를 추가하기 전에 반드시 GLOSSARY.md 에 용어를 먼저 등록할 것.
"""

from enum import Enum
from pydantic import BaseModel, ConfigDict, Field

DISCLAIMER = (
    "본 정보는 일반적인 참고용이며 의학적 진단·처방을 대체하지 않습니다. "
    "복용 중인 약이 있다면 반드시 의사 또는 약사와 상담하세요."
)


class Sex(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class DoseUnit(str, Enum):
    mg = "mg"
    g = "g"
    mcg = "mcg"
    ml = "ml"
    iu = "iu"
    tablet = "tablet"
    capsule = "capsule"
    drop = "drop"
    puff = "puff"


class TimeSlot(str, Enum):
    morning = "morning"
    noon = "noon"
    evening = "evening"
    bedtime = "bedtime"
    before_meal = "before_meal"
    with_meal = "with_meal"
    after_meal = "after_meal"
    empty_stomach = "empty_stomach"


class RiskLevel(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"


# --- 입력 ---------------------------------------------------------------


class StrictInput(BaseModel):
    """GLOSSARY 에 없는 필드명이 들어오면 422 로 거부한다."""

    model_config = ConfigDict(extra="forbid")


class UserProfile(StrictInput):
    age: int = Field(ge=0, le=120)
    sex: Sex
    weight_kg: float = Field(gt=0, le=400)
    height_cm: float | None = Field(default=None, gt=0, le=250)


class Medication(StrictInput):
    medication_name: str = Field(min_length=1, max_length=100)
    ingredient: str | None = None
    dose_amount: float = Field(gt=0)
    dose_unit: DoseUnit
    dose_frequency: int = Field(ge=1, le=24, description="1일 복용 횟수")
    intake_time: TimeSlot


class AnalysisRequest(StrictInput):
    user_profile: UserProfile
    medications: list[Medication] = Field(min_length=1, max_length=20)


# --- 출력 ---------------------------------------------------------------


class NutrientItem(BaseModel):
    nutrient: str
    recommended_dose: str
    rationale: str
    evidence: str | None = None


class CautionItem(BaseModel):
    caution: str
    interaction: str | None = None
    risk_level: RiskLevel


class IntakeScheduleItem(BaseModel):
    time_slot: TimeSlot
    intake_timing: TimeSlot
    nutrient: str
    spacing_hours: int | None = Field(default=None, ge=0, le=24)


class AnalysisResult(BaseModel):
    request_id: str
    nutrient_stack: list[NutrientItem]
    cautions: list[CautionItem]
    intake_schedule: list[IntakeScheduleItem]
    disclaimer: str = DISCLAIMER
