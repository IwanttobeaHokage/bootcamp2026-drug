import {
  INTERACTION_LABEL,
  NUTRIENT_CATEGORY_LABEL,
  RISK_LABEL,
  TIME_SLOT_LABEL,
} from "@/constants/labels";
import type { AnalysisResult, CautionItem, RiskLevel } from "@/types/analysis";

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
          {result.nutrientStack.map((item, index) => (
            <li className="nutrient" key={index} data-category={item.nutrientCategory}>
              <strong className="nutrient__name">{item.nutrient}</strong>{" "}
              <span className="tag tag--category">
                {NUTRIENT_CATEGORY_LABEL[item.nutrientCategory]}
              </span>{" "}
              <span className="nutrient__dose">{item.recommendedDose}</span>
              <p className="nutrient__rationale">{item.rationale}</p>
              {item.evidence && <p className="nutrient__evidence">근거: {item.evidence}</p>}
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
              {item.avoidWith.length > 0 && (
                <span className="schedule__avoid">
                  함께 피하기: {item.avoidWith.join(", ")}
                </span>
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
