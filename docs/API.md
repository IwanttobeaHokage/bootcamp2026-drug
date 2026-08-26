# 🔌 API — bootcamp2026-drug

Base URL: `http://localhost:8000`
모든 JSON 필드는 `snake_case`. 용어는 [GLOSSARY.md](./GLOSSARY.md) 에 정의된 것만 사용.

> 외부 LLM(AWS)이 지켜야 할 계약은 [LLM_CONTRACT.md](./LLM_CONTRACT.md) 를 보세요.
> 이 문서는 **프론트엔드 ↔ 우리 백엔드** 사이의 계약입니다.

---

## `POST /api/v1/analyses`

영양제 목록 + 사용자 프로필(+선택: 복용 중인 약)을 받아
영양소 조합 / 주의점 / 섭취 시기를 돌려줍니다.

### Request

```json
{
  "user_profile": {
    "age": 30,
    "sex": "female",
    "weight_kg": 55.0
  },
  "supplements": [
    {
      "supplement_name": "비타민 D 1000IU",
      "nutrient": "비타민 D",
      "dose_amount": 1000,
      "dose_unit": "iu",
      "dose_frequency": 1,
      "intake_times": ["morning_after_meal"]
    }
  ],
  "medications": [
    { "medication_name": "와파린" }
  ]
}
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `user_profile` | ✅ | 나이·성별·체중 |
| `supplements` | ✅ | **1개 이상 20개 이하** |
| `medications` | ⬜ | 생략하거나 `[]` 가능. 넣으면 상호작용을 확인 |

### Response `200`

```json
{
  "request_id": "a1b2c3d4",
  "nutrient_stack": [
    {
      "nutrient": "비타민 D",
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
  ],
  "disclaimer": "본 정보는 일반적인 참고용이며 의학적 진단·처방을 대체하지 않습니다. 복용 중인 약이 있다면 반드시 의사 또는 약사와 상담하세요."
}
```

프론트엔드는 `interaction_type: "supplement_medication"` 인 주의점을
**가장 위에, 접히지 않게** 표시합니다.

### 에러

| 코드 | 상황 | 응답 |
|---|---|---|
| `422` | 필드 누락 / enum 값 오류 / **GLOSSARY 에 없는 필드명** | FastAPI validation 에러 |
| `502` | 외부 LLM 호출 실패 또는 응답이 계약과 불일치 | `{"detail": "analysis_failed"}` |

---

## `GET /health`

```json
{ "status": "ok" }
```
