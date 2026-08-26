import { useState } from "react";
import { AnalysisRequestError, requestAnalysis } from "@/api/client";
import { AnalysisResultView } from "@/components/AnalysisResultView";
import { SupplementForm } from "@/components/SupplementForm";
import type { AnalysisRequest, AnalysisResult } from "@/types/analysis";

export function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (request: AnalysisRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(await requestAnalysis(request));
    } catch (err) {
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

      <SupplementForm isLoading={isLoading} onSubmit={handleSubmit} />

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div aria-busy={isLoading}>{result && <AnalysisResultView result={result} />}</div>
    </main>
  );
}
