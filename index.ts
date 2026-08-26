export interface UserHealthProfile {
  age: number | '';
  gender: 'male' | 'female' | 'other' | '';
  weight: number | '';
  supplements: string[];
  medications: string[];
  healthGoals?: string;
}

export interface ScheduleItem {
  timeSlot: string;
  items: string[];
  tip: string;
}

export interface Recommendation {
  action: 'add' | 'remove' | 'maintain';
  name: string;
  reason: string;
}

export interface CautionItem {
  level: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
}

export interface AnalysisResponse {
  schedule: ScheduleItem[];
  recommendations: Recommendation[];
  cautions: CautionItem[];
  overallFeedback: string;
}
