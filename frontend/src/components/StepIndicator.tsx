/** 몇 단계 중 몇 번째인지 보여준다. 클릭으로 이미 지난 단계로 돌아갈 수 있다. */

interface Props {
  steps: string[];
  current: number;
  /** 눌러서 갈 수 있는 마지막 단계. 결과를 이미 받았으면 결과 단계까지 열어준다. */
  maxReachable?: number;
  onGoTo: (index: number) => void;
}

export function StepIndicator({ steps, current, maxReachable, onGoTo }: Props) {
  const limit = Math.max(maxReachable ?? current, current);

  return (
    <ol className="steps" aria-label="입력 단계">
      {steps.map((label, index) => {
        const state = index === current ? "current" : index < current ? "done" : "todo";
        return (
          <li key={label} className="steps__item" data-state={state}>
            <button
              type="button"
              className="steps__dot"
              // 아직 안 가본 단계는 막는다. 검증을 건너뛰고 앞으로 가지 못하게.
              disabled={index > limit}
              aria-current={index === current ? "step" : undefined}
              onClick={() => onGoTo(index)}
            >
              {index < current ? "✓" : index + 1}
            </button>
            <span className="steps__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
