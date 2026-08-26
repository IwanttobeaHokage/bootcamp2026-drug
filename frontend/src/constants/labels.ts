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
  morning: "아침",
  noon: "점심",
  evening: "저녁",
  bedtime: "취침 전",
  before_meal: "식전",
  with_meal: "식사와 함께",
  after_meal: "식후",
  empty_stomach: "공복",
};

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
  "mg", "g", "mcg", "ml", "iu",
  "tablet", "capsule", "softgel", "scoop", "drop",
];
