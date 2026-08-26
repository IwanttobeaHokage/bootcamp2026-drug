"""API 계약. 필드명은 docs/GLOSSARY.md 의 표준 용어만 사용한다.

새 필드를 추가하기 전에 반드시 GLOSSARY.md 에 용어를 먼저 등록할 것.

주체는 '영양제(supplement)' 다.
'약(medication)' 은 상호작용을 확인하기 위한 선택 입력이다.
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
    softgel = "softgel"
    scoop = "scoop"
    drop = "drop"


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


class NutrientCategory(str, Enum):
    """영양소를 왜 추천하는지. GLOSSARY 4-6 참고."""

    deficient = "deficient"  # 부족해서 보충 필요
    synergy = "synergy"  # 이미 먹는 것과 같이 먹으면 좋음
    maintain = "maintain"  # 현재 섭취량 적절. 유지
    reduce = "reduce"  # 과다. 줄이는 것 고려


class InteractionType(str, Enum):
    """주의점이 '무엇과 무엇' 사이의 문제인지."""

    supplement_medication = "supplement_medication"  # 영양제 x 약  ← 핵심
    supplement_supplement = "supplement_supplement"  # 영양제 x 영양제
    supplement_food = "supplement_food"  # 영양제 x 음식
    dose_limit = "dose_limit"  # 상한 섭취량 초과
    condition = "condition"  # 나이/성별/체중 관련 주의


class StrictInput(BaseModel):
    """GLOSSARY 에 없는 필드명이 들어오면 422 로 거부한다."""

    model_config = ConfigDict(extra="forbid")


# --- 입력 ---------------------------------------------------------------


class UserProfile(StrictInput):
    age: int = Field(ge=0, le=120)
    sex: Sex
    weight_kg: float = Field(gt=0, le=400)
    height_cm: float | None = Field(default=None, gt=0, le=250)


class Supplement(StrictInput):
    """사용자가 먹고 있는 영양제 1건."""

    supplement_name: str = Field(min_length=1, max_length=100, description="제품명 또는 성분명")
    nutrient: str | None = Field(default=None, description="주요 영양소. 예: 비타민 D")
    dose_amount: float = Field(gt=0)
    dose_unit: DoseUnit
    dose_frequency: int = Field(ge=1, le=24, description="1일 복용 횟수")
    intake_time: TimeSlot


class Medication(StrictInput):
    """복용 중인 약. 선택 입력이며 상호작용 확인에만 쓴다."""

    medication_name: str = Field(min_length=1, max_length=100)
    ingredient: str | None = None
    dose_amount: float | None = Field(default=None, gt=0)
    dose_unit: DoseUnit | None = None
    dose_frequency: int | None = Field(default=None, ge=1, le=24)
    intake_time: TimeSlot | None = None


class AnalysisRequest(StrictInput):
    user_profile: UserProfile
    supplements: list[Supplement] = Field(min_length=1, max_length=20)
    medications: list[Medication] = Field(
        default_factory=list,
        max_length=20,
        description="선택 입력. 비어 있으면 영양제끼리의 상호작용만 분석한다.",
    )


# --- 출력 ---------------------------------------------------------------


class NutrientItem(StrictInput):
    nutrient: str
    nutrient_category: NutrientCategory
    recommended_dose: str
    rationale: str
    evidence: str | None = None


class CautionItem(StrictInput):
    caution: str
    interaction_type: InteractionType
    related_supplement: str | None = Field(default=None, description="문제가 되는 영양제 이름")
    related_medication: str | None = Field(default=None, description="부딪히는 약 이름")
    risk_level: RiskLevel


class IntakeScheduleItem(StrictInput):
    time_slot: TimeSlot
    intake_timing: TimeSlot
    supplement_name: str
    spacing_hours: int | None = Field(
        default=None, ge=0, le=24, description="약과 몇 시간 띄울지"
    )
    avoid_with: list[str] = Field(
        default_factory=list,
        max_length=20,
        description="이 시간대에 함께 섭취를 피할 영양제·약 이름",
    )


class AnalysisBody(StrictInput):
    """LLM(외부 AWS)이 돌려줘야 하는 본문. docs/LLM_CONTRACT.md 와 동일해야 한다."""

    nutrient_stack: list[NutrientItem]
    cautions: list[CautionItem]
    intake_schedule: list[IntakeScheduleItem]


class AnalysisResult(AnalysisBody):
    """API 최종 응답 = LLM 본문 + 서버가 채우는 필드."""

    request_id: str
    disclaimer: str = DISCLAIMER
