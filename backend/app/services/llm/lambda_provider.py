"""boto3 로 Lambda 를 직접 invoke 한다.

[빈 칸] .env 에 LAMBDA_FUNCTION_NAME, AWS_REGION 을 채우면 동작한다.
자격증명은 코드에 넣지 말고 aws configure 또는 IAM Role 로 준다.
"""

import json

from app.core.config import AWS_REGION, LAMBDA_FUNCTION_NAME
from app.schemas.analysis import AnalysisRequest
from app.services.llm.base import LlmProviderError


class LambdaProvider:
    def __init__(self, function_name: str | None = None) -> None:
        self._function_name = function_name or LAMBDA_FUNCTION_NAME
        if not self._function_name:
            raise LlmProviderError(
                "LAMBDA_FUNCTION_NAME 이 비어 있습니다. .env 를 채우거나 "
                "LLM_PROVIDER=mock 으로 두세요."
            )
        try:
            import boto3
        except ImportError as exc:
            raise LlmProviderError("boto3 가 없습니다. pip install boto3") from exc

        self._client = boto3.client("lambda", region_name=AWS_REGION)

    def analyze(self, request: AnalysisRequest) -> dict:
        try:
            response = self._client.invoke(
                FunctionName=self._function_name,
                InvocationType="RequestResponse",
                Payload=json.dumps(request.model_dump(mode="json")).encode("utf-8"),
            )
            payload = json.loads(response["Payload"].read())
        except Exception as exc:
            raise LlmProviderError(f"Lambda invoke 실패: {type(exc).__name__}") from exc

        if response.get("FunctionError"):
            raise LlmProviderError(f"Lambda 내부 오류: {payload}")

        # API Gateway 프록시 형식으로 감싸서 오는 경우도 받아준다.
        if isinstance(payload, dict) and "body" in payload and "statusCode" in payload:
            body = payload["body"]
            return json.loads(body) if isinstance(body, str) else body
        return payload
