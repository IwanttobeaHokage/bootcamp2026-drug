import type {
  AnalysisResult,
  CautionItem,
  InteractionType,
  RiskLevel,
  TimeSlot,
} from "@/types/analysis";

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
    const medicationFirst =
      Number(b.interactionType === "supplement_medication") -
      Number(a.interactionType === "supplement_medication");
    return medicationFirst !== 0 ? medicationFirst : RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
  });
}

export function AnalysisResultView({ result }: { result: AnalysisResult }) {
  const cautions = sortCautions(result.cautions);

  return (
    <section aria-label="분석 결과">
      <h2 className="result__heading">주의점</h2>
      {cautions.length === 0 ? (
        <p className="empty">특별히 표시할 주의점이 없습니다.</p>
      ) : (
        <ul className="list-plain">
          {/*
            영양제 x 약 상호작용과 위험도 high 는 맨 위에, 접지 않고 보여준다.
            docs/API.md · docs/TECH_SPEC.md 8절
          */}
          {cautions.map((item, index) => (
            <li
              className="caution"
              key={index}
              data-risk={item.riskLevel}
              data-interaction={item.interactionType}
            >
              <div className="caution__tags">
                <span className="tag tag--interaction">
                  {INTERACTION_LABEL[item.interactionType]}
                </span>
                <span className="tag tag--risk">위험도 {RISK_LABEL[item.riskLevel]}</span>
              </div>
              <div>{item.caution}</div>
              {item.relatedMedication && (
                <p className="caution__pair">
                  {item.relatedSupplement} ↔ {item.relatedMedication}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="result__heading">영양소 조합</h2>
      {result.nutrientStack.length === 0 ? (
        <p className="empty">추천할 영양소 조합이 없습니다.</p>
      ) : (
        <ul className="list-plain">
          {result.nutrientStack.map((item) => (
            <li className="nutrient" key={item.nutrient}>
              <strong className="nutrient__name">{item.nutrient}</strong>{" "}
              <span className="nutrient__dose">{item.recommendedDose}</span>
              <p className="nutrient__rationale">{item.rationale}</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="result__heading">섭취 시기</h2>
      {result.intakeSchedule.length === 0 ? (
        <p className="empty">표시할 섭취 일정이 없습니다.</p>
      ) : (
        <ul className="list-plain">
          {result.intakeSchedule.map((item, index) => (
            <li className="schedule" key={index}>
              <span className="schedule__slot">
                {TIME_SLOT_LABEL[item.timeSlot]} · {TIME_SLOT_LABEL[item.intakeTiming]}
              </span>
              <span>{item.supplementName}</span>
              {item.spacingHours != null && (
                <span className="schedule__spacing">약과 {item.spacingHours}시간 간격</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 면책 문구는 접거나 숨기지 않는다. docs/GLOSSARY.md 6절 */}
      <p className="disclaimer" role="note">
        {result.disclaimer}
      </p>
    </section>
  );
}
