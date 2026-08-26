import { useState } from "react";
import { requestAnalysis } from "api/client";
import { AnalysisResultView } from "components/AnalysisResultView";
import { MedicationForm } from "components/MedicationForm";
import type { AnalysisRequest, AnalysisResult } from "types/analysis";

export function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (request: AnalysisRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(await requestAnalysis(request));
    } catch {
      setError("분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <h1>복용약 영양소 분석</h1>
      <MedicationForm isLoading={isLoading} onSubmit={handleSubmit} />
      {error && <p role="alert">{error}</p>}
      {result && <AnalysisResultView result={result} />}
    </main>
  );
}
