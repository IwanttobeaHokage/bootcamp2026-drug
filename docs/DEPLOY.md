# 🚀 DEPLOY — AWS 배포

> **백엔드 → 프론트** 순서로 배포합니다. 프론트가 백엔드 주소를 빌드 시점에 번들에 박기 때문입니다.

| 무엇 | 어디로 | 무엇이 만드나 |
|---|---|---|
| LLM (Bedrock Claude) | Lambda + API Gateway REST API | [infra/llm-template.yaml](../infra/llm-template.yaml) (SAM) |
| 백엔드 (FastAPI) | Lambda + Function URL | [infra/template.yaml](../infra/template.yaml) (SAM) |
| 프론트 (Vite 빌드) | S3 + CloudFront | [scripts/deploy_web.sh](../scripts/deploy_web.sh) |

한 번에: `scripts/deploy_all.sh` · 자동으로: [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) (main 머지 시)

백엔드는 파이썬 프로세스가 필요해서 **S3 에 올라가지 않습니다.** Lambda 가 그 자리를 맡습니다.

---

## 0. 무엇이 버킷에 올라가는가

`frontend/dist/` 의 내용물만 올라갑니다. 파일 3개가 전부입니다.

```
frontend/dist/
├─ index.html              ← 진입점. 버킷 루트에 둔다
└─ assets/
   ├─ index-<해시>.js
   └─ index-<해시>.css
```

`index.html` 이 `/assets/...` 를 **절대경로**로 부르므로 버킷 **루트**에 올려야 합니다.
하위 폴더(`s3://버킷/app/`)에 넣으면 경로가 깨집니다.

⛔ **`backend/`, `.env`, `node_modules/`, `docs/` 는 올리지 않습니다.**
`.env` 가 공개 버킷에 올라가면 비밀값이 전 세계에 공개됩니다.

---

## 1. 백엔드 주소를 먼저 정한다

`VITE_API_BASE_URL` 은 **빌드 시점에 번들 안에 문자열로 박힙니다.**
배포 후 S3 파일만 고쳐서는 바꿀 수 없고, 다시 빌드해서 다시 올려야 합니다.

그래서 순서가 **백엔드 배포 → 주소 확보 → 프론트 빌드 → S3 업로드** 입니다.

---

## 2. 버킷 만들기 (최초 1회)

```bash
aws s3 mb s3://bootcamp2026-web --region ap-northeast-2
```

버킷 이름은 전 세계에서 유일해야 합니다.

### 2-A. 테스트용 — S3 정적 웹호스팅 (HTTP)

```bash
aws s3 website s3://bootcamp2026-web --index-document index.html --error-document index.html
```

퍼블릭 읽기 허용:

```bash
aws s3api put-public-access-block --bucket bootcamp2026-web --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

```bash
aws s3api put-bucket-policy --bucket bootcamp2026-web --policy '{"Version":"2012-10-17","Statement":[{"Sid":"PublicRead","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::bootcamp2026-web/*"}]}'
```

접속: `http://bootcamp2026-web.s3-website.ap-northeast-2.amazonaws.com`

> ⚠️ HTTP 라서 실제 서비스에는 쓰지 않습니다.
> 사이트가 HTTPS 인데 백엔드가 HTTP 이거나 그 반대면 브라우저가 mixed content 로 요청을 막습니다.

### 2-B. 실제 배포 — S3 비공개 + CloudFront (HTTPS)

버킷은 위에서 만든 것을 쓰되 **퍼블릭 해제·버킷 정책·웹호스팅 단계는 하지 않습니다.**

CloudFront 콘솔 → Create distribution:

| 항목 | 값 |
|---|---|
| Origin | 그 S3 버킷 |
| Origin access | **Origin access control (OAC)** 새로 만들기 → 안내되는 버킷 정책을 S3 에 붙여넣기 |
| Default root object | `index.html` |
| Viewer protocol policy | **Redirect HTTP to HTTPS** |

**Error pages 탭에서 2개 추가** — 없으면 오타 URL 에서 XML 에러 화면이 뜹니다.

| HTTP error code | Response page path | HTTP response code |
|---|---|---|
| `403` | `/index.html` | `404` |
| `404` | `/index.html` | `404` |

> 403 도 넣는 이유: 버킷이 비공개(OAC)라 없는 키를 요청하면 S3 가 404 가 아니라 **403 AccessDenied** 를 돌려줍니다.
>
> 응답코드를 `200` 이 아니라 `404` 로 두는 이유: 지금 앱은 라우터가 없어서 딥링크가 없습니다.
> 200 으로 두면 **없는 JS 파일 요청까지 200 + HTML** 을 받아서 배포 사고가 콘솔의
> `Unexpected token '<'` 한 줄로만 보입니다. `react-router` 등을 도입해 실제 경로가 생기면
> 그때 `200` 으로 바꿉니다.

---

## 3. 배포하기 (매번)

```bash
WEB_BUCKET=bootcamp2026-web API_BASE_URL=https://api.example.com CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC scripts/deploy_web.sh
```

[scripts/deploy_web.sh](../scripts/deploy_web.sh) 가 하는 일:

1. `VITE_API_BASE_URL` 을 박아서 `npm run build`
2. `assets/*` 업로드 — 파일명에 해시가 있으므로 `max-age=31536000,immutable`
3. `index.html` 업로드 — 이름이 고정이라 `no-cache` (안 그러면 배포해도 옛 화면이 뜸)
4. CloudFront `/index.html` 캐시 무효화 (ID 를 준 경우만)

`--delete` 로 동기화하므로 이전 배포의 옛 해시 파일은 버킷에서 정리됩니다.

`API_BASE_URL` 이 비었거나 `localhost` 면 스크립트가 **빌드 전에** 멈춥니다.

---

## 4. 백엔드 CORS 열기

사이트 주소가 정해지면 `backend/.env`:

```
CORS_ORIGINS=https://d1234abcd.cloudfront.net
```

여러 개면 콤마로 구분합니다. 이걸 빼먹으면 화면은 뜨는데 분석 요청이 전부 CORS 로 막힙니다.

---

## 4-1. 정책 정리 (누가 읽고, 누가 올리는가)

정책은 **버킷에 붙이는 것**(누가 읽나)과 **배포 주체에 붙이는 것**(누가 올리나) 두 종류다. 섞지 않는다.

`BUCKET` / `ACCOUNT_ID` / `DIST_ID` 는 실제 값으로 바꾼다.

### (1) 버킷 정책 — CloudFront(OAC) 방식 ✅

Block Public Access 는 **4개 전부 켠 채로** 두고, CloudFront 만 읽게 한다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DIST_ID"
        }
      }
    }
  ]
}
```

- `Condition` 의 `AWS:SourceArn` 을 빼면 **아무 CloudFront 배포나** 이 버킷을 읽을 수 있다.
- `s3:ListBucket` 은 주지 않는다. 주면 파일 목록이 노출된다.
- `Resource` 끝의 `/*` 를 빼면 객체가 아니라 버킷을 가리켜서 전부 403 이 된다.
- `DIST_ID` 가 있어야 하므로 순서는 **CloudFront 생성 → 이 정책 적용**.

### (2) 버킷 정책 — 정적 웹호스팅(테스트)일 때만

`Principal: "*"` 이므로 **누구나 읽는다.** 이 경우에만 Block Public Access 를 끈다.
HTTPS(CloudFront)로 넘어가는 순간 이 정책은 지우고 (1) 로 갈아탄다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET/*"
    }
  ]
}
```

### (3) 배포 Role 의 권한 정책

`AWS_DEPLOY_ROLE_ARN` 에 붙인다. `scripts/deploy_web.sh` 가 하는 일에 딱 맞춘 최소권한이다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::BUCKET" },
    { "Effect": "Allow", "Action": ["s3:PutObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::BUCKET/*" },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DIST_ID"
    }
  ]
}
```

`ListBucket` 은 `aws s3 sync --delete` 가 버킷 내용을 비교하는 데, `DeleteObject` 는 이전 배포의
옛 해시 파일을 정리하는 데 쓴다.

### (4) 배포 Role 의 신뢰 정책 (GitHub OIDC)

우리 저장소의 `main` 브랜치에서만 이 Role 을 쓸 수 있게 한다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:IwanttobeaHokage/bootcamp2026-drug:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

⛔ `sub` 를 `repo:.../*` 로 느슨하게 두지 않는다. 포크나 임의 브랜치에서도 이 Role 을 가져다 쓸 수 있게 된다.

---

## 4-2. LLM 배포 (Bedrock + API Gateway)

```bash
scripts/deploy_llm.sh
```

[infra/llm/handler.py](../infra/llm/handler.py) 가 계약([LLM_CONTRACT.md](./LLM_CONTRACT.md)) 요청을 받아
Bedrock 의 Claude 를 부르고 계약 응답을 돌려줍니다. 스택 이름 기본값은 `bootcamp2026-llm`.

스크립트는 **엔드포인트와 API 키를 stdout 두 줄로만** 내보냅니다. `deploy_all.sh` 가 그걸 받아
백엔드의 `LLM_API_BASE_URL` / `LLM_API_KEY` 로 넘깁니다. **키를 사람이 복사해 옮길 일이 없습니다.**

### 로컬에서 배포할 때 (Windows)

CI(Linux)에서는 문제가 없지만 로컬 Windows 에서는 두 가지가 걸립니다.

| 증상 | 원인 | 해결 |
|---|---|---|
| `sam build` 가 `UnicodeDecodeError` 로 실패 | 저장소 경로에 한글이 있으면 SAM 이 pip 출력을 못 읽는다 | ASCII 경로로 복사해서 빌드하거나 저장소를 한글 없는 경로에 둔다 |
| `LLM_API_PATH` 에 `C:/Program` 이 들어감 | Git Bash(MSYS)가 `/analyze` 를 Windows 경로로 바꾼다 | 스크립트가 `MSYS2_ARG_CONV_EXCL` 로 막아 둠 (Linux 에는 영향 없음) |

`PYTHONUTF8=1` 을 켜면 pip 출력(한글 주석 포함)을 읽다 나는 `cp949` 오류도 사라집니다.

### 모델과 지연 시간

| 모델 (`ModelId`) | effort=low 응답 | API Gateway 29초 한도 |
|---|---|---|
| `global.anthropic.claude-sonnet-5` (기본값) | 약 14초 | 여유 있음 |
| `global.anthropic.claude-opus-5` | 24~26초 | 쿼터 상향(120초 승인) 덕에 사용 가능 |

- 모델 ID 는 반드시 **추론 프로파일**(`global.` 접두사)이어야 합니다. on-demand ID 는 Bedrock 이 거부합니다.
- 더 꼼꼼한 답이 필요하면 `LLM_EFFORT=medium|high`. 그만큼 느려집니다.
- Opus 5 로 바꾸려면 통합 타임아웃 한도부터 올려야 합니다 (아래).

### 타임아웃 체인

짧은 쪽이 먼저 끊습니다. 한 군데만 늘리면 소용없습니다.

```
프론트 fetch 70s  >  백엔드 Lambda 60s  >  백엔드 httpx(LLM_TIMEOUT_SECONDS) 45s  >  API Gateway 통합 29s
                                                                                      └ LLM Lambda 자체는 120s
```

API Gateway REST API 의 기본 통합 타임아웃 29초는 **서비스 쿼터** `L-E5AE38E3` 이고,
이 계정은 **120000ms 로 상향 승인**되어 있습니다. 그래도 백엔드 httpx(45초)보다 길게 잡으면
의미가 없으므로 템플릿 기본값은 40000ms 입니다. 더 늘리려면 체인 전체를 같이 올립니다.

```bash
aws service-quotas request-service-quota-increase --service-code apigateway --quota-code L-E5AE38E3 --desired-value 120000 --region ap-northeast-2
```

### API 키

API Gateway 가 `x-api-key` 헤더를 직접 검증합니다. 백엔드의
[http_provider.py](../backend/app/services/llm/http_provider.py) 가 이미 그 헤더를 보내므로 코드 수정이 없습니다.
사용량 계획으로 초당 5회 / 하루 2000회 제한이 걸려 있습니다.

---

## 5. 백엔드 배포 (Lambda)

FastAPI 를 고치지 않고 [backend/app/lambda_handler.py](../backend/app/lambda_handler.py) 가 Lambda 이벤트를 ASGI 로 번역합니다.
로컬 개발은 그대로 `uvicorn app.main:app --reload` 를 씁니다.

```bash
CORS_ORIGINS=https://d3trbdzir4jwzb.cloudfront.net scripts/deploy_api.sh
```

- SAM CLI 가 필요합니다 (CI 에는 `aws-actions/setup-sam` 이 깔아줍니다).
- 스택 이름 기본값은 `bootcamp2026-api`. `STACK_NAME` 으로 바꿉니다.
- 성공하면 **마지막 줄에 API 주소만** 출력합니다. 다른 스크립트가 그대로 받아 씁니다.
- Lambda 타임아웃은 40초 — `LLM_TIMEOUT_SECONDS`(기본 30) 보다 길어야 LLM 지연이 502 로 뭉개지지 않습니다.
- 로그 보존 14일. 건강정보는 애초에 로그에 남기지 않습니다 ([CLAUDE.md](../CLAUDE.md) 6절).

LLM 연결은 환경변수로만 바꿉니다. 주소를 아직 못 받았으면 `LLM_PROVIDER=mock` 그대로 배포해도 앱은 돕니다.

```bash
LLM_PROVIDER=http LLM_API_BASE_URL=https://... LLM_API_KEY=... CORS_ORIGINS=https://... scripts/deploy_api.sh
```

---

## 6. 한 번에 배포

```bash
WEB_BUCKET=bipa-final-bucket CLOUDFRONT_DISTRIBUTION_ID=E2ARG39AU2O8WS scripts/deploy_all.sh
```

[scripts/deploy_all.sh](../scripts/deploy_all.sh) 가 하는 일:

1. CloudFront 배포 ID → **프론트 도메인** 조회 (`CORS_ORIGINS` 를 따로 안 적어도 됨)
2. **LLM 스택 배포** → 엔드포인트와 API 키 회수 (`DEPLOY_LLM=no` 로 건너뛰면 백엔드가 mock 으로 뜸)
3. 그 값들과 도메인을 넣어 **백엔드 배포** → API 주소 회수
4. 그 API 주소를 `VITE_API_BASE_URL` 로 박아 **프론트 빌드 + S3 업로드 + 캐시 무효화**
5. `GET /health` 와 프론트 `/` 를 실제로 찔러보고 200 이 아니면 **실패로 끝냄**

3-4번 사이가 흔한 사고 지점입니다. 업로드는 성공했는데 화면이 403 이면 CloudFront 설정 문제이고,
스크립트가 그 사실을 배포 로그에서 바로 알려줍니다.

---

## 7. GitHub Actions 자동 배포

[.github/workflows/deploy.yml](../.github/workflows/deploy.yml) — **`main` 에 머지되면 자동 실행**됩니다. Actions 탭에서 수동 실행도 됩니다.

```
verify(용어 검사 · pytest · 프론트 빌드)  →  deploy(백엔드 → 프론트 → 확인)
```

검사가 실패하면 배포는 시작조차 하지 않습니다.

### 필요한 Secrets

| Secret | 내용 |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | GitHub OIDC 로 assume 할 IAM Role ARN |
| `WEB_BUCKET` | 프론트 버킷 이름 |
| `CLOUDFRONT_DISTRIBUTION_ID` | 배포 ID (여기서 프론트 도메인을 역으로 구합니다) |
| `SAM_ARTIFACT_BUCKET` | SAM 빌드 산출물을 둘 버킷. 비워두면 `--resolve-s3` 로 SAM 이 관리 버킷을 직접 만드는데, 그러면 배포 Role 에 관리 스택 생성 권한이 더 필요합니다 |


LLM 주소·키는 **시크릿이 아닙니다.** 배포 중에 LLM 스택 출력에서 읽어 백엔드로 넘깁니다.

Variables(선택): `DEPLOY_LLM`(기본 `yes`), `BEDROCK_MODEL_ID`, `LLM_EFFORT`.

### 배포 Role 에 추가로 필요한 권한

4-1 절 (3) 의 S3/CloudFront 권한에 더해, SAM 이 스택을 만들려면 아래가 필요합니다.

| 서비스 | 액션 |
|---|---|
| CloudFormation | `cloudformation:*` (스택 `bootcamp2026-api/*` 로 좁힐 것) |
| Lambda | `lambda:*` (함수 이름으로 좁힐 것) |
| IAM | `iam:CreateRole`, `iam:AttachRolePolicy`, `iam:PutRolePolicy`, `iam:PassRole`, `iam:GetRole`, `iam:DeleteRole`, `iam:DetachRolePolicy`, `iam:TagRole` |
| S3 (SAM 아티팩트) | `s3:ListBucket`, `s3:GetObject`, `s3:PutObject` on `SAM_ARTIFACT_BUCKET` |
| CloudWatch Logs | `logs:CreateLogGroup`, `logs:PutRetentionPolicy`, `logs:DescribeLogGroups`, `logs:DeleteLogGroup` |
| API Gateway (LLM 스택) | `apigateway:GET/POST/PUT/PATCH/DELETE` on `arn:aws:apigateway:<region>::/*` |

> `iam:*` 를 통째로 주지 마세요. 위 목록이면 SAM 이 Lambda 실행 역할을 만들고 지우는 데 충분합니다.

리소스는 이름으로 좁힙니다. 실제로 적용된 범위:

| 대상 | 리소스 패턴 |
|---|---|
| CloudFormation | `stack/bootcamp2026-api/*`, `stack/bootcamp2026-llm/*` (+ SAM 변환) |
| Lambda | `function:bootcamp2026-*` |
| IAM (Lambda 실행 역할) | `role/bootcamp2026-*` |
| CloudWatch Logs | `log-group:/aws/lambda/bootcamp2026-*` |

스택 이름(`STACK_NAME`)을 바꾸면 이 패턴들도 같이 바꿔야 합니다.

---

## 8. (참고) 프론트만 수동 배포

백엔드는 그대로 두고 프론트만 다시 올릴 때는 3절의 `scripts/deploy_web.sh` 를 직접 씁니다.
이때 `API_BASE_URL` 은 현재 배포된 백엔드 주소여야 합니다:

```bash
aws cloudformation describe-stacks --stack-name bootcamp2026-api --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text
```

(참고용 secrets 목록)

| Secret | 내용 |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | GitHub OIDC 로 assume 할 IAM Role ARN |
| `WEB_BUCKET` | 버킷 이름 |
| `API_BASE_URL` | 배포된 백엔드 주소 |
| `CLOUDFRONT_DISTRIBUTION_ID` | (선택) 없으면 무효화를 건너뜀 |

⛔ AWS 액세스 키를 저장소나 `.env` 에 넣지 않습니다. OIDC Role 을 씁니다.
