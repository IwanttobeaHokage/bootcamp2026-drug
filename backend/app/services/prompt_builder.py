"""AnalysisRequest -> LLM 프롬프트 문자열."""

from app.schemas.analysis import AnalysisRequest

SYSTEM_PROMPT = """당신은 약사와 영양사의 참고 자료를 정리해 주는 도우미입니다.

규칙:
1. 진단하지 않습니다. 처방하지 않습니다. 새로운 약 용량을 지시하지 않습니다.
2. 영양소는 일반적으로 알려진 상호작용과 결핍 위험에 근거해서만 제안합니다.
3. 확실하지 않으면 추측하지 말고 "의사·약사 상담이 필요하다"고 적습니다.
4. 위험도가 높은 상호작용은 risk_level 을 high 로 표시합니다.
5. 반드시 report_analysis 도구를 호출해 구조화된 형태로만 답합니다.
6. 모든 서술은 한국어로 작성합니다.
"""


def build_prompt(request: AnalysisRequest) -> str:
    profile = request.user_profile
    lines = [
        "다음 사용자의 복용 정보를 분석해 주세요.",
        "",
        "[사용자 프로필]",
        f"- 나이: {profile.age}세",
        f"- 성별: {profile.sex.value}",
        f"- 체중: {profile.weight_kg}kg",
    ]
    if profile.height_cm:
        lines.append(f"- 키: {profile.height_cm}cm")

    lines += ["", "[복용 중인 약]"]
    for i, med in enumerate(request.medications, start=1):
        lines.append(
            f"{i}. {med.medication_name} — "
            f"1회 {med.dose_amount}{med.dose_unit.value}, "
            f"1일 {med.dose_frequency}회, 복용시기 {med.intake_time.value}"
        )

    lines += [
        "",
        "분석해 주세요:",
        "1) nutrient_stack — 보충을 고려할 만한 영양소 조합과 이유",
        "2) cautions — 약과 영양소 사이의 주의점 및 위험도",
        "3) intake_schedule — 하루 중 언제 먹고 약과 몇 시간 띄울지",
    ]
    return "\n".join(lines)
