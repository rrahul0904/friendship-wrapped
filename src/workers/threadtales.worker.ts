/// <reference lib="webworker" />

import { runAnalysisRequest } from "../lib/worker-engine";
import type { WorkerRequest, WorkerResponse } from "../lib/worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

const cancelled = new Set<string>();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === "CANCEL") {
    cancelled.add(request.requestId);
    self.postMessage({ type: "CANCELLED", requestId: request.requestId } satisfies WorkerResponse);
    return;
  }

  if (cancelled.has(request.requestId)) {
    self.postMessage({ type: "CANCELLED", requestId: request.requestId } satisfies WorkerResponse);
    return;
  }

  runAnalysisRequest(request, (response) => {
    if (!cancelled.has(request.requestId)) self.postMessage(response);
  });
};

export {};
