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

function createBrowserWorker() {
  return new Worker(new URL("../workers/threadtales.worker.ts", import.meta.url), { type: "module" });
}

export function createAnalysisTask(
  content: string | ArrayBuffer,
  dateOrder: DateOrder,
  onProgress: (progress: AnalysisProgress) => void,
  workerFactory: () => Worker = createBrowserWorker,
): AnalysisTask {
  const requestId = crypto.randomUUID();
  const worker = workerFactory();
  let settled = false;
  let rejectTask: ((reason?: unknown) => void) | null = null;

  const promise = new Promise<ThreadTaleResultV2>((resolve, reject) => {
    rejectTask = reject;

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
      try {
        worker.postMessage({ type: "CANCEL", requestId } satisfies WorkerRequest);
      } catch {
        // A Worker that has already failed may reject postMessage; termination
        // and local promise cancellation are still the source of truth.
      }
      worker.terminate();
      rejectTask?.(new DOMException("Analysis cancelled", "AbortError"));
    },
  };
}
