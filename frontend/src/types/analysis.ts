/**
 * docs/GLOSSARY.md 의 표준 용어를 camelCase 로 옮긴 타입.
 * 여기 없는 이름을 컴포넌트에서 만들어 쓰지 말 것.
 * 새 필드가 필요하면 GLOSSARY -> 백엔드 스키마 -> 이 파일 순서로 추가한다.
 */

export type Sex = "male" | "female" | "other";

export type DoseUnit =
  | "mg" | "g" | "mcg" | "ml" | "iu"
  | "tablet" | "capsule" | "drop" | "puff";

export type TimeSlot =
  | "morning" | "noon" | "evening" | "bedtime"
  | "before_meal" | "with_meal" | "after_meal" | "empty_stomach";

export type RiskLevel = "low" | "moderate" | "high";

export interface UserProfile {
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm?: number;
}

export interface Medication {
  medicationName: string;
  ingredient?: string;
  doseAmount: number;
  doseUnit: DoseUnit;
  doseFrequency: number;
  intakeTime: TimeSlot;
}

export interface AnalysisRequest {
  userProfile: UserProfile;
  medications: Medication[];
}

export interface NutrientItem {
  nutrient: string;
  recommendedDose: string;
  rationale: string;
  evidence?: string;
}

export interface CautionItem {
  caution: string;
  interaction?: string;
  riskLevel: RiskLevel;
}

export interface IntakeScheduleItem {
  timeSlot: TimeSlot;
  intakeTiming: TimeSlot;
  nutrient: string;
  spacingHours?: number;
}

export interface AnalysisResult {
  requestId: string;
  nutrientStack: NutrientItem[];
  cautions: CautionItem[];
  intakeSchedule: IntakeScheduleItem[];
  disclaimer: string;
}
