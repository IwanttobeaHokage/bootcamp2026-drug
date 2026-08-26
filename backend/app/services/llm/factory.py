from app.core.config import LLM_PROVIDER
from app.services.llm.base import LlmProvider, LlmProviderError
from app.services.llm.mock_provider import MockProvider


def get_llm_provider() -> LlmProvider:
    """LLM_PROVIDER 환경변수로 연결 방식을 고른다.

    새 방식을 추가하려면 여기에 분기 하나만 더한다. 라우터는 건드리지 않는다.
    """
    if LLM_PROVIDER == "mock":
        return MockProvider()

    if LLM_PROVIDER == "http":
        from app.services.llm.http_provider import HttpProvider

        return HttpProvider()

    if LLM_PROVIDER == "lambda":
        from app.services.llm.lambda_provider import LambdaProvider

        return LambdaProvider()

    raise LlmProviderError(
        f"알 수 없는 LLM_PROVIDER={LLM_PROVIDER!r}. mock | http | lambda 중 하나여야 합니다."
    )
