#!/usr/bin/env bash
# Bedrock LLM 스택(API Gateway + Lambda)을 배포한다. infra/llm-template.yaml 을 쓴다.
#
# 쓰는 법:
#   scripts/deploy_llm.sh
#
# 선택:
#   LLM_STACK_NAME       기본 bootcamp2026-llm
#   AWS_REGION           기본 ap-northeast-2
#   SAM_ARTIFACT_BUCKET  빌드 산출물 버킷 (없으면 --resolve-s3)
#   BEDROCK_MODEL_ID     기본은 템플릿 기본값(global.anthropic.claude-sonnet-5)
#   LLM_EFFORT           low | medium | high
#   INTEGRATION_TIMEOUT_MS  기본 29000. 쿼터(L-E5AE38E3) 상향 승인 후에만 더 크게.
#
# 출력: 아래 두 줄만 stdout 으로 낸다. 다른 스크립트가 eval 로 받아 쓴다.
#   LLM_API_BASE_URL='...'
#   LLM_API_KEY='...'
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_NAME="${LLM_STACK_NAME:-bootcamp2026-llm}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"

fail() { echo "[deploy_llm] $1" >&2; exit 1; }

command -v sam >/dev/null || fail "SAM CLI 가 없습니다."

PARAMS=()
[ -n "${BEDROCK_MODEL_ID:-}" ] && PARAMS+=("ModelId=$BEDROCK_MODEL_ID")
[ -n "${LLM_EFFORT:-}" ] && PARAMS+=("Effort=$LLM_EFFORT")
[ -n "${INTEGRATION_TIMEOUT_MS:-}" ] && PARAMS+=("IntegrationTimeoutMillis=$INTEGRATION_TIMEOUT_MS")

if [ -n "${SAM_ARTIFACT_BUCKET:-}" ]; then
  ARTIFACT_ARGS=(--s3-bucket "$SAM_ARTIFACT_BUCKET" --s3-prefix "$STACK_NAME")
else
  ARTIFACT_ARGS=(--resolve-s3)
fi

echo "[deploy_llm] 1/3 빌드" >&2
sam build --template "$ROOT/infra/llm-template.yaml" >&2

echo "[deploy_llm] 2/3 배포 (stack=$STACK_NAME)" >&2
if [ ${#PARAMS[@]} -gt 0 ]; then
  sam deploy --stack-name "$STACK_NAME" --region "$AWS_REGION" "${ARTIFACT_ARGS[@]}" \
    --capabilities CAPABILITY_IAM --no-confirm-changeset --no-fail-on-empty-changeset \
    --parameter-overrides "${PARAMS[@]}" >&2
else
  sam deploy --stack-name "$STACK_NAME" --region "$AWS_REGION" "${ARTIFACT_ARGS[@]}" \
    --capabilities CAPABILITY_IAM --no-confirm-changeset --no-fail-on-empty-changeset >&2
fi

echo "[deploy_llm] 3/3 엔드포인트와 키 조회" >&2
stack_output() {
  aws cloudformation describe-stacks     --stack-name "$STACK_NAME" --region "$AWS_REGION"     --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue | [0]" --output text
}

BASE_URL="$(stack_output LlmApiBaseUrl)"
KEY_ID="$(stack_output ApiKeyId)"

[ -n "$BASE_URL" ] && [ "$BASE_URL" != "None" ] || fail "LlmApiBaseUrl 을 찾지 못했습니다."
[ -n "$KEY_ID" ] && [ "$KEY_ID" != "None" ] || fail "ApiKeyId 를 찾지 못했습니다."

# 키 값은 여기서만 꺼내고 로그에 남기지 않는다.
API_KEY="$(aws apigateway get-api-key --api-key "$KEY_ID" --include-value \
  --region "$AWS_REGION" --query "value" --output text)"
[ -n "$API_KEY" ] && [ "$API_KEY" != "None" ] || fail "API 키 값을 읽지 못했습니다."

printf "LLM_API_BASE_URL='%s'\n" "$BASE_URL"
printf "LLM_API_KEY='%s'\n" "$API_KEY"
