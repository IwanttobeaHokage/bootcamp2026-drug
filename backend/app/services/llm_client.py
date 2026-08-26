"""Anthropic Claude 호출 래퍼.

자유 텍스트를 받지 않고 tool use 로 JSON 출력을 강제한다.
아래 input_schema 의 필드명은 schemas/analysis.py 및 docs/GLOSSARY.md 와
반드시 1:1로 일치해야 한다.
"""

import uuid

from anthropic import Anthropic

from app.core.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, MAX_TOKENS
from app.schemas.analysis import AnalysisRequest, AnalysisResult
from app.services.prompt_builder import SYSTEM_PROMPT, build_prompt

TIME_SLOTS = [
    "morning", "noon", "evening", "bedtime",
    "before_meal", "with_meal", "after_meal", "empty_stomach",
]

REPORT_TOOL = {
    "name": "report_analysis",
    "description": "복용약 분석 결과를 구조화해서 보고한다.",
    "input_schema": {
        "type": "object",
        "properties": {
            "nutrient_stack": {
                "type": "array",
                "description": "보충을 고려할 영양소 조합",
                "items": {
                    "type": "object",
                    "properties": {
                        "nutrient": {"type": "string"},
                        "recommended_dose": {"type": "string"},
                        "rationale": {"type": "string"},
                        "evidence": {"type": "string"},
                    },
                    "required": ["nutrient", "recommended_dose", "rationale"],
                },
            },
            "cautions": {
                "type": "array",
                "description": "약-영양소 상호작용 등 주의점",
                "items": {
                    "type": "object",
                    "properties": {
                        "caution": {"type": "string"},
                        "interaction": {"type": "string"},
                        "risk_level": {"type": "string", "enum": ["low", "moderate", "high"]},
                    },
                    "required": ["caution", "risk_level"],
                },
            },
            "intake_schedule": {
                "type": "array",
                "description": "하루 중 복용시기",
                "items": {
                    "type": "object",
                    "properties": {
                        "time_slot": {"type": "string", "enum": TIME_SLOTS},
                        "intake_timing": {"type": "string", "enum": TIME_SLOTS},
                        "nutrient": {"type": "string"},
                        "spacing_hours": {"type": "integer"},
                    },
                    "required": ["time_slot", "intake_timing", "nutrient"],
                },
            },
        },
        "required": ["nutrient_stack", "cautions", "intake_schedule"],
    },
}


class LlmClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._client = Anthropic(api_key=api_key or ANTHROPIC_API_KEY)
        self._model = model or ANTHROPIC_MODEL

    def analyze(self, request: AnalysisRequest) -> AnalysisResult:
        response = self._client.messages.create(
            model=self._model,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            tools=[REPORT_TOOL],
            tool_choice={"type": "tool", "name": "report_analysis"},
            messages=[{"role": "user", "content": build_prompt(request)}],
        )

        for block in response.content:
            if block.type == "tool_use" and block.name == "report_analysis":
                return AnalysisResult(
                    request_id=uuid.uuid4().hex[:8],
                    **block.input,
                )

        raise ValueError("LLM 응답에 report_analysis tool_use 블록이 없습니다.")
