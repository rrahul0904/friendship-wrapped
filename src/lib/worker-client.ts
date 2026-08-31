import type { DateOrder, ThreadTaleResultV2 } from "./types";
import type { AnalysisStage, WorkerRequest, WorkerResponse } from "./worker-protocol";
import { isWorkerResponse } from "./worker-protocol";

export interface AnalysisProgress {
  stage: AnalysisStage;
  messageCount?: number;
}

export interface AnalysisTask {
  requestId: string;
  promise: Promise<ThreadTaleResultV2>;
  cancel: () => void;
}

export function createAnalysisTask(
  content: string | ArrayBuffer,
  dateOrder: DateOrder,
  onProgress: (progress: AnalysisProgress) => void,
): AnalysisTask {
  const requestId = crypto.randomUUID();
  const worker = new Worker(new URL("../workers/threadtales.worker.ts", import.meta.url), { type: "module" });
  let settled = false;

  const promise = new Promise<ThreadTaleResultV2>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (!isWorkerResponse(event.data) || event.data.requestId !== requestId || settled) return;
      const response: WorkerResponse = event.data;
      if (response.type === "PROGRESS") {
        onProgress({ stage: response.stage, messageCount: response.messageCount });
        return;
      }
      settled = true;
      worker.terminate();
      if (response.type === "SUCCESS") resolve(response.result);
      else if (response.type === "ERROR") reject(new Error(response.error.message));
      else reject(new DOMException("Analysis cancelled", "AbortError"));
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      worker.terminate();
      reject(new Error("The browser analysis worker stopped unexpectedly. Please try again."));
    };

    const request: Extract<WorkerRequest, { type: "ANALYZE_CHAT" }> = {
      type: "ANALYZE_CHAT",
      requestId,
      content: typeof content === "string" ? { kind: "text", text: content } : { kind: "buffer", buffer: content },
      options: { dateOrder },
    };

    if (typeof content === "string") worker.postMessage(request);
    else worker.postMessage(request, [content]);
  });

  return {
    requestId,
    promise,
    cancel: () => {
      if (settled) return;
      settled = true;
      worker.postMessage({ type: "CANCEL", requestId } satisfies WorkerRequest);
      worker.terminate();
    },
  };
}
