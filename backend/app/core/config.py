"""환경변수. 값은 .env 에서 채운다.

LLM 은 우리가 직접 호출하지 않는다. 외부(AWS) 담당자가 올린 엔드포인트를 부른다.
아직 주소를 못 받았으면 LLM_PROVIDER=mock 으로 두면 앱이 그대로 돌아간다.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/.env 를 읽어서 환경변수로 올린다.
# 이미 셸이나 배포 환경에 설정된 값이 있으면 그쪽을 우선한다(override=False).
load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

# --- 서버 ---------------------------------------------------------------
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# --- LLM 연결 방식 -------------------------------------------------------
# mock   : 로컬 개발용 고정 응답 (AWS 없이도 프론트 작업 가능)
# http   : API Gateway / Lambda Function URL 을 HTTP 로 호출
# lambda : boto3 로 Lambda 를 직접 invoke
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock")
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))

# --- [빈 칸] AWS 담당자에게 받아서 채울 값 --------------------------------
# LLM_PROVIDER=http 일 때 사용
LLM_API_BASE_URL = os.getenv("LLM_API_BASE_URL", "")
LLM_API_PATH = os.getenv("LLM_API_PATH", "/analyze")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

# LLM_PROVIDER=lambda 일 때 사용
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")
LAMBDA_FUNCTION_NAME = os.getenv("LAMBDA_FUNCTION_NAME", "")
# 자격증명은 코드에 넣지 않는다. aws configure 또는 IAM Role 을 쓴다.
