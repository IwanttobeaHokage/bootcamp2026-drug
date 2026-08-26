#!/usr/bin/env bash
# 백엔드(FastAPI)를 Lambda + Function URL 로 배포한다. infra/template.yaml 을 쓴다.
#
# 쓰는 법:
#   CORS_ORIGINS=https://xxxx.cloudfront.net scripts/deploy_api.sh
#
# 선택:
#   STACK_NAME           기본 bootcamp2026-api
#   AWS_REGION           기본 ap-northeast-2
#   SAM_ARTIFACT_BUCKET  빌드 산출물 버킷. 없으면 --resolve-s3 로 SAM 이 직접 만든다
#                        (그 경우 배포 Role 에 관리 스택 생성 권한이 더 필요하다)
#   LLM_PROVIDER / LLM_API_BASE_URL / LLM_API_PATH / LLM_API_KEY / LLM_TIMEOUT_SECONDS
#
# 성공하면 마지막 줄에 API 주소만 출력한다(다른 스크립트가 받아쓸 수 있게).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_NAME="${STACK_NAME:-bootcamp2026-api}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"

fail() { echo "[deploy_api] $1" >&2; exit 1; }

command -v sam >/dev/null || fail "SAM CLI 가 없습니다. https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
[ -n "${CORS_ORIGINS:-}" ] || fail "CORS_ORIGINS 가 비었습니다. 프론트 주소를 넣지 않으면 브라우저 요청이 전부 막힙니다."

echo "[deploy_api] 1/3 빌드" >&2
sam build --template "$ROOT/infra/template.yaml" >&2

echo "[deploy_api] 2/3 배포 (stack=$STACK_NAME)" >&2
if [ -n "${SAM_ARTIFACT_BUCKET:-}" ]; then
  ARTIFACT_ARGS=(--s3-bucket "$SAM_ARTIFACT_BUCKET" --s3-prefix "$STACK_NAME")
else
  ARTIFACT_ARGS=(--resolve-s3)
fi

sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  "${ARTIFACT_ARGS[@]}" \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "CorsOrigins=$CORS_ORIGINS" \
    "LlmProvider=${LLM_PROVIDER:-mock}" \
    "LlmApiBaseUrl=${LLM_API_BASE_URL:-}" \
    "LlmApiPath=${LLM_API_PATH:-/analyze}" \
    "LlmApiKey=${LLM_API_KEY:-}" \
    "LlmTimeoutSeconds=${LLM_TIMEOUT_SECONDS:-30}" >&2

echo "[deploy_api] 3/3 주소 확인" >&2
API_URL="$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)"

[ -n "$API_URL" ] && [ "$API_URL" != "None" ] || fail "스택 출력에서 ApiUrl 을 찾지 못했습니다."

# Function URL 은 끝에 / 가 붙어서 나온다. 그대로 쓰면 요청 경로가 //api/v1/... 이 된다.
echo "${API_URL%/}"
