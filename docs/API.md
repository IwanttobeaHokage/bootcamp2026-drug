# 🔌 API — bootcamp2026-drug

Base URL: `http://localhost:8000`
모든 JSON 필드는 `snake_case`. 용어는 [GLOSSARY.md](./GLOSSARY.md)에 정의된 것만 사용.

---

## `POST /api/v1/analyses`

복용약 + 사용자 프로필을 받아 영양소 조합 / 주의점 / 복용시기를 분석합니다.

### Request

```json
{
  "user_profile": {
    "age": 34,
    "sex": "male",
    "weight_kg": 72.5
  },
  "medications": [
    {
      "medication_name": "메트포르민",
      "dose_amount": 500,
      "dose_unit": "mg",
      "dose_frequency": 2,
      "intake_time": "after_meal"
    }
  ]
}
```

### Response `200`

```json
{
  "request_id": "a1b2c3d4",
  "nutrient_stack": [
    {
      "nutrient": "비타민 B12",
      "recommended_dose": "1000mcg / 1일 1회",
      "rationale": "메트포르민 장기 복용 시 B12 흡수가 저하될 수 있습니다.",
      "evidence": "일반적으로 알려진 상호작용"
    }
  ],
  "cautions": [
    {
      "caution": "칼슘 보충제와 동시 복용 시 흡수 간섭 가능",
      "interaction": "metformin x calcium",
      "risk_level": "moderate"
    }
  ],
  "intake_schedule": [
    {
      "time_slot": "morning",
      "intake_timing": "after_meal",
      "nutrient": "비타민 B12",
      "spacing_hours": 2
    }
  ],
  "disclaimer": "본 정보는 일반적인 참고용이며 의학적 진단·처방을 대체하지 않습니다. 복용 중인 약이 있다면 반드시 의사 또는 약사와 상담하세요."
}
```

### 에러

| 코드 | 상황 | 응답 |
|---|---|---|
| `422` | 필드 누락 / enum 값 오류 | FastAPI 기본 validation 에러 |
| `502` | LLM 응답이 스키마와 불일치 (재시도 후에도) | `{"detail": "analysis_failed"}` |

---

## `GET /health`

```json
{ "status": "ok" }
```
