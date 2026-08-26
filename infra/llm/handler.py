"""Bedrock 으로 영양제 분석 본문을 만드는 Lambda.

계약: docs/LLM_CONTRACT.md — 요청 JSON 을 받아 nutrient_stack / cautions /
intake_schedule 3개 키를 돌려준다. request_id 와 disclaimer 는 백엔드가 채운다.

프롬프트 문구의 출처는 backend/app/services/prompt_builder.py 다.
그쪽을 고치면 여기도 같이 고친다.
"""

import json
import os

from anthropic import AnthropicBedrock

from schema import ANALYSIS_BODY

# Bedrock 은 on-demand 모델 ID 대신 추론 프로파일 ID 를 요구한다(global. 접두사).
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "global.anthropic.claude-sonnet-5")
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "ap-northeast-2")
# API Gateway REST API 의 통합 타임아웃이 29초다. 그 안에 끝나야 한다.
MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", "8000"))
# 29초 안에 끝내려면 생각과 출력 길이를 둘 다 줄여야 한다. low | medium | high
EFFORT = os.environ.get("LLM_EFFORT", "low")

# Bedrock 은 output_config.format 도 tools[].strict 도 받지 않는다(둘 다 400).
# 그래서 스키마는 "도구 하나를 반드시 쓰게 만드는" 방식으로 강제한다.
# 그래도 형태가 틀어질 수 있으므로 backend 의 AnalysisBody 가 최종 검증한다.
SUBMIT_TOOL = {
    "name": "submit_analysis",
    "description": "분석 결과를 계약된 형식으로 제출한다. 반드시 이 도구로만 답한다.",
    "input_schema": ANALYSIS_BODY,
}

client = AnthropicBedrock(aws_region=BEDROCK_REGION)

SYSTEM_PROMPT = """당신은 약사와 영양사의 참고 자료를 정리해 주는 도우미입니다.

규칙:
1. 진단하지 않습니다. 처방하지 않습니다. 약 용량을 바꾸라고 지시하지 않습니다.
2. 사용자가 먹고 있는 영양제를 중심으로 분석합니다.
3. 사용자가 복용 중인 약을 함께 알려줬다면, 그 약과 영양제 사이의 상호작용을
   가장 중요한 주의점으로 다룹니다. (interaction_type=supplement_medication)
4. 확실하지 않으면 추측하지 말고 의사·약사 상담이 필요하다고 적습니다.
5. 위험한 상호작용은 risk_level 을 high 로 표시합니다.
6. nutrient_category 로 부족해서 보충할 것(deficient)과 이미 먹는 것과
   같이 먹으면 좋은 것(synergy)을 구분합니다.
7. 같은 시간대에 함께 먹으면 안 되는 것은 avoid_with 에 이름으로 적습니다.
8. 정해진 JSON 스키마로만 답합니다. 모든 서술은 한국어로 작성합니다.
9. 분량을 지킵니다. 주의점은 중요한 순서로 최대 5개, 영양소는 최대 5개.
   각 rationale 과 caution 은 두 문장을 넘기지 않습니다.
"""


def build_prompt(payload: dict) -> str:
    """계약 요청 JSON 을 사람이 읽는 형태로 편다."""
    profile = payload.get("user_profile", {})
    lines = [
        "다음 사용자의 영양제 섭취 정보를 분석해 주세요.",
        "",
        "[사용자 프로필]",
        f"- 나이: {profile.get('age')}세",
        f"- 성별: {profile.get('sex')}",
        f"- 체중: {profile.get('weight_kg')}kg",
    ]
    if profile.get("height_cm"):
        lines.append(f"- 키: {profile['height_cm']}cm")

    lines += ["", "[먹고 있는 영양제]"]
    for i, item in enumerate(payload.get("supplements", []), start=1):
        nutrient = f" ({item['nutrient']})" if item.get("nutrient") else ""
        lines.append(
            f"{i}. {item.get('supplement_name')}{nutrient} — "
            f"1회 {item.get('dose_amount')}{item.get('dose_unit')}, "
            f"1일 {item.get('dose_frequency')}회, {item.get('intake_time')}"
        )

    medications = payload.get("medications") or []
    if medications:
        lines += ["", "[복용 중인 약] ← 이 약과의 상호작용을 최우선으로 확인하세요"]
        for i, med in enumerate(medications, start=1):
            ingredient = f" (성분: {med['ingredient']})" if med.get("ingredient") else ""
            lines.append(f"{i}. {med.get('medication_name')}{ingredient}")
    else:
        lines += ["", "[복용 중인 약] 없음. 영양제끼리의 상호작용만 확인하세요."]

    return "\n".join(lines)


def _read_payload(event: dict) -> dict:
    """API Gateway 프록시 형식과 직접 invoke 형식을 모두 받는다."""
    body = event.get("body")
    if body is None:
        return event
    return json.loads(body) if isinstance(body, str) else body


def _response(status: int, payload: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False),
    }


def handler(event, context):
    # 건강정보는 로그에 남기지 않는다. 실패해도 내용이 아니라 종류만 기록한다.
    try:
        payload = _read_payload(event)
    except (ValueError, TypeError):
        return _response(400, {"error": "invalid_json"})

    if not payload.get("supplements"):
        return _response(400, {"error": "supplements_required"})

    try:
        message = client.messages.create(
            model=MODEL_ID,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": build_prompt(payload)}],
            tools=[SUBMIT_TOOL],
            tool_choice={"type": "tool", "name": SUBMIT_TOOL["name"]},
            output_config={"effort": EFFORT},
        )
    except Exception as exc:  # 모델 호출 실패는 그대로 502 로 올린다
        print(f"bedrock_call_failed: {type(exc).__name__}")
        return _response(502, {"error": "bedrock_call_failed"})

    if message.stop_reason == "refusal":
        print("bedrock_refusal")
        return _response(502, {"error": "refusal"})

    body = next(
        (b.input for b in message.content if b.type == "tool_use" and b.name == SUBMIT_TOOL["name"]),
        None,
    )
    if body is None:
        print(f"bedrock_no_tool_use: stop_reason={message.stop_reason}")
        return _response(502, {"error": "no_tool_use"})

    missing = [k for k in ("nutrient_stack", "cautions", "intake_schedule") if k not in body]
    if missing:
        print(f"bedrock_incomplete_response: missing={missing}")
        return _response(502, {"error": "incomplete_response"})

    return _response(200, body)
