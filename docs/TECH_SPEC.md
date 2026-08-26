# 🧱 TECH SPEC — bootcamp2026-drug

> 읽는 순서: [GLOSSARY.md](./GLOSSARY.md) → 이 문서 → [API.md](./API.md) → [LLM_CONTRACT.md](./LLM_CONTRACT.md)

## 1. 제품 한 줄 정의

사용자가 **먹고 있는 영양제 + 나이·성별·체중·섭취량**을 입력하면
**① 추천 영양소 조합 ② 주의점 ③ 섭취 시기**를 돌려주는 서비스.

**복용 중인 약을 선택 입력**하면, 그 약과 부딪히는 영양제를
`interaction_type: supplement_medication` 주의점으로 최우선 표시한다.

## 2. 기술 스택

| 레이어 | 선택 | 이유 |
|---|---|---|
| 프론트엔드 | React 18 + Vite + TypeScript | 부트캠프 표준, 타입으로 용어 강제 |
| 백엔드 | Python 3.11 + FastAPI + Pydantic | Pydantic 모델이 곧 API 스펙 |
| **LLM** | **외부 AWS (Lambda / API Gateway)** | 다른 팀원이 담당. 이 저장소에 모델 호출 코드 없음 |
| 검증 | pytest | |

## 3. 폴더 구조

```
bootcamp2026-drug/
├─ docs/
│  ├─ GLOSSARY.md      ← ⭐ 코드 짜기 전 필독. 용어/네이밍 단일 출처
│  ├─ TECH_SPEC.md     ← 이 문서
│  ├─ API.md           ← 프론트 ↔ 백 계약
│  └─ LLM_CONTRACT.md  ← 🔌 백 ↔ AWS 계약 (담당자에게 이것만 주면 됨)
├─ backend/
│  ├─ app/
│  │  ├─ main.py                 FastAPI 진입점
│  │  ├─ core/config.py          환경변수 (AWS 빈 칸이 여기)
│  │  ├─ api/routes/analysis.py  엔드포인트
│  │  ├─ schemas/analysis.py     Pydantic 모델 = API 계약
│  │  └─ services/
│  │     ├─ analysis_service.py  라우터 ↔ LLM 사이. 응답 검증
│  │     ├─ prompt_builder.py    AWS 담당자용 권장 프롬프트
│  │     └─ llm/                 ⭐ AWS 를 꽂는 자리
│  │        ├─ base.py             LlmProvider 인터페이스
│  │        ├─ factory.py          LLM_PROVIDER 로 구현체 선택
│  │        ├─ mock_provider.py    AWS 없이 개발용 고정 응답
│  │        ├─ http_provider.py    API Gateway / Function URL
│  │        └─ lambda_provider.py  boto3 invoke
│  └─ tests/
└─ frontend/
   └─ src/
      ├─ types/analysis.ts   GLOSSARY 기반 TS 타입 (camelCase)
      ├─ api/                fetch + snake_case ↔ camelCase 변환
      ├─ components/         SupplementForm, AnalysisResultView
      └─ pages/              AnalysisPage
```

### 추천 폴더 (필요해지면 추가)

| 폴더 | 언제 필요한가 |
|---|---|
| `backend/app/repositories/` | DB 붙일 때 |
| `frontend/src/lib/` | 순수 유틸 함수 (단위 변환 등) |
| `frontend/src/styles/` | 전역 CSS / 테마 |
| `frontend/src/hooks/` | 상태 로직이 컴포넌트에서 넘칠 때 |
| `scripts/` | 시드 데이터, 일회성 스크립트 |
| `infra/` | AWS 담당자가 IaC(SAM/CDK)를 이 저장소에 둘 경우 |

> 빈 폴더는 만들지 않습니다. git 이 추적하지도 않고 노이즈만 됩니다.

## 4. 데이터 흐름

```
[입력 폼]  SupplementForm.tsx     supplements + medications(선택) (camelCase)
    ▼
[변환]     src/api/case.ts        camelCase → snake_case
    ▼
POST /api/v1/analyses
    ▼
[검증]     schemas/analysis.py    AnalysisRequest — 모르는 필드면 422
    ▼
[서비스]   analysis_service.py    run_analysis()
    ▼
[연결]     services/llm/factory   LLM_PROVIDER 로 분기
    ├─ mock   → 고정 응답 (AWS 없이 개발)
    ├─ http   → API Gateway / Lambda Function URL   ← 🔌 빈 칸
    └─ lambda → boto3 invoke                        ← 🔌 빈 칸
    ▼
[검증]     AnalysisBody 로 파싱   계약과 다르면 502
    ▼
+ request_id, disclaimer → 응답 → 변환 → AnalysisResultView.tsx
```

## 5. LLM 을 갈아 끼우는 법

`backend/.env` **한 줄만** 바꿉니다. 코드는 건드리지 않습니다.

```bash
LLM_PROVIDER=mock     # 기본값. AWS 아직 없을 때
LLM_PROVIDER=http     # + LLM_API_BASE_URL
LLM_PROVIDER=lambda   # + LAMBDA_FUNCTION_NAME, AWS_REGION
```

새 연결 방식(Bedrock 직접 호출 등)이 필요하면
`services/llm/` 에 파일 하나 추가 + `factory.py` 에 분기 한 줄. 라우터는 안 바뀝니다.

## 6. 환경 변수

| 이름 | 기본값 | 설명 |
|---|---|---|
| `LLM_PROVIDER` | `mock` | `mock` \| `http` \| `lambda` |
| `LLM_TIMEOUT_SECONDS` | `30` | 외부 호출 타임아웃 |
| `LLM_API_BASE_URL` | (빈 칸) | 🔌 API Gateway 주소 |
| `LLM_API_PATH` | `/analyze` | 🔌 엔드포인트 경로 |
| `LLM_API_KEY` | (빈 칸) | 🔌 `x-api-key`. 없으면 비움 |
| `AWS_REGION` | `ap-northeast-2` | 🔌 Lambda 리전 |
| `LAMBDA_FUNCTION_NAME` | (빈 칸) | 🔌 Lambda 함수명 |
| `CORS_ORIGINS` | `http://localhost:5173` | 프론트 오리진 |
| `VITE_API_BASE_URL` | `http://localhost:8000` | 프론트가 부를 백엔드 |

⛔ **AWS 액세스 키는 `.env` 에 적지 않습니다.** `aws configure` 또는 IAM Role 사용.

## 7. 프론트엔드 경로 별칭 (중요)

`@/` 는 `frontend/src/` 를 가리킵니다. **두 파일이 짝**입니다:

- `tsconfig.json` → `paths: { "@/*": ["src/*"] }`  (타입 검사용)
- `vite.config.ts` → `resolve.alias: { "@": .../src }` (번들러용)

**한쪽만 바꾸면 `tsc` 는 통과하는데 `vite build` 가 깨집니다.** 반드시 같이 수정.

## 8. 안전 규칙 (의료 도메인)

1. 모든 응답에 `disclaimer` 필수 (GLOSSARY §6). 프론트에서 숨기지 않는다.
2. LLM 이 약 용량을 바꾸라고 지시하지 않도록 시스템 프롬프트에서 금지.
3. `interaction_type: supplement_medication` 주의점은 **맨 위에 강조** 표시.
4. `risk_level: high` 는 접히지 않는 UI.
5. 건강 정보(나이·체중·영양제·약)는 **저장하지 않는다.** 로그에도 남기지 않는다 (`request_id` 만).
