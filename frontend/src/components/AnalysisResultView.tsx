import type { AnalysisResult, CautionItem, InteractionType, RiskLevel, TimeSlot } from "@/types/analysis";

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "낮음",
  moderate: "보통",
  high: "높음",
};

const INTERACTION_LABEL: Record<InteractionType, string> = {
  supplement_medication: "영양제 x 약",
  supplement_supplement: "영양제 x 영양제",
  supplement_food: "영양제 x 음식",
  dose_limit: "섭취 상한",
  condition: "체질/연령",
};

const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  morning: "아침",
  noon: "점심",
  evening: "저녁",
  bedtime: "취침 전",
  before_meal: "식전",
  with_meal: "식사와 함께",
  after_meal: "식후",
  empty_stomach: "공복",
};

/** 약과 부딪히는 주의점, 위험도 높은 순으로 먼저 보여준다. */
const RISK_ORDER: Record<RiskLevel, number> = { high: 0, moderate: 1, low: 2 };

function sortCautions(cautions: CautionItem[]): CautionItem[] {
  return [...cautions].sort((a, b) => {
    const drugFirst =
      Number(b.interactionType === "supplement_medication") -
      Number(a.interactionType === "supplement_medication");
    return drugFirst !== 0 ? drugFirst : RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
  });
}

export function AnalysisResultView({ result }: { result: AnalysisResult }) {
  return (
    <section>
      <h2>주의점</h2>
      <ul>
        {sortCautions(result.cautions).map((item, index) => (
          <li key={index} data-risk={item.riskLevel} data-interaction={item.interactionType}>
            <strong>
              [{INTERACTION_LABEL[item.interactionType]} · 위험도 {RISK_LABEL[item.riskLevel]}]
            </strong>{" "}
            {item.caution}
            {item.relatedMedication && (
              <em> — {item.relatedSupplement} ↔ {item.relatedMedication}</em>
            )}
          </li>
        ))}
      </ul>

      <h2>영양소 조합</h2>
      <ul>
        {result.nutrientStack.map((item) => (
          <li key={item.nutrient}>
            <strong>{item.nutrient}</strong> — {item.recommendedDose}
            <p>{item.rationale}</p>
          </li>
        ))}
      </ul>

      <h2>섭취 시기</h2>
      <ul>
        {result.intakeSchedule.map((item, index) => (
          <li key={index}>
            {TIME_SLOT_LABEL[item.timeSlot]} · {TIME_SLOT_LABEL[item.intakeTiming]} —{" "}
            {item.supplementName}
            {item.spacingHours != null && ` (약과 ${item.spacingHours}시간 간격)`}
          </li>
        ))}
      </ul>

      {/* 면책 문구는 접거나 숨기지 않는다. docs/GLOSSARY.md 6절 */}
      <p role="note">{result.disclaimer}</p>
    </section>
  );
}
