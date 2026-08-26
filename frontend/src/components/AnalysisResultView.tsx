import type { AnalysisResult } from "types/analysis";

const RISK_LABEL = { low: "낮음", moderate: "보통", high: "높음" } as const;

export function AnalysisResultView({ result }: { result: AnalysisResult }) {
  return (
    <section>
      <h2>추천 영양소 조합</h2>
      <ul>
        {result.nutrientStack.map((item) => (
          <li key={item.nutrient}>
            <strong>{item.nutrient}</strong> — {item.recommendedDose}
            <p>{item.rationale}</p>
          </li>
        ))}
      </ul>

      <h2>주의점</h2>
      <ul>
        {result.cautions.map((item, index) => (
          <li key={index} data-risk={item.riskLevel}>
            [위험도 {RISK_LABEL[item.riskLevel]}] {item.caution}
          </li>
        ))}
      </ul>

      <h2>복용시기</h2>
      <ul>
        {result.intakeSchedule.map((item, index) => (
          <li key={index}>
            {item.timeSlot} · {item.intakeTiming} — {item.nutrient}
            {item.spacingHours != null && ` (약과 ${item.spacingHours}시간 간격)`}
          </li>
        ))}
      </ul>

      {/* 면책 문구는 접거나 숨기지 않는다. docs/GLOSSARY.md §6 */}
      <p role="note">{result.disclaimer}</p>
    </section>
  );
}
