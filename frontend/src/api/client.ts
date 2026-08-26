import type { AnalysisRequest, AnalysisResult } from "@/types/analysis";
import { camelizeKeys, snakeizeKeys } from "./case";

// Lambda Function URL 은 끝에 / 가 붙어서 나온다. 그대로 두면 경로가 //api/v1/... 이 된다.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const TIMEOUT_MS = 70_000; // 타임아웃 체인의 가장 바깥. 백엔드 Lambda(60초)보다 길게.

/** 화면에 그대로 띄울 수 있는 실패 원인. 상태코드별 문구는 여기서만 정한다. */
export class AnalysisRequestError extends Error {
  constructor(readonly userMessage: string) {
    super(userMessage);
    this.name = "AnalysisRequestError";
  }
}

export async function requestAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/v1/analyses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snakeizeKeys(request)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new AnalysisRequestError("서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.");
  }

  if (!response.ok) {
    // 422 는 입력값 문제라 사용자가 고칠 수 있다. 그 외는 서버 쪽 문제.
    throw new AnalysisRequestError(
      response.status === 422
        ? "입력값을 다시 확인해 주세요. 섭취량은 0보다 커야 합니다."
        : "분석에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  return camelizeKeys(await response.json()) as AnalysisResult;
}
