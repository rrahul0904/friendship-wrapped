import type { DateOrder, ThreadTaleResultV2 } from "./types";

export type AnalysisStage = "validating" | "parsing" | "analyzing" | "finalizing";

export type WorkerContent =
  | { kind: "text"; text: string }
  | { kind: "buffer"; buffer: ArrayBuffer };

export type WorkerRequest =
  | {
      type: "ANALYZE_CHAT";
      requestId: string;
      content: WorkerContent;
      options: { dateOrder: DateOrder };
    }
  | {
      type: "CANCEL";
      requestId: string;
    };

export interface WorkerErrorPayload {
  code: "INVALID_INPUT" | "TOO_FEW_MESSAGES" | "ANALYSIS_FAILED" | "CANCELLED";
  message: string;
}

export type WorkerResponse =
  | { type: "PROGRESS"; requestId: string; stage: AnalysisStage; messageCount?: number }
  | { type: "SUCCESS"; requestId: string; result: ThreadTaleResultV2 }
  | { type: "ERROR"; requestId: string; error: WorkerErrorPayload }
  | { type: "CANCELLED"; requestId: string };

export function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  const requestId = (value as { requestId?: unknown }).requestId;
  return typeof requestId === "string" && ["PROGRESS", "SUCCESS", "ERROR", "CANCELLED"].includes(String(type));
}
