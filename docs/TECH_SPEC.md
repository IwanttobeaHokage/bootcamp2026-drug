# 🧱 TECH SPEC — bootcamp2026-drug

> 읽는 순서: [GLOSSARY.md](./GLOSSARY.md) → 이 문서 → [API.md](./API.md)

## 1. 제품 한 줄 정의

사용자가 **복용 중인 약 + 체중 + 나이 + 성별 + 복용량**을 입력하면,
LLM이 **① 추천 영양소 조합 ② 주의점 ③ 복용시기**를 구조화된 형태로 돌려주는 서비스.

## 2. 기술 스택

| 레이어 | 선택 | 이유 |
|---|---|---|
| 프론트엔드 | React 18 + Vite + TypeScript | 부트캠프 표준, 타입으로 용어 강제 가능 |
| 상태/폼 | React Hook Form + Zod | 스키마 = 용어 검증 지점 |
| 백엔드 | Python 3.11 + FastAPI + Pydantic | Pydantic 모델이 곧 API 스펙 |
| LLM | Anthropic Claude (`claude-sonnet-5`) | tool use로 JSON 출력 강제 |
| 검증 | pytest / vitest | |
| 포맷터 | ruff (py), prettier + eslint (ts) | |

## 3. 폴더 구조

```
bootcamp2026-drug/
├─ docs/
│  ├─ GLOSSARY.md      ← ⭐ 코드 짜기 전 필독. 용어/네이밍 단일 출처
│  ├─ TECH_SPEC.md     ← 이 문서
│  └─ API.md           ← 엔드포인트 계약
├─ backend/
│  ├─ app/
│  │  ├─ main.py            FastAPI 앱 진입점
│  │  ├─ core/config.py     환경변수 (UPPER_SNAKE_CASE)
│  │  ├─ api/routes/        엔드포인트. 파일 1개 = 리소스 1개
│  │  ├─ schemas/           Pydantic 모델 = API 계약
│  │  ├─ services/          LLM 호출, 프롬프트 생성 등 비즈니스 로직
│  │  └─ data/              영양소·상호작용 참고 데이터(JSON)
│  └─ tests/
└─ frontend/
   └─ src/
      ├─ types/         GLOSSARY 기반 TS 타입 (camelCase)
      ├─ api/           fetch + snake_case ↔ camelCase 변환 계층
      ├─ components/    재사용 UI
      ├─ pages/         화면 단위
      └─ hooks/         상태 로직
```

### 추천 폴더 (필요해지면 추가)

| 폴더 | 언제 필요한가 |
|---|---|
| `backend/app/repositories/` | DB 붙일 때. 쿼리를 서비스에서 분리 |
| `backend/app/prompts/` | 프롬프트가 3개 이상으로 늘어날 때 `.md`로 분리 |
| `backend/alembic/` | DB 스키마 마이그레이션 |
| `frontend/src/lib/` | 순수 유틸 함수 (날짜, 단위 변환) |
| `frontend/src/styles/` | 전역 CSS / 테마 토큰 |
| `.github/workflows/` | CI (lint + test 자동 실행) |
| `scripts/` | 시드 데이터 생성, 일회성 스크립트 |
| `docker/` | 팀원 환경이 갈릴 때 compose로 통일 |

> 폴더를 미리 다 만들지 마세요. **빈 폴더는 노이즈입니다.** 필요할 때 추가.

## 4. 데이터 흐름

```
[입력 폼]  MedicationForm.tsx
    │  userProfile + medications (camelCase)
    ▼
[변환]     src/api/client.ts   camelCase → snake_case
    ▼
POST /api/v1/analyses
    ▼
[검증]     schemas/analysis.py  AnalysisRequest (Pydantic)
    ▼
[프롬프트] services/prompt_builder.py  build_prompt()
    ▼
[LLM]      services/llm_client.py  tool use로 JSON 출력 강제
    ▼
[검증]     AnalysisResult 로 파싱 (스키마 불일치 시 재시도)
    ▼
응답 (snake_case) → 변환 → ResultPage.tsx
```

## 5. LLM 출력 계약

LLM에게 자유 텍스트를 받지 않습니다. **tool use(`report_analysis`)로 JSON 출력을 강제**하고,
그 스키마는 `schemas/analysis.py`의 `AnalysisResult`와 **필드명이 1:1로 같아야** 합니다.

즉 새 필드를 추가하려면
`GLOSSARY.md` → `AnalysisResult` → tool input_schema → `frontend/src/types` **4곳이 함께** 바뀝니다.
하나라도 빠지면 PR 반려.

## 6. 환경 변수

| 이름 | 예시 | 설명 |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | ⛔ 절대 커밋 금지 |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | 모델 ID |
| `CORS_ORIGINS` | `http://localhost:5173` | 프론트 오리진 |
| `VITE_API_BASE_URL` | `http://localhost:8000` | 프론트에서 쓰는 백엔드 주소 |

`.env`는 `.gitignore`에 있습니다. `.env.example`만 커밋합니다.

## 7. 안전 규칙 (의료 도메인)

1. 모든 응답에 `disclaimer` 필수 (GLOSSARY §6).
2. LLM이 **용량을 새로 처방하는 문장**을 만들지 않도록 시스템 프롬프트에서 금지.
3. `risk_level: high`인 주의점은 프론트에서 **접히지 않는 강조 UI**로 표시.
4. 개인정보(나이·체중·복용약)는 **서버에 저장하지 않습니다.** 요청 처리 후 폐기.
   로그에도 남기지 않습니다 (`request_id`만 기록).
