"""AWS Lambda 진입점.

FastAPI 앱을 그대로 두고 Lambda 이벤트만 ASGI 로 번역한다.
로컬 개발은 예전처럼 `uvicorn app.main:app --reload` 를 쓴다. 이 파일은 배포에만 쓰인다.

infra/template.yaml 의 Handler 값과 이 파일 경로가 짝이다. 한쪽만 바꾸면 배포가 깨진다.
"""

from mangum import Mangum

from app.main import app

# lifespan="off": Lambda 는 요청마다 깨어나므로 startup/shutdown 이벤트를 쓰지 않는다.
handler = Mangum(app, lifespan="off")
