/**
 * docs/GLOSSARY.md 의 표준 용어를 camelCase 로 옮긴 타입.
 * 여기 없는 이름을 컴포넌트에서 만들어 쓰지 말 것.
 * 새 필드가 필요하면 GLOSSARY -> 백엔드 스키마 -> 이 파일 순서로 추가한다.
 *
 * 주체는 영양제(supplement). 약(medication)은 상호작용 확인용 선택 입력.
 */

export type Sex = "male" | "female" | "other";

export type DoseUnit =
  | "mg" | "g" | "mcg" | "ml" | "iu"
  | "tablet" | "capsule" | "softgel" | "scoop" | "drop";

export type TimeSlot =
  | "morning" | "noon" | "evening" | "bedtime"
  | "before_meal" | "with_meal" | "after_meal" | "empty_stomach";

export type RiskLevel = "low" | "moderate" | "high";

export type InteractionType =
  | "supplement_medication"
  | "supplement_supplement"
  | "supplement_food"
  | "dose_limit"
  | "condition";

export interface UserProfile {
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm?: number;
}

/** 사용자가 먹고 있는 영양제 1건 */
export interface Supplement {
  supplementName: string;
  nutrient?: string;
  doseAmount: number;
  doseUnit: DoseUnit;
  doseFrequency: number;
  intakeTime: TimeSlot;
}

/** 복용 중인 약. 선택 입력. 영양제와의 상호작용 확인에만 쓴다. */
export interface Medication {
  medicationName: string;
  ingredient?: string;
  doseAmount?: number;
  doseUnit?: DoseUnit;
  doseFrequency?: number;
  intakeTime?: TimeSlot;
}

export interface AnalysisRequest {
  userProfile: UserProfile;
  supplements: Supplement[];
  medications: Medication[];
}

export interface NutrientItem {
  nutrient: string;
  recommendedDose: string;
  rationale: string;
  evidence?: string | null;
}

export interface CautionItem {
  caution: string;
  interactionType: InteractionType;
  relatedSupplement?: string | null;
  relatedMedication?: string | null;
  riskLevel: RiskLevel;
}

export interface IntakeScheduleItem {
  timeSlot: TimeSlot;
  intakeTiming: TimeSlot;
  supplementName: string;
  spacingHours?: number | null;
}

export interface AnalysisResult {
  requestId: string;
  nutrientStack: NutrientItem[];
  cautions: CautionItem[];
  intakeSchedule: IntakeScheduleItem[];
  disclaimer: string;
}
