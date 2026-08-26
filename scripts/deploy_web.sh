#!/usr/bin/env bash
# 프론트엔드(frontend/dist)를 S3 에 올린다. 백엔드는 여기서 다루지 않는다.
#
# 쓰는 법:
#   WEB_BUCKET=my-bucket API_BASE_URL=https://api.example.com scripts/deploy_web.sh
#
# 선택:
#   CLOUDFRONT_DISTRIBUTION_ID  주면 index.html 캐시를 무효화한다.
#   AWS_REGION                  기본 ap-northeast-2
#
# 자세한 설명: docs/DEPLOY.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/frontend/dist"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"

fail() { echo "[deploy_web] $1" >&2; exit 1; }

[ -n "${WEB_BUCKET:-}" ] || fail "WEB_BUCKET 이 비어 있습니다. 올릴 버킷 이름을 지정하세요."
# VITE_API_BASE_URL 은 빌드 시점에 번들 안에 문자열로 박힌다. 나중에 못 바꾼다.
[ -n "${API_BASE_URL:-}" ] || fail "API_BASE_URL 이 비어 있습니다. 배포된 백엔드 주소가 필요합니다."

case "$API_BASE_URL" in
  http://localhost*|http://127.0.0.1*)
    fail "API_BASE_URL 이 localhost 입니다. 이대로 빌드하면 배포본이 로컬 서버를 부릅니다." ;;
esac

echo "[deploy_web] 1/4 빌드 (API_BASE_URL=$API_BASE_URL)"
( cd "$ROOT/frontend" && VITE_API_BASE_URL="$API_BASE_URL" npm run build )

[ -f "$DIST/index.html" ] || fail "$DIST/index.html 이 없습니다. 빌드가 실패했습니다."

# 파일명에 해시가 붙어 있으므로 내용이 바뀌면 이름도 바뀐다 -> 영구 캐시해도 안전하다.
echo "[deploy_web] 2/4 assets 업로드 (영구 캐시)"
aws s3 sync "$DIST" "s3://$WEB_BUCKET" \
  --region "$AWS_REGION" \
  --delete \
  --exclude index.html \
  --cache-control "public,max-age=31536000,immutable"

# index.html 은 이름이 고정이라 캐시되면 옛날 화면이 계속 뜬다.
echo "[deploy_web] 3/4 index.html 업로드 (캐시 없음)"
aws s3 cp "$DIST/index.html" "s3://$WEB_BUCKET/index.html" \
  --region "$AWS_REGION" \
  --cache-control "no-cache"

if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
  echo "[deploy_web] 4/4 CloudFront 캐시 무효화"
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/index.html" >/dev/null
else
  echo "[deploy_web] 4/4 건너뜀 (CLOUDFRONT_DISTRIBUTION_ID 없음)"
fi

echo "[deploy_web] 완료. 백엔드 CORS_ORIGINS 에 이 사이트 주소가 들어있는지 확인하세요."
