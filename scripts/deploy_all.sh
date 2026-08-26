#!/usr/bin/env bash
# 백엔드 -> 프론트 순서로 한 번에 배포한다.
#
#   백엔드가 먼저인 이유: 프론트는 백엔드 주소를 빌드 시점에 번들에 박기 때문.
#   백엔드의 CORS_ORIGINS 는 CloudFront 도메인에서 자동으로 가져온다(시크릿 하나 덜 씀).
#
# 쓰는 법:
#   WEB_BUCKET=bipa-final-bucket CLOUDFRONT_DISTRIBUTION_ID=E2ARG39AU2O8WS scripts/deploy_all.sh
#
# 선택: STACK_NAME / AWS_REGION / SAM_ARTIFACT_BUCKET / LLM_PROVIDER / LLM_API_BASE_URL / LLM_API_KEY
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"

fail() { echo "[deploy_all] $1" >&2; exit 1; }

[ -n "${WEB_BUCKET:-}" ] || fail "WEB_BUCKET 이 비었습니다."
[ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ] || fail "CLOUDFRONT_DISTRIBUTION_ID 가 비었습니다."

echo "[deploy_all] 프론트 도메인 확인"
WEB_DOMAIN="$(aws cloudfront get-distribution \
  --id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --query "Distribution.DomainName" --output text)"
[ -n "$WEB_DOMAIN" ] && [ "$WEB_DOMAIN" != "None" ] || fail "CloudFront 도메인을 찾지 못했습니다."
WEB_ORIGIN="https://$WEB_DOMAIN"
echo "[deploy_all] 프론트 = $WEB_ORIGIN"

echo "[deploy_all] === 1단계: 백엔드 ==="
API_BASE_URL="$(CORS_ORIGINS="$WEB_ORIGIN" AWS_REGION="$AWS_REGION" SAM_ARTIFACT_BUCKET="${SAM_ARTIFACT_BUCKET:-}" "$ROOT/scripts/deploy_api.sh")"
echo "[deploy_all] 백엔드 = $API_BASE_URL"

echo "[deploy_all] === 2단계: 프론트 ==="
WEB_BUCKET="$WEB_BUCKET" \
API_BASE_URL="$API_BASE_URL" \
CLOUDFRONT_DISTRIBUTION_ID="$CLOUDFRONT_DISTRIBUTION_ID" \
AWS_REGION="$AWS_REGION" \
  "$ROOT/scripts/deploy_web.sh"

echo "[deploy_all] === 3단계: 확인 ==="
API_CODE="$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/health" || echo 000)"
WEB_CODE="$(curl -s -o /dev/null -w "%{http_code}" "$WEB_ORIGIN/" || echo 000)"
echo "[deploy_all] GET $API_BASE_URL/health -> $API_CODE"
echo "[deploy_all] GET $WEB_ORIGIN/ -> $WEB_CODE"

[ "$API_CODE" = "200" ] || fail "백엔드 health 가 200 이 아닙니다. Lambda 로그를 확인하세요."
if [ "$WEB_CODE" != "200" ]; then
  # 업로드는 됐는데 화면이 안 뜨는 전형적 원인은 CloudFront 배포 설정이다.
  fail "프론트가 $WEB_CODE 입니다. CloudFront 의 Origin path(비어 있어야 함)와 Default root object(index.html)를 확인하세요. docs/DEPLOY.md 2-B"
fi

echo "[deploy_all] 완료: $WEB_ORIGIN"
