/**
 * 화면에 보여줄 한국어 라벨. enum 값 -> 라벨 매핑은 여기 한 곳에서만 정의한다.
 * 컴포넌트마다 같은 표를 다시 만들지 말 것.
 * enum 값 자체는 docs/GLOSSARY.md 4절이 단일 출처다.
 */

import type {
  DoseUnit,
  InteractionType,
  NutrientCategory,
  RiskLevel,
  TimeSlot,
} from "@/types/analysis";

export const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  wake_up: "기상 직후",
  morning_before_meal: "아침 식전",
  morning_after_meal: "아침 식후",
  noon_before_meal: "점심 식전",
  noon_after_meal: "점심 식후",
  evening_before_meal: "저녁 식전",
  evening_after_meal: "저녁 식후",
  bedtime: "취침 전",
};

/** select 에 넣을 순서. 하루 흐름대로. */
export const TIME_SLOTS: TimeSlot[] = [
  "wake_up",
  "morning_before_meal", "morning_after_meal",
  "noon_before_meal", "noon_after_meal",
  "evening_before_meal", "evening_after_meal",
  "bedtime",
];

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "낮음",
  moderate: "보통",
  high: "높음",
};

export const INTERACTION_LABEL: Record<InteractionType, string> = {
  supplement_medication: "영양제 x 약",
  supplement_supplement: "영양제 x 영양제",
  supplement_food: "영양제 x 음식",
  dose_limit: "섭취 상한",
  condition: "체질/연령",
};

/** 왜 추천하는지. GLOSSARY 4-6 */
export const NUTRIENT_CATEGORY_LABEL: Record<NutrientCategory, string> = {
  deficient: "부족",
  synergy: "같이 먹으면 좋음",
  maintain: "유지",
  reduce: "줄이기",
};

/** select 에 넣을 순서. 백엔드 DoseUnit enum 과 값이 같아야 한다. */
export const DOSE_UNITS: DoseUnit[] = [
  "hundred_million_cfu", "cfu",
  "mg", "g", "mcg", "ml", "iu",
  "tablet", "capsule", "softgel", "sachet", "scoop", "drop",
];

export const DOSE_UNIT_LABEL: Record<DoseUnit, string> = {
  hundred_million_cfu: "억 CFU (유산균)",
  cfu: "CFU",
  mg: "mg",
  g: "g",
  mcg: "mcg",
  ml: "ml",
  iu: "IU",
  tablet: "정",
  capsule: "캡슐",
  softgel: "연질캡슐",
  sachet: "포",
  scoop: "스쿱",
  drop: "방울",
};

/** 균 수로 세는 단위. 이걸 고르면 무게 안내를 띄운다. */
export const CFU_UNITS: DoseUnit[] = ["hundred_million_cfu", "cfu", "sachet"];
