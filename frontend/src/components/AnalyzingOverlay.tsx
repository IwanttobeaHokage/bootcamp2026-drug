/**
 * 분석 중에 보여주는 진행 화면.
 *
 * 서버는 한 번의 요청으로 끝나므로 여기 단계는 실제 처리 순서와 1:1로 맞지 않는다.
 * 기다리는 동안 무슨 일이 일어나는지 알려주려고 순서대로 보여주는 안내다.
 */

import { useEffect, useState } from "react";

const PHASES = [
  "입력 내용을 확인하는 중",
  "영양제 성분을 정리하는 중",
  "약과의 상호작용을 확인하는 중",
  "섭취 시기를 계산하는 중",
  "결과를 정리하는 중",
];

/** 마지막 단계에서는 멈춰서 계속 기다린다. 없는 진행률을 만들지 않는다. */
const PHASE_MS = 1100;

export function AnalyzingOverlay({ isOpen }: { isOpen: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setPhase(0);
      return;
    }
    const timer = window.setInterval(() => {
      setPhase((prev) => Math.min(prev + 1, PHASES.length - 1));
    }, PHASE_MS);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="analyzing" role="status" aria-live="polite">
      <div className="analyzing__card">
        <div className="analyzing__pill" aria-hidden="true" />

        <p className="analyzing__now">{PHASES[phase]}…</p>

        <ol className="analyzing__list">
          {PHASES.map((label, index) => (
            <li
              key={label}
              className="analyzing__step"
              data-state={index < phase ? "done" : index === phase ? "current" : "todo"}
            >
              <span className="analyzing__mark" aria-hidden="true">
                {index < phase ? "✓" : "•"}
              </span>
              {label}
            </li>
          ))}
        </ol>

        <p className="analyzing__hint">잠시만 기다려 주세요. 보통 10초 안에 끝납니다.</p>
      </div>
    </div>
  );
}
