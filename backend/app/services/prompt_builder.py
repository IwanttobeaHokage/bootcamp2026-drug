"""AWS 쪽 LLM 담당자를 위한 참고용 프롬프트.

우리 서버는 LLM 을 직접 호출하지 않는다. 이 파일은 Lambda 구현자가
그대로 가져다 쓸 수 있도록 남겨둔 '권장 프롬프트' 다.
실제 사용처는 docs/LLM_CONTRACT.md 참고.
"""

from app.schemas.analysis import AnalysisRequest

SYSTEM_PROMPT = """당신은 약사와 영양사의 참고 자료를 정리해 주는 도우미입니다.

규칙:
1. 진단하지 않습니다. 처방하지 않습니다. 약 용량을 바꾸라고 지시하지 않습니다.
2. 사용자가 먹고 있는 영양제를 중심으로 분석합니다.
3. 사용자가 복용 중인 약을 함께 알려줬다면, 그 약과 영양제 사이의 상호작용을
   가장 중요한 주의점으로 다룹니다. (interaction_type=supplement_medication)
4. 확실하지 않으면 추측하지 말고 의사·약사 상담이 필요하다고 적습니다.
5. 위험한 상호작용은 risk_level 을 high 로 표시합니다.
6. 정해진 JSON 스키마로만 답합니다. 모든 서술은 한국어로 작성합니다.
"""


def build_prompt(request: AnalysisRequest) -> str:
    profile = request.user_profile
    lines = [
        "다음 사용자의 영양제 섭취 정보를 분석해 주세요.",
        "",
        "[사용자 프로필]",
        f"- 나이: {profile.age}세",
        f"- 성별: {profile.sex.value}",
        f"- 체중: {profile.weight_kg}kg",
    ]
    if profile.height_cm:
        lines.append(f"- 키: {profile.height_cm}cm")

    lines += ["", "[먹고 있는 영양제]"]
    for i, item in enumerate(request.supplements, start=1):
        nutrient = f" ({item.nutrient})" if item.nutrient else ""
        lines.append(
            f"{i}. {item.supplement_name}{nutrient} — "
            f"1회 {item.dose_amount}{item.dose_unit.value}, "
            f"1일 {item.dose_frequency}회, 섭취시기 {item.intake_time.value}"
        )

    if request.medications:
        lines += ["", "[복용 중인 약] - 영양제와의 상호작용을 반드시 확인할 것"]
        for i, med in enumerate(request.medications, start=1):
            lines.append(f"{i}. {med.medication_name}")
    else:
        lines += ["", "[복용 중인 약] 없음 - 영양제끼리의 상호작용만 확인할 것"]

    lines += [
        "",
        "분석해 주세요:",
        "1) nutrient_stack — 지금 조합에 대한 평가와 보완하면 좋을 영양소",
        "2) cautions — 영양제와 약, 영양제끼리의 주의점 및 위험도",
        "3) intake_schedule — 하루 중 언제 먹고 약과 몇 시간 띄울지",
    ]
    return "\n".join(lines)
