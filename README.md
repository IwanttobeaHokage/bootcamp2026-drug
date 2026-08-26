# bootcamp2026-drug

복용 중인 약과 나이·성별·체중·복용량을 입력하면, LLM이
**추천 영양소 조합 / 주의점 / 복용시기**를 정리해 주는 서비스.

> ⚠️ 본 서비스는 의료 행위가 아니며 진단·처방을 대체하지 않습니다.

---

## 🚨 코드 짜기 전에 반드시 읽을 것

### 👉 [docs/GLOSSARY.md](./docs/GLOSSARY.md)

변수·함수·API·DB 이름을 짓기 전에 **먼저 용어 사전에서 표준 용어를 찾으세요.**
사전에 없는 개념이면 **코드보다 문서를 먼저 고칩니다.**

```
용어 검색 → 있으면 그대로 사용
          → 없으면 GLOSSARY.md 에 추가하는 PR 먼저 → 머지 후 코드 작성
```

이 규칙 하나로 `drug` / `medicine` / `pill` / `medi` 가 섞이는 사고를 막습니다.

---

## 문서

| 문서 | 내용 |
|---|---|
| [docs/GLOSSARY.md](./docs/GLOSSARY.md) | ⭐ 용어 사전 + 네이밍 규칙 + 금지어 |
| [docs/TECH_SPEC.md](./docs/TECH_SPEC.md) | 스택, 폴더 구조, 데이터 흐름, 안전 규칙 |
| [docs/API.md](./docs/API.md) | 엔드포인트 요청/응답 예시 |

## 폴더 구조

```
bootcamp2026-drug/
├─ docs/        문서 (용어 사전이 여기)
├─ backend/     FastAPI + Anthropic Claude
└─ frontend/    React + Vite + TypeScript
```

## 실행

### 1. 백엔드

```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env    # ANTHROPIC_API_KEY 채우기
uvicorn app.main:app --reload
```

→ http://localhost:8000/docs

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
2. API JSON은 `snake_case`, 프론트 내부는 `camelCase`. 변환은 `src/api/case.ts` 에서만.
3. 응답의 `disclaimer` 는 절대 제거하거나 숨기지 않는다.
4. 사용자 건강 정보는 저장하지 않고 로그에도 남기지 않는다.
5. `.env` 는 커밋하지 않는다.
