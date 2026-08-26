# bootcamp2026-drug

먹고 있는 **영양제**와 나이·성별·체중·섭취량을 입력하면, LLM이
**추천 영양소 조합 / 주의점 / 섭취 시기**를 정리해 주는 서비스.

**복용 중인 약을 함께 입력하면**, 그 약과 부딪히는 영양제가 있는지
상호작용 주의점을 우선순위로 알려줍니다. (예: 비타민 D ↔ 와파린)

> ⚠️ 본 서비스는 의료 행위가 아니며 진단·처방을 대체하지 않습니다.
> 복용 중인 약이 있다면 반드시 의사 또는 약사와 상담하세요.

---

## 🚨 코드 짜기 전에 반드시 읽을 것

### 👉 [docs/GLOSSARY.md](./docs/GLOSSARY.md)

변수·함수·API·DB 이름을 짓기 전에 **먼저 용어 사전에서 표준 용어를 찾으세요.**
사전에 없는 개념이면 **코드보다 문서를 먼저 고칩니다.**

```
용어 검색 → 있으면 그대로 사용
          → 없으면 GLOSSARY.md 에 추가하는 PR 먼저 → 머지 후 코드 작성
```

특히 이 프로젝트는 **영양제(`supplement`)와 약(`medication`)이 다른 개념**입니다.
섞어 쓰면 상호작용 로직이 통째로 꼬입니다.

### 이 규칙은 기계가 강제합니다

| 장치 | 하는 일 |
|---|---|
| `CLAUDE.md` / `AGENTS.md` / `.github/copilot-instructions.md` | Claude Code·Copilot·Cursor 가 **자동으로 읽습니다.** 따로 말 안 해도 AI 가 용어 규칙을 따릅니다 |
| CI 의 `glossary` 검사 | 금지어가 코드에 있거나 파일 위치가 틀리면 **빌드 실패**. 머지가 막힙니다 |
| `extra="forbid"` (Pydantic) | 사전에 없는 필드명으로 API 요청이 오면 **422 로 거부** |

올리기 전에 로컬에서 미리 확인:

```bash
python scripts/check_glossary.py
```

---

## 문서

| 문서 | 내용 |
|---|---|
| [docs/GLOSSARY.md](./docs/GLOSSARY.md) | ⭐ 용어 사전 + 네이밍 규칙 + 금지어 |
| [docs/TECH_SPEC.md](./docs/TECH_SPEC.md) | 스택, 폴더 구조, 데이터 흐름, 안전 규칙 |
| [docs/API.md](./docs/API.md) | 우리 백엔드 엔드포인트 |
| [docs/LLM_CONTRACT.md](./docs/LLM_CONTRACT.md) | 🔌 **AWS 담당자용** — Lambda/API 가 지켜야 할 입출력 계약 |

---

## LLM 은 외부(AWS)에 있습니다

이 저장소에는 **LLM 호출 코드가 없습니다.** 대신 갈아 끼울 수 있는 자리만 있습니다.

```
LLM_PROVIDER=mock    ← 기본값. AWS 없이도 앱이 돌아감 (고정 응답)
LLM_PROVIDER=http    ← API Gateway / Lambda Function URL
LLM_PROVIDER=lambda  ← boto3 로 Lambda 직접 invoke
```

`backend/.env` 에서 **한 줄만 바꾸면** 연결됩니다. 코드 수정 없습니다.
AWS 담당자는 [docs/LLM_CONTRACT.md](./docs/LLM_CONTRACT.md) 만 보면 됩니다.

---

## 폴더 구조

```
bootcamp2026-drug/
├─ docs/        문서 (용어 사전 + LLM 계약서)
├─ backend/     FastAPI — 검증 / 라우팅 / LLM 연결 (LLM 자체는 없음)
│  └─ app/services/llm/   ← AWS 를 꽂는 자리
└─ frontend/    React + Vite + TypeScript
```

## 실행

### 1. 백엔드

```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

→ http://localhost:8000/docs (`.env` 그대로 두면 mock 으로 동작)

### 2. 프론트엔드

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

→ http://localhost:5173

### 3. 테스트

```bash
cd backend && pytest
```

## 팀 규칙 요약

1. `docs/GLOSSARY.md` 먼저 확인 — 용어 없으면 추가 PR 먼저.
2. **영양제 = `supplement`, 약 = `medication`.** 절대 섞지 않는다.
3. API JSON은 `snake_case`, 프론트 내부는 `camelCase`. 변환은 `src/api/case.ts` 에서만.
4. 응답의 `disclaimer` 는 절대 제거하거나 숨기지 않는다.
5. 사용자 건강 정보는 저장하지 않고 로그에도 남기지 않는다.
6. `.env` 와 AWS 키는 커밋하지 않는다.
