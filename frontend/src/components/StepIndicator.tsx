/** 몇 단계 중 몇 번째인지 보여준다. 클릭으로 이미 지난 단계로 돌아갈 수 있다. */

interface Props {
  steps: string[];
  current: number;
  onGoTo: (index: number) => void;
}

export function StepIndicator({ steps, current, onGoTo }: Props) {
  return (
    <ol className="steps" aria-label="입력 단계">
      {steps.map((label, index) => {
        const state = index === current ? "current" : index < current ? "done" : "todo";
        return (
          <li key={label} className="steps__item" data-state={state}>
            <button
              type="button"
              className="steps__dot"
              // 지나온 단계만 되돌아갈 수 있다. 앞 단계는 검증을 거쳐야 하므로 막는다.
              disabled={index > current}
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
