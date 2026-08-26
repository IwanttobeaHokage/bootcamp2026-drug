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
  | "tablet" | "capsule" | "softgel" | "scoop" | "drop" | "sachet"
  /** 유산균은 무게가 아니라 균 수로 표시된다. GLOSSARY 4-2 */
  | "cfu" | "hundred_million_cfu";

/** 하루 8개 시점. 식전/식후가 값 안에 들어 있다. GLOSSARY 4-3 */
export type TimeSlot =
  | "wake_up"
  | "morning_before_meal" | "morning_after_meal"
  | "noon_before_meal" | "noon_after_meal"
  | "evening_before_meal" | "evening_after_meal"
  | "bedtime";

export type RiskLevel = "low" | "moderate" | "high";

/** 영양소를 왜 추천하는지. GLOSSARY 4-6 */
export type NutrientCategory = "deficient" | "synergy" | "maintain" | "reduce";

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
  /** 개수는 doseFrequency 와 같아야 한다. 1일 3회면 3개. */
  intakeTimes: TimeSlot[];
}

/** 복용 중인 약. 선택 입력. 영양제와의 상호작용 확인에만 쓴다. */
export interface Medication {
  medicationName: string;
  ingredient?: string;
  doseAmount?: number;
  doseUnit?: DoseUnit;
  doseFrequency?: number;
  intakeTimes: TimeSlot[];
}

export interface AnalysisRequest {
  userProfile: UserProfile;
  supplements: Supplement[];
  medications: Medication[];
}

export interface NutrientItem {
  nutrient: string;
  nutrientCategory: NutrientCategory;
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
  /** 값 자체에 식전/식후가 들어 있다. 시기 필드를 따로 두지 않는다. */
  timeSlot: TimeSlot;
  supplementName: string;
  spacingHours?: number | null;
  /** 이 시간대에 함께 섭취를 피할 영양제·약 이름 */
  avoidWith: string[];
}

export interface AnalysisResult {
  requestId: string;
  nutrientStack: NutrientItem[];
  cautions: CautionItem[];
  intakeSchedule: IntakeScheduleItem[];
  disclaimer: string;
}
