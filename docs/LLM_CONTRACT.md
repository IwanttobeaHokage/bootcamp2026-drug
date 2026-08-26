# 🔌 LLM_CONTRACT — AWS 담당자에게 주는 명세

> **읽는 사람:** Lambda / API Gateway 에 LLM 을 올릴 담당자
> **한 줄 요약:** 아래 JSON 을 받아서 아래 JSON 을 돌려주면 됩니다. 그 외에는 자유입니다.

우리 백엔드는 LLM 을 **직접 호출하지 않습니다.** 이 계약만 지키면
모델이 Claude든 GPT든, Bedrock이든 상관하지 않습니다.

> ✅ **이 계약의 구현이 이제 저장소 안에 있습니다.** [`infra/llm/`](../infra/llm/) —
> Bedrock(Claude) 을 API Gateway REST API 뒤에 두는 Lambda 입니다.
> 배포는 `scripts/deploy_llm.sh`, 자세한 건 [DEPLOY.md](./DEPLOY.md).
> 다른 구현으로 갈아끼워도 됩니다. 백엔드는 주소와 키만 봅니다.

---

## 1. 우리가 보내는 것 (Request)

`Content-Type: application/json`, POST

```json
{
  "user_profile": {
    "age": 30,
    "sex": "female",
    "weight_kg": 55.0,
    "height_cm": null
  },
  "supplements": [
    {
      "supplement_name": "비타민 D 1000IU",
      "nutrient": "비타민 D",
      "dose_amount": 1000,
      "dose_unit": "iu",
      "dose_frequency": 2,
      "intake_times": ["morning_after_meal", "evening_after_meal"]
    }
  ],
  "medications": [
    { "medication_name": "와파린", "ingredient": null,
      "dose_amount": null, "dose_unit": null,
      "dose_frequency": null, "intake_times": [] }
  ]
}
```

- `supplements` 는 **항상 1개 이상** 옵니다.
- `intake_times` 의 **개수는 `dose_frequency` 와 같습니다.** 1일 2회면 시각도 2개입니다.
  일정(`intake_schedule`)은 이 시각들을 모두 반영해 주세요.
- 단위가 `hundred_million_cfu`(억 CFU) / `cfu` / `sachet`(포) 이면 유산균류입니다.
  권장량도 무게가 아니라 균 수로 적어 주세요.
- `medications` 는 **비어 있을 수 있습니다** (`[]`). 비어 있으면 영양제끼리만 분석.
- Enum 값은 [GLOSSARY.md §4](./GLOSSARY.md#4-표준-enum-값) 에 정의된 문자열만 옵니다.

---

## 2. 돌려줘야 하는 것 (Response)

**HTTP 200 + 아래 3개 키를 가진 JSON.** 그 외 키는 무시됩니다.
`request_id` 와 `disclaimer` 는 **우리 서버가 채우므로 넣지 않아도 됩니다.**

```json
{
  "nutrient_stack": [
    {
      "nutrient": "비타민 D",
      "nutrient_category": "maintain",
      "recommended_dose": "1000IU / 1일 1회",
      "rationale": "현재 섭취량은 일반적인 유지 용량 범위입니다.",
      "evidence": null
    }
  ],
  "cautions": [
    {
      "caution": "비타민 D 와 와파린을 함께 복용하면 항응고 효과에 영향을 줄 수 있습니다.",
      "interaction_type": "supplement_medication",
      "related_supplement": "비타민 D 1000IU",
      "related_medication": "와파린",
      "risk_level": "moderate"
    }
  ],
  "intake_schedule": [
    {
      "time_slot": "morning_after_meal",
      "supplement_name": "비타민 D 1000IU",
      "spacing_hours": 2,
      "avoid_with": ["와파린"]
    }
  ]
}
```

### 필드 규칙

| 필드 | 필수 | 값 |
|---|---|---|
| `nutrient_stack[].nutrient` | ✅ | 문자열 |
| `nutrient_stack[].nutrient_category` | ✅ | `deficient`(부족) \| `synergy`(같이 먹으면 좋음) \| `maintain`(유지) \| `reduce`(줄이기) |
| `nutrient_stack[].recommended_dose` | ✅ | 문자열 (예: `"1000IU / 1일 1회"`) |
| `nutrient_stack[].rationale` | ✅ | 한국어 문장 |
| `nutrient_stack[].evidence` | ⬜ | 없으면 `null` |
| `cautions[].caution` | ✅ | 한국어 문장 |
| `cautions[].interaction_type` | ✅ | `supplement_medication` \| `supplement_supplement` \| `supplement_food` \| `dose_limit` \| `condition` |
| `cautions[].related_supplement` | ⬜ | 문자열 또는 `null` |
| `cautions[].related_medication` | ⬜ | 문자열 또는 `null` |
| `cautions[].risk_level` | ✅ | `low` \| `moderate` \| `high` |
| `intake_schedule[].time_slot` | ✅ | GLOSSARY §4-3 의 8개 값. 식전/식후가 값 안에 들어 있다 |
| `intake_schedule[].supplement_name` | ✅ | 문자열 |
| `intake_schedule[].spacing_hours` | ⬜ | 정수 0–24 또는 `null` |
| `intake_schedule[].avoid_with` | ⬜ | 그 시간대에 함께 먹으면 안 되는 영양제·약 이름 배열. 없으면 `[]` |

> ⚠️ **정의되지 않은 키를 추가하면 422 로 거부됩니다.** (`extra="forbid"`)
> 필드를 추가하고 싶으면 [GLOSSARY.md §5](./GLOSSARY.md) 절차대로 용어 PR 먼저 올려주세요.

### API Gateway 프록시 형식도 받습니다

```json
{ "statusCode": 200, "body": "{\"nutrient_stack\": [...], ...}" }
```

이렇게 감싸서 보내도 우리 쪽에서 풀어서 읽습니다.

---

## 3. 프롬프트 (권장)

`backend/app/services/prompt_builder.py` 에 **그대로 쓸 수 있는 시스템 프롬프트와
입력 문자열 생성 함수**가 들어 있습니다. 복사해서 쓰셔도 되고 직접 만드셔도 됩니다.

지켜야 할 것만 옮기면:

1. 진단·처방 금지. 약 용량을 바꾸라고 말하지 않기.
2. `medications` 가 있으면 **영양제 x 약 상호작용을 최우선**으로 다루기.
3. 불확실하면 추측하지 말고 "약사 상담 필요"로 적기.
4. 위험한 상호작용은 `risk_level: "high"`.
5. 모든 서술은 **한국어**.
6. `nutrient_category` 로 **부족해서 보충할 것**과 **같이 먹으면 좋은 것**을 구분하기.
7. 같은 시간대에 같이 먹으면 안 되는 것은 `avoid_with` 에 이름으로 적기.

---

## 4. 우리 쪽 연결 방법 (백엔드 담당자용)

`backend/.env` 에서 한 줄만 바꾸면 됩니다. 코드 수정 없습니다.

### (A) API Gateway / Lambda Function URL — HTTP 호출

```bash
LLM_PROVIDER=http
LLM_API_BASE_URL=https://xxxx.execute-api.ap-northeast-2.amazonaws.com/prod
LLM_API_PATH=/analyze
LLM_API_KEY=발급받은-키   # 필요 없으면 비워두기
```

### (B) Lambda 직접 invoke

```bash
LLM_PROVIDER=lambda
AWS_REGION=ap-northeast-2
LAMBDA_FUNCTION_NAME=bootcamp2026-drug-analyze
```

`pip install boto3` 추가로 필요합니다. **AWS 키는 .env 에 적지 말고**
`aws configure` 또는 EC2/ECS 의 IAM Role 을 사용하세요.

### (C) 아직 AWS 가 준비 안 됐을 때 (기본값)

```bash
LLM_PROVIDER=mock
```

고정 응답이 나와서 **프론트엔드 작업을 계속할 수 있습니다.**

---

## 5. 담당자 체크리스트

- [ ] 엔드포인트 URL 을 백엔드 담당자에게 전달
- [ ] API 키가 필요하면 함께 전달 (Slack DM, 코드에 커밋 금지)
- [ ] CORS 는 신경 안 써도 됩니다 — 브라우저가 아니라 **우리 서버가 호출**합니다
- [ ] 타임아웃은 30초 기준입니다. 더 필요하면 알려주세요 (`LLM_TIMEOUT_SECONDS`)
- [ ] 응답 예시 1건을 위 형식대로 보내주시면 바로 붙여보겠습니다

---

## 6. 저장소 안의 기본 구현 (`infra/llm/`)

| 파일 | 내용 |
|---|---|
| `infra/llm/handler.py` | 요청 JSON → 프롬프트 → Bedrock 호출 → 계약 JSON |
| `infra/llm/schema.py` | 응답 JSON 스키마. 2절 표와 같아야 한다 |
| `infra/llm-template.yaml` | Lambda + API Gateway REST API + API key + 사용량 계획 |

**Bedrock 에서 확인된 제약** (2026-08 기준, ap-northeast-2):

- `output_config.format`(구조화 출력)과 `tools[].strict` 는 **둘 다 400 으로 거부**된다.
  그래서 스키마는 *도구 하나를 강제로 쓰게 하는* 방식(`tool_choice`)으로 지킨다.
  최종 검증은 백엔드의 `AnalysisBody` 가 한다.
- on-demand 모델 ID(`anthropic.claude-opus-5`)는 거부된다. **추론 프로파일 ID**(`global.` 접두사)를 써야 한다.
- `output_config.effort` 는 동작한다. 지연 시간을 줄이는 주 레버다.
