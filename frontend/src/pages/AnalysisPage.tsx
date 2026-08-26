/**
 * 전체 흐름: 내 정보 -> 영양제 -> 복용 약 -> 결과.
 *
 * 결과가 마지막 단계로 붙기 때문에 단계 상태는 폼이 아니라 여기가 들고 있다.
 */

import { useState } from "react";
import { AnalysisRequestError, requestAnalysis } from "@/api/client";
import { AnalysisResultView } from "@/components/AnalysisResultView";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { StepIndicator } from "@/components/StepIndicator";
import { INPUT_STEPS, SupplementForm } from "@/components/SupplementForm";
import type { AnalysisRequest, AnalysisResult } from "@/types/analysis";

const STEPS = [...INPUT_STEPS, "결과"];
const RESULT_STEP = STEPS.length - 1;

export function AnalysisPage() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (request: AnalysisRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await requestAnalysis(request));
      setStep(RESULT_STEP);
    } catch (err) {
      // 실패하면 입력 단계에 머문다. 빈 결과 화면을 보여주지 않는다.
      setError(
        err instanceof AnalysisRequestError
          ? err.userMessage
          : "분석에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <h1 className="page__title">영양제 조합 분석</h1>
      <p className="page__lead">
        먹고 있는 영양제를 입력하면 조합·주의점·섭취 시기를 정리해 드립니다.
      </p>
      <p className="page__note">
        복용 중인 약을 함께 입력하면, 그 약과 부딪히는 영양제를 가장 먼저 알려드립니다.
      </p>

      {/* 결과를 본 뒤에도 입력으로 돌아갈 수 있다. 결과는 지우지 않는다. */}
      <StepIndicator
        steps={STEPS}
        current={step}
        maxReachable={result ? RESULT_STEP : step}
        onGoTo={setStep}
      />

      {step < RESULT_STEP && (
        <SupplementForm
          step={step}
          isLoading={isLoading}
          onStepChange={setStep}
          onSubmit={handleSubmit}
        />
      )}

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {step === RESULT_STEP && result && (
        <>
          <AnalysisResultView result={result} />
          <div className="wizard-nav">
            <button type="button" className="btn-ghost" onClick={() => setStep(0)}>
              처음부터 다시
            </button>
            <button type="button" className="btn-submit" onClick={() => setStep(1)}>
              영양제 고치기
            </button>
          </div>
        </>
      )}

      <AnalyzingOverlay isOpen={isLoading} />
    </main>
  );
}
