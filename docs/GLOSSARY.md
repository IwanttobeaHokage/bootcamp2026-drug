# 📖 GLOSSARY — 용어 사전 (Single Source of Truth)

> **이 문서는 코드보다 먼저 읽습니다.**
> 변수/함수/타입/API/DB 컬럼 이름을 짓기 전에 **반드시 이 표에서 표준 용어를 찾습니다.**
> 표에 없으면 → 코드부터 짜지 말고 **먼저 이 문서에 용어를 추가**하고 PR을 올립니다.

---

## 0. 왜 이 문서가 필요한가

같은 개념을 사람마다 다르게 부르면 코드가 꼬입니다.

```
A: drug_name      B: medicineName    C: pill        D: medi
A: dosage         B: dose_amount     C: amount      D: qty
```

→ API 붙일 때 매핑 지옥, 리팩터링 불가, 리뷰 시간 3배.
**용어 1개 = 이름 1개.** 이게 이 저장소의 첫 번째 규칙입니다.

---

## 1. 작업 순서 (모든 팀원 공통)

```
1) 기능 티켓 확인
2) docs/GLOSSARY.md 에서 쓸 용어 검색  ← 여기가 시작점
3-a) 용어가 있다  → 표에 적힌 표기 그대로 코드 작성
3-b) 용어가 없다  → §5 절차대로 용어 추가 PR → 머지 후 코드 작성
4) PR 올릴 때 "새 용어 추가 여부" 체크박스 체크
```

> ⛔ **금지:** "일단 코드부터 짜고 이름은 나중에 통일하자."
> 나중은 오지 않습니다. 이름이 꼬인 채 머지되면 되돌리는 비용이 훨씬 큽니다.

---

## 2. 표기 규칙 (Casing Rules)

| 레이어 | 표기법 | 예시 |
|---|---|---|
| 백엔드 Python 변수/함수 | `snake_case` | `dose_amount`, `build_prompt()` |
| 백엔드 Python 클래스 | `PascalCase` | `AnalysisRequest` |
| 프론트엔드 TS 변수/함수 | `camelCase` | `doseAmount`, `fetchAnalysis()` |
| 프론트엔드 TS 타입/컴포넌트 | `PascalCase` | `AnalysisResult`, `MedicationForm` |
| API JSON 필드 | `snake_case` | `"dose_amount": 500` |
| API 경로 | `kebab-case` + 복수형 | `/api/v1/analyses` |
| DB 테이블/컬럼 | `snake_case` | `medication_intake.dose_amount` |
| 환경변수 | `UPPER_SNAKE_CASE` | `ANTHROPIC_API_KEY` |
| 파일명 (py) | `snake_case.py` | `prompt_builder.py` |
| 파일명 (tsx) | `PascalCase.tsx` | `MedicationForm.tsx` |
| Enum 값 (JSON) | `snake_case` 소문자 | `"after_meal"` |

**API JSON은 `snake_case`로 통일합니다.** 프론트에서는 `src/api/client.ts`의 변환 계층에서만
`camelCase`로 바꿉니다. 컴포넌트 안에서 `snake_case`가 보이면 잘못된 코드입니다.

---

## 3. 표준 용어 사전

### 3-1. 사용자 입력 (User Input)

> **주체는 영양제(supplement)다.** 약(medication)은 "이 영양제가 그 약이랑 부딪히나?"를
> 확인하기 위한 **선택 입력**이다. 둘을 섞어 부르지 않는다.

| 한국어 | 표준 영문 | Python / API (`snake_case`) | TS (`camelCase`) | 타입 | 설명 |
|---|---|---|---|---|---|
| 사용자 프로필 | user profile | `user_profile` | `userProfile` | object | 나이·성별·체중 묶음 |
| 나이 | age | `age` | `age` | int (0–120) | 만 나이 |
| 성별 | sex | `sex` | `sex` | enum | `male` \| `female` \| `other` — ⚠️ `gender` 쓰지 않음 |
| 체중 | weight | `weight_kg` | `weightKg` | float (kg) | 단위를 이름에 포함 |
| 키 | height | `height_cm` | `heightCm` | float (cm) | 선택 입력 |
| **영양제** | **supplement** | `supplement` | `supplement` | object | ⭐ 사용자가 먹는 영양제 1건 |
| 영양제 목록 | supplements | `supplements` | `supplements` | array | **필수**, 1개 이상 |
| 영양제 이름 | supplement name | `supplement_name` | `supplementName` | str | 제품명 또는 성분명 |
| 함유 영양소 | nutrient | `nutrient` | `nutrient` | str | 예: 비타민 D |
| 섭취량(1회) | dose amount | `dose_amount` | `doseAmount` | float | 숫자만 |
| 섭취 단위 | dose unit | `dose_unit` | `doseUnit` | enum | §4-2 |
| 섭취 횟수 | dose frequency | `dose_frequency` | `doseFrequency` | int | 1일 기준 |
| 섭취 시각 | intake time | `intake_time` | `intakeTime` | enum | §4-3 |
| 복용 중인 약 | medication | `medication` | `medication` | object | **선택 입력**. 상호작용 확인용 |
| 약 목록 | medications | `medications` | `medications` | array | 비어 있어도 됨 (기본 `[]`) |
| 약 이름 | medication name | `medication_name` | `medicationName` | str | |
| 약 성분 | ingredient | `ingredient` | `ingredient` | str | 선택 |

### 3-2. 분석 결과 (Analysis Output)

| 한국어 | 표준 영문 | Python / API | TS | 타입 | 설명 |
|---|---|---|---|---|---|
| 분석 요청 | analysis request | `analysis_request` | `analysisRequest` | object | 입력 전체 |
| 분석 본문 | analysis body | `analysis_body` | — | object | LLM이 돌려주는 3개 필드 |
| 분석 결과 | analysis result | `analysis_result` | `analysisResult` | object | 본문 + `request_id` + `disclaimer` |
| 영양소 조합 | nutrient stack | `nutrient_stack` | `nutrientStack` | array | ⚠️ `combo`, `combination` 쓰지 않음 |
| 권장 섭취량 | recommended dose | `recommended_dose` | `recommendedDose` | str | 예: `"1000IU / 1일 1회"` |
| **추천 유형** | nutrient category | `nutrient_category` | `nutrientCategory` | enum | ⭐ 부족/시너지/유지/감량. §4-6 |
| 추천 사유 | rationale | `rationale` | `rationale` | str | |
| 주의점 | caution | `caution` | `caution` | object | ⚠️ `warning`, `notice` 쓰지 않음 |
| 주의점 목록 | cautions | `cautions` | `cautions` | array | |
| **상호작용 유형** | interaction type | `interaction_type` | `interactionType` | enum | ⭐ 무엇과 무엇이 부딪히는지. §4-5 |
| 문제되는 영양제 | related supplement | `related_supplement` | `relatedSupplement` | str? | 주의점의 원인 영양제 |
| 부딪히는 약 | related medication | `related_medication` | `relatedMedication` | str? | 상대 약 이름 |
| 위험도 | risk level | `risk_level` | `riskLevel` | enum | `low` \| `moderate` \| `high` |
| 섭취 시기 | intake timing | `intake_timing` | `intakeTiming` | enum | ⚠️ `schedule` 단독 사용 금지 |
| 섭취 일정 | intake schedule | `intake_schedule` | `intakeSchedule` | array | 하루 타임라인 |
| 시간대 | time slot | `time_slot` | `timeSlot` | enum | §4-3 |
| 간격 두기 | spacing | `spacing_hours` | `spacingHours` | int? | 약과 몇 시간 띄울지 |
| **같이 먹지 말 것** | avoid with | `avoid_with` | `avoidWith` | array | ⭐ 이 시간대에 함께 섭취를 피할 영양제·약 이름 |
| 근거 | evidence | `evidence` | `evidence` | str? | |
| 면책 문구 | disclaimer | `disclaimer` | `disclaimer` | str | §6 |
| 요청 ID | request id | `request_id` | `requestId` | str | 로그 추적용 |

### 3-3. 시스템/기술 용어

| 한국어 | 표준 영문 | 코드 표기 | 설명 |
|---|---|---|---|
| LLM 연결기 | llm provider | `llm_provider` / `LlmProvider` | 외부 LLM 호출 방식의 공통 인터페이스 |
| 연결 방식 | provider kind | `LLM_PROVIDER` | `mock` \| `http` \| `lambda` |
| 목 응답 | mock provider | `MockProvider` | AWS 없이 개발할 때 쓰는 고정 응답 |
| 분석 서비스 | analysis service | `run_analysis()` | 라우터와 LLM 사이. 응답 검증 담당 |

---

## 4. 표준 Enum 값

Enum 값은 **여기 적힌 문자열만** 씁니다. 새 값이 필요하면 §5 절차.

### 4-1. `sex`
`male` | `female` | `other`

### 4-2. `dose_unit`
`mg` | `g` | `mcg` | `ml` | `iu` | `tablet` | `capsule` | `softgel` | `scoop` | `drop`

### 4-3. `time_slot` / `intake_time` / `intake_timing`
`morning` | `noon` | `evening` | `bedtime`
`before_meal` | `with_meal` | `after_meal` | `empty_stomach`

### 4-4. `risk_level`
`low` | `moderate` | `high`

### 4-5. `interaction_type`

| 값 | 의미 |
|---|---|
| `supplement_medication` | ⭐ 영양제 x 약 — 이 서비스의 핵심 경고 |
| `supplement_supplement` | 영양제 x 영양제 |
| `supplement_food` | 영양제 x 음식 (공복/식후 등) |
| `dose_limit` | 상한 섭취량 초과 |
| `condition` | 나이·성별·체중 관련 주의 |

### 4-6. `nutrient_category`

영양소를 **왜** 추천하는지 구분한다.

| 값 | 의미 |
|---|---|
| `deficient` | 지금 부족해 보여서 보충이 필요함 |
| `synergy` | 이미 먹는 것과 **같이 먹으면 좋음** |
| `maintain` | 현재 섭취량이 적절함. 유지 권장 |
| `reduce` | 과다하므로 줄이는 것을 고려 |

---

## 5. 새 용어 추가 절차

새 개념이 필요할 때 (예: "알레르기 이력"을 받고 싶다):

1. **검색** — 이 문서에서 비슷한 용어가 이미 있는지 Ctrl+F. (`allergy`? `history`?)
2. **브랜치** — `git switch -c glossary/add-allergy-history`
3. **표에 한 줄 추가** — 한국어 / 표준 영문 / snake_case / camelCase / 타입 / 설명 6칸 전부 채우기.
   - 동의어가 있으면 §7 금지어 표에도 추가 (`⚠️ 쓰지 않음` 표기).
4. **PR 제목** — `docs(glossary): add allergy_history`
5. **리뷰어 1명 승인 후 머지**
6. **머지된 다음에** 그 이름으로 코드 작성.

> 급할 땐? PR 올리고 슬랙에 공유 → 승인 기다리는 동안 그 이름으로 코드 작성해도 됩니다.
> 단 **문서 PR이 코드 PR보다 먼저 머지**되어야 합니다.

---

## 6. 면책 문구 (필수)

이 서비스는 **의료 행위가 아니며 진단·처방을 대체하지 않습니다.**
모든 분석 결과 응답에는 아래 문구가 `disclaimer` 필드로 항상 포함되어야 합니다.

```
본 정보는 일반적인 참고용이며 의학적 진단·처방을 대체하지 않습니다.
복용 중인 약이 있다면 반드시 의사 또는 약사와 상담하세요.
```

프론트엔드는 이 문구를 **결과 화면에서 접거나 숨기지 않습니다.**

---

## 7. 금지어 → 표준어 매핑

| ❌ 쓰지 말 것 | ✅ 표준 용어 |
|---|---|
| `vitamin`, `pill`, `nutra`, `supple` | `supplement` (영양제) |
| `drug`, `medicine`, `medi` | `medication` (약) |
| 영양제를 `medication` 이라 부르는 것 | 영양제는 `supplement`. 둘은 다른 개념 |
| `dosage`, `amount`, `qty` | `dose_amount` |
| `gender` | `sex` |
| `weight` (단위 없음) | `weight_kg` |
| `combo`, `combination`, `mix` | `nutrient_stack` |
| `warning`, `notice`, `alert` | `caution` |
| `conflict`, `clash` | `interaction_type` |
| `schedule`(단독), `timing`(단독) | `intake_timing` / `intake_schedule` |
| `result`(단독), `res`, `data` | `analysis_result` |
| `user_info`, `profile_data` | `user_profile` |
| `llm`, `ai`, `gpt` (변수명으로) | `llm_provider` |

> 리뷰어가 눈으로 잡기 전에 **CI 가 먼저 막습니다.**
>
> ```bash
> python scripts/check_glossary.py   # 로컬에서 미리 확인
> ```
>
> 금지어가 코드에 있으면 `glossary` 검사가 실패하고 머지가 막힙니다.
> 정말 예외가 필요한 줄에는 끝에 `glossary-ok` 주석을 답니다.
>
> AI 도구(Claude Code, Copilot, Cursor)는 저장소 루트의 `CLAUDE.md` /
> `AGENTS.md` / `.github/copilot-instructions.md` 를 자동으로 읽으므로,
> 따로 알려주지 않아도 이 규칙을 따릅니다.
