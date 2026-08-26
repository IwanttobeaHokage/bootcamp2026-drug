import type { AnalysisRequest, AnalysisResult } from "@/types/analysis";
import { camelizeKeys, snakeizeKeys } from "./case";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function requestAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const response = await fetch(`${BASE_URL}/api/v1/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snakeizeKeys(request)),
  });

  if (!response.ok) {
    throw new Error(`analysis request failed: ${response.status}`);
  }

  return camelizeKeys(await response.json()) as AnalysisResult;
}
